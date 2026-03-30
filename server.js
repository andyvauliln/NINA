const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const multer = require("multer");
const os = require("os");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const ROOT_DIR = __dirname;
const DATA_FILE = path.join(ROOT_DIR, "data.json");
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
const ADMIN_AI_AGENT_CMD = process.env.ADMIN_AI_AGENT_CMD || "";
const ADMIN_AI_AGENT_CMD_CURSOR = process.env.ADMIN_AI_AGENT_CMD_CURSOR || "/home/superuser/.local/bin/cursor-agent --print --trust --force --workspace {cwd} --model {cursorModel} {cursorResumeFlags} {prompt}";
// OpenRouter disabled for now — Cursor only
// const ADMIN_AI_AGENT_CMD_OPENROUTER = process.env.ADMIN_AI_AGENT_CMD_OPENROUTER || "node scripts/openrouter-agent.mjs --cwd {cwd} --model {model} --prompt {prompt}";
const ADMIN_AI_DEFAULT_MODEL = process.env.ADMIN_AI_DEFAULT_MODEL || "auto";
const CURSOR_AGENT_DEFAULT_MODEL = process.env.CURSOR_AGENT_DEFAULT_MODEL || "auto";
const ADMIN_AI_AGENT_TIMEOUT_MS = Number(process.env.ADMIN_AI_AGENT_TIMEOUT_MS || 900000);
const ADMIN_AI_RESTART_TIMEOUT_MS = Number(process.env.ADMIN_AI_RESTART_TIMEOUT_MS || 120000);
const ADMIN_GIT_CHECKPOINT =
  String(process.env.ADMIN_GIT_CHECKPOINT || "1").trim() !== "0";
let aiChangeRunning = false;
let gitRevertRunning = false;

const AI_LOG_DIR = path.join(ROOT_DIR, "logs");
const AI_AGENT_LOG_FILE = path.join(AI_LOG_DIR, "ai-agent.log");
const AI_LOG_MAX_CHUNK = 64000;

async function appendAiAgentLog(payload) {
  try {
    await fs.mkdir(AI_LOG_DIR, { recursive: true });
    const chunk = (v) => {
      const t = String(v || "");
      return t.length > AI_LOG_MAX_CHUNK ? t.slice(0, AI_LOG_MAX_CHUNK) + "\n...[truncated]\n" : t;
    };
    const block = [
      "",
      "==== " + new Date().toISOString() + " " + payload.status + " ====",
      "provider: " + (payload.provider || ""),
      "model: " + (payload.model || ""),
      "command: " + chunk(payload.command),
      "--- agent stdout ---",
      chunk(payload.agentStdout),
      "--- agent stderr ---",
      chunk(payload.agentStderr),
      "--- restart stdout ---",
      chunk(payload.restartStdout),
      "--- restart stderr ---",
      chunk(payload.restartStderr),
      payload.error ? "--- error ---\n" + chunk(payload.error) : ""
    ].filter(Boolean).join("\n") + "\n";
    await fs.appendFile(AI_AGENT_LOG_FILE, block, "utf8");
  } catch {
    /* ignore log failures */
  }
}

async function touchAiLogOnStartup() {
  try {
    await fs.mkdir(AI_LOG_DIR, { recursive: true });
    await fs.appendFile(
      AI_AGENT_LOG_FILE,
      "\n==== " + new Date().toISOString() + " server start (ai-agent log) ====\n",
      "utf8"
    );
  } catch (e) {
    console.error("touchAiLogOnStartup:", e && e.message ? e.message : e);
  }
}

app.use(express.json());
app.use((req, res, next) => {
  if (req.path === "/logs" || req.path.startsWith("/logs/")) {
    return res.status(404).end();
  }
  next();
});
app.use(express.static(ROOT_DIR, { redirect: false }));

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const bookId = req.params.id || "unknown";
    const dir = path.join(UPLOADS_DIR, bookId);
    fs.mkdir(dir, { recursive: true }).then(() => cb(null, dir)).catch(cb);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    const bookId = req.params.id || "unknown";
    const type = req.body.type;
    const name = type === "main" ? bookId + ".main" : bookId + ".page" + String(req.body.index || "1");
    cb(null, name + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const mime = String(file.mimetype || "").toLowerCase();
    if (mime.startsWith("image/") || mime.startsWith("video/")) {
      cb(null, true);
      return;
    }
    req.uploadValidationError = "Only image/video files are allowed";
    cb(null, false);
  }
});

const readData = async () => {
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.categories)) {
    parsed.categories = [];
  }
  if (!parsed.main) {
    parsed.main = {};
  }
  if (!Array.isArray(parsed.bookViews)) {
    parsed.bookViews = [];
  }
  return parsed;
};

const sanitizeBookViewUnitWidth = (raw) => {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 10;
  return Math.min(120, Math.max(4, Math.round(n)));
};

const sanitizeBookViewUnitHeight = (raw) => {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 100;
  return Math.min(300, Math.max(10, Math.round(n)));
};

const writeData = async (data) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
};

const sanitizeBookPayload = (payload) => {
  const pageImages = Array.isArray(payload.pageImages)
    ? payload.pageImages.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];

  return {
    id: String(payload.id || "").trim(),
    title: String(payload.title || "").trim(),
    style: String(payload.style || "").trim(),
    category: String(payload.category || "").trim(),
    description: String(payload.description || "").trim(),
    mainImage: String(payload.mainImage || "").trim(),
    pageImages
  };
};

const validateBook = (book) => {
  if (!book.id) return "Book id is required";
  if (!book.title) return "Book title is required";
  if (!book.category) return "Book category is required";
  return null;
};

const ensureCategory = (data, categoryId) => {
  const normalized = String(categoryId || "").trim();
  let category = data.categories.find((item) => item && item.id === normalized);
  if (!category) {
    category = {
      id: normalized,
      title: normalized.charAt(0).toUpperCase() + normalized.slice(1),
      books: []
    };
    data.categories.push(category);
  }
  if (!Array.isArray(category.books)) {
    category.books = [];
  }
  return category;
};

const removeBookFromAllCategories = (data, bookId) => {
  data.categories.forEach((category) => {
    if (!Array.isArray(category.books)) return;
    category.books = category.books.filter((book) => book && book.id !== bookId);
  });
};

const shellEscape = (value) => {
  return "'" + String(value || "").replace(/'/g, "'\\''") + "'";
};

const runShellCommand = ({ command, cwd, timeoutMs }) => {
  const limit = typeof timeoutMs === "number" && timeoutMs > 0 ? timeoutMs : ADMIN_AI_AGENT_TIMEOUT_MS;
  return new Promise((resolve, reject) => {
    const child = spawn("bash", ["-lc", command], {
      cwd,
      env: process.env
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timer = null;

    const finish = (fn) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      fn();
    };

    timer = setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch {
        /* ignore */
      }
      setTimeout(() => {
        try {
          child.kill("SIGKILL");
        } catch {
          /* ignore */
        }
      }, 4000);
      const error = new Error("Agent command timed out after " + limit + "ms (set ADMIN_AI_AGENT_TIMEOUT_MS to increase)");
      error.code = "ETIMEDOUT";
      error.stdout = stdout;
      error.stderr = stderr + "\n[timed out]";
      finish(() => reject(error));
    }, limit);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (err) => finish(() => reject(err)));
    child.on("close", (code) => {
      finish(() => {
        if (code === 0) {
          resolve({ code, stdout, stderr });
          return;
        }
        const detail = String(stderr || "").trim();
        const msg = detail
          ? "Command failed (exit " + code + "): " + detail
          : "Command failed with exit code " + code;
        const error = new Error(msg);
        error.code = code;
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      });
    });
  });
};


async function tryGitCheckpointCommit() {
  if (!ADMIN_GIT_CHECKPOINT) {
    return { skipped: true, reason: "ADMIN_GIT_CHECKPOINT=0" };
  }
  try {
    await runShellCommand({
      command: "git rev-parse --is-inside-work-tree",
      cwd: ROOT_DIR,
      timeoutMs: 10000
    });
  } catch {
    return { skipped: true, reason: "not a git repository" };
  }
  const msg = "admin: AI agent checkpoint " + new Date().toISOString();
  try {
    await runShellCommand({
      command: "git add -A",
      cwd: ROOT_DIR,
      timeoutMs: 120000
    });
    await runShellCommand({
      command: "git commit -m " + shellEscape(msg),
      cwd: ROOT_DIR,
      timeoutMs: 60000
    });
    return { ok: true, message: msg };
  } catch (e) {
    const errText = String(e.stderr || e.message || "");
    if (/nothing to commit|no changes added to commit/i.test(errText)) {
      return { skipped: true, reason: "nothing to commit" };
    }
    return { ok: false, error: String(e.message || e), stderr: String(e.stderr || "") };
  }
}


app.get(["/nina-bejo", "/nina-bejo/"], (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

app.get(["/nina-bejo/admin", "/nina-bejo/admin/"], (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

app.get("/api/books-data", async (_req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to read data", detail: String(error.message || error) });
  }
});

app.post("/api/books", async (req, res) => {
  try {
    const data = await readData();
    const book = sanitizeBookPayload(req.body || {});
    const validationError = validateBook(book);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const duplicate = data.categories.some((category) =>
      Array.isArray(category.books) && category.books.some((item) => item && item.id === book.id)
    );
    if (duplicate) {
      return res.status(400).json({ error: "Book id already exists" });
    }

    const category = ensureCategory(data, book.category);
    category.books.push(book);
    await writeData(data);
    return res.status(201).json({ ok: true, book });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create book", detail: String(error.message || error) });
  }
});

app.put("/api/books/:id", async (req, res) => {
  try {
    const originalId = String(req.params.id || "").trim();
    const data = await readData();
    const book = sanitizeBookPayload(req.body || {});
    const validationError = validateBook(book);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    let existingBook = null;
    data.categories.forEach((category) => {
      if (!Array.isArray(category.books)) return;
      category.books.forEach((item) => {
        if (item && item.id === originalId) {
          existingBook = item;
        }
      });
    });
    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    if (book.id !== originalId) {
      const idConflict = data.categories.some((category) =>
        Array.isArray(category.books) && category.books.some((item) => item && item.id === book.id)
      );
      if (idConflict) {
        return res.status(400).json({ error: "Updated id already exists" });
      }
    }

    removeBookFromAllCategories(data, originalId);
    const category = ensureCategory(data, book.category);
    category.books.push(book);
    await writeData(data);
    return res.json({ ok: true, book });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update book", detail: String(error.message || error) });
  }
});

app.delete("/api/books/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    const data = await readData();
    let removed = false;

    data.categories.forEach((category) => {
      if (!Array.isArray(category.books)) return;
      const before = category.books.length;
      category.books = category.books.filter((book) => book && book.id !== id);
      if (category.books.length !== before) {
        removed = true;
      }
    });

    if (!removed) {
      return res.status(404).json({ error: "Book not found" });
    }

    await writeData(data);
    return res.json({ ok: true, id });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete book", detail: String(error.message || error) });
  }
});

const mainStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(UPLOADS_DIR, "main");
    fs.mkdir(dir, { recursive: true }).then(() => cb(null, dir)).catch(cb);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    const field = req.params.field || "image";
    cb(null, field + ext);
  }
});

const mainUpload = multer({ storage: mainStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const cvUpload = multer({
  storage: multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, path.join(ROOT_DIR, "assets"));
    },
    filename(_req, _file, cb) {
      cb(null, "cv.pdf");
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (file.mimetype === "application/pdf" || ext === ".pdf") {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF files are allowed"));
  }
});

app.get("/api/main-data", async (_req, res) => {
  try {
    const data = await readData();
    res.json(data.main || {});
  } catch (error) {
    res.status(500).json({ error: "Failed to read main data" });
  }
});

app.put("/api/main-data", async (req, res) => {
  try {
    const data = await readData();
    const allowed = [
      "logo",
      "headerImage",
      "footerImage",
      "tattooOverlay",
      "description",
      "description2",
      "email",
      "whatsapp",
      "instagram",
      "socialLink1",
      "socialLink2",
      "cvLink"
    ];
    const body = req.body || {};
    allowed.forEach(key => {
      if (body[key] !== undefined) {
        data.main[key] = String(body[key]);
      }
    });
    await writeData(data);
    res.json({ ok: true, main: data.main });
  } catch (error) {
    res.status(500).json({ error: "Failed to update main data" });
  }
});

app.post("/api/main/upload/:field", mainUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const field = req.params.field;
    const allowed = ["logo", "headerImage", "footerImage", "tattooOverlay"];
    if (!allowed.includes(field)) {
      return res.status(400).json({ error: "Invalid field" });
    }

    const dir = path.join(UPLOADS_DIR, "main");
    const files = await fs.readdir(dir).catch(() => []);
    for (const f of files) {
      if (f !== req.file.filename && f.startsWith(field + ".")) {
        await fs.unlink(path.join(dir, f)).catch(() => {});
      }
    }

    const filePath = "uploads/main/" + req.file.filename;
    const data = await readData();
    data.main[field] = filePath;
    await writeData(data);

    return res.json({ ok: true, path: filePath, field });
  } catch (error) {
    return res.status(500).json({ error: "Upload failed" });
  }
});

app.post("/api/main/upload-cv", cvUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const data = await readData();
    data.main.cvLink = "assets/cv.pdf";
    await writeData(data);
    return res.json({ ok: true, path: "assets/cv.pdf" });
  } catch (error) {
    if (error && error.message === "Only PDF files are allowed") {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }
    return res.status(500).json({ error: "CV upload failed" });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  try {
    const catId = String(req.params.id || "").trim();
    const data = await readData();
    const cat = data.categories.find(c => c && c.id === catId);
    if (!cat) return res.status(404).json({ error: "Category not found" });
    if (req.body.title !== undefined) {
      cat.title = String(req.body.title).trim();
    }
    await writeData(data);
    return res.json({ ok: true, category: cat });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update category" });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const data = await readData();
    const rawId = String(req.body && req.body.id != null ? req.body.id : "").trim().toLowerCase();
    const titleIn = String(req.body && req.body.title != null ? req.body.title : "").trim();
    if (!rawId) {
      return res.status(400).json({ error: "Category id is required" });
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(rawId)) {
      return res.status(400).json({ error: "Invalid id (lowercase letters, numbers, hyphens)" });
    }
    if (data.categories.some((c) => c && c.id === rawId)) {
      return res.status(400).json({ error: "Category id already exists" });
    }
    const cat = {
      id: rawId,
      title: titleIn || rawId.charAt(0).toUpperCase() + rawId.slice(1),
      books: []
    };
    data.categories.push(cat);
    await writeData(data);
    return res.status(201).json({ ok: true, category: cat });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create category" });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    const catId = String(req.params.id || "").trim();
    const data = await readData();
    if (!Array.isArray(data.categories) || data.categories.length <= 1) {
      return res.status(400).json({ error: "Cannot remove the last category" });
    }
    const idx = data.categories.findIndex((c) => c && c.id === catId);
    if (idx === -1) return res.status(404).json({ error: "Category not found" });
    data.categories.splice(idx, 1);
    await writeData(data);
    return res.json({ ok: true, id: catId });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete category" });
  }
});

app.post("/api/books/:id/upload", upload.single("file"), async (req, res) => {
  try {
    if (req.uploadValidationError) {
      return res.status(400).json({ error: req.uploadValidationError });
    }
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const bookId = req.params.id;
    const dir = path.join(UPLOADS_DIR, bookId);
    const baseName = req.body.type === "main" ? bookId + ".main" : bookId + ".page" + String(req.body.index || "1");

    const files = await fs.readdir(dir).catch(() => []);
    for (const f of files) {
      if (f !== req.file.filename && f.startsWith(baseName + ".")) {
        await fs.unlink(path.join(dir, f)).catch(() => {});
      }
    }

    const filePath = "uploads/" + bookId + "/" + req.file.filename;
    return res.json({ ok: true, path: filePath });
  } catch (error) {
    return res.status(500).json({ error: "Upload failed", detail: String(error.message || error) });
  }
});

app.get("/api/book-views", async (_req, res) => {
  try {
    const data = await readData();
    res.json(data.bookViews);
  } catch (error) {
    res.status(500).json({ error: "Failed to read book views" });
  }
});

app.post("/api/book-views", async (req, res) => {
  try {
    const data = await readData();
    const body = req.body || {};
    const id = String(body.id || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const name = String(body.name || "").trim();
    const svg = String(body.svg || "").trim();
    if (!id || !name) {
      return res.status(400).json({ error: "id and name are required" });
    }
    if (!svg) {
      return res.status(400).json({ error: "svg is required" });
    }
    if (data.bookViews.some(v => v.id === id)) {
      return res.status(400).json({ error: "View id already exists" });
    }
    const unitWidth = sanitizeBookViewUnitWidth(body.unitWidth);
    const unitHeight = sanitizeBookViewUnitHeight(body.unitHeight);
    const view = { id, name, svg, unitWidth, unitHeight };
    data.bookViews.push(view);
    await writeData(data);
    return res.status(201).json({ ok: true, view });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create view" });
  }
});

app.put("/api/book-views/:id", async (req, res) => {
  try {
    const viewId = String(req.params.id || "").trim();
    const data = await readData();
    const view = data.bookViews.find(v => v.id === viewId);
    if (!view) return res.status(404).json({ error: "View not found" });
    const body = req.body || {};
    if (body.name !== undefined) view.name = String(body.name).trim();
    if (body.svg !== undefined) view.svg = String(body.svg).trim();
    if (body.unitWidth !== undefined) view.unitWidth = sanitizeBookViewUnitWidth(body.unitWidth);
    if (body.unitHeight !== undefined) view.unitHeight = sanitizeBookViewUnitHeight(body.unitHeight);
    await writeData(data);
    return res.json({ ok: true, view });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update view" });
  }
});

app.delete("/api/book-views/:id", async (req, res) => {
  try {
    const viewId = String(req.params.id || "").trim();
    const data = await readData();
    const idx = data.bookViews.findIndex(v => v.id === viewId);
    if (idx === -1) return res.status(404).json({ error: "View not found" });
    data.bookViews.splice(idx, 1);
    await writeData(data);
    return res.json({ ok: true, id: viewId });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete view" });
  }
});


app.post("/api/admin/ai-change", async (req, res) => {
  let resolvedCommand = "";

  if (aiChangeRunning) {
    return res.status(409).json({ error: "AI change is already running" });
  }

  try {
    const body = req.body || {};
    const prompt = String(body.prompt || "").trim();
    const model = String(body.model || ADMIN_AI_DEFAULT_MODEL || "auto").trim() || "auto";
    const provider = String(body.provider || "cursor").trim().toLowerCase() || "cursor";
    const newSession = Boolean(body.newSession);
    const commitAfter = body.commitAfter !== false;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    let commandTemplate = ADMIN_AI_AGENT_CMD;
    if (!commandTemplate) {
      if (provider === "cursor") {
        commandTemplate = ADMIN_AI_AGENT_CMD_CURSOR;
      // } else if (provider === "openrouter") {
      //   commandTemplate = ADMIN_AI_AGENT_CMD_OPENROUTER;
      } else {
        commandTemplate = ADMIN_AI_AGENT_CMD_CURSOR;
      }
    }
    if (!commandTemplate) {
      return res.status(500).json({
        error: "Missing AI command template. Set ADMIN_AI_AGENT_CMD or provider-specific command env vars."
      });
    }

    aiChangeRunning = true;

    const instruction = [
      prompt,
      "",
      "Do not run ./restart yourself; the server restarts after this command."
    ].join("\n");

    const cursorModel = model === "auto" ? CURSOR_AGENT_DEFAULT_MODEL : model;
    const cursorResumeFlags = newSession ? "" : "--continue";

    const command = commandTemplate
      .replace(/\{prompt\}/g, shellEscape(instruction))
      .replace(/\{model\}/g, shellEscape(model))
      .replace(/\{cursorModel\}/g, shellEscape(cursorModel))
      .replace(/\{cwd\}/g, shellEscape(ROOT_DIR))
      .replace(/\{newSession\}/g, newSession ? "1" : "0")
      .replace(/\{newSessionFlag\}/g, newSession ? "--new-session" : "")
      .replace(/\{cursorResumeFlags\}/g, cursorResumeFlags)
      .replace(/\{sessionMode\}/g, newSession ? "new" : "resume");

    resolvedCommand = command;

    await appendAiAgentLog({
      status: "START",
      provider,
      model,
      command,
      agentStdout: "",
      agentStderr: "",
      restartStdout: "",
      restartStderr: ""
    });

    const agentResult = await runShellCommand({ command, cwd: ROOT_DIR, timeoutMs: ADMIN_AI_AGENT_TIMEOUT_MS });
    let gitCheckpoint = null;
    if (commitAfter) {
      gitCheckpoint = await tryGitCheckpointCommit();
    }
    const restartResult = await runShellCommand({ command: "./restart", cwd: ROOT_DIR, timeoutMs: ADMIN_AI_RESTART_TIMEOUT_MS });

    await appendAiAgentLog({
      status: "OK",
      provider,
      model,
      command,
      agentStdout: agentResult.stdout,
      agentStderr: agentResult.stderr,
      restartStdout: restartResult.stdout,
      restartStderr: restartResult.stderr
    });

    return res.json({
      ok: true,
      model,
      provider,
      newSession,
      commitAfter,
      gitCheckpoint,
      command,
      logFile: "logs/ai-agent.log",
      agentStdout: agentResult.stdout,
      agentStderr: agentResult.stderr,
      restartStdout: restartResult.stdout,
      restartStderr: restartResult.stderr
    });
  } catch (error) {
    await appendAiAgentLog({
      status: "FAIL",
      provider: String((req.body && req.body.provider) || ""),
      model: String((req.body && req.body.model) || ""),
      command: resolvedCommand,
      agentStdout: String(error.stdout || ""),
      agentStderr: String(error.stderr || ""),
      restartStdout: "",
      restartStderr: "",
      error: String(error.message || "AI change failed")
    });
    return res.status(500).json({
      error: String(error.message || "AI change failed"),
      stdout: String(error.stdout || ""),
      stderr: String(error.stderr || ""),
      command: resolvedCommand,
      logFile: "logs/ai-agent.log"
    });
  } finally {
    aiChangeRunning = false;
  }
});


app.post("/api/admin/git-revert-last", async (req, res) => {
  if (gitRevertRunning) {
    return res.status(409).json({ error: "Git revert is already running" });
  }
  const body = req.body || {};
  if (!body.confirm) {
    return res.status(400).json({ error: 'Send JSON body { "confirm": true } to revert the last commit.' });
  }
  gitRevertRunning = true;
  try {
    await runShellCommand({
      command: "git rev-parse --verify HEAD~1",
      cwd: ROOT_DIR,
      timeoutMs: 10000
    });
    await runShellCommand({
      command: "git reset --hard HEAD~1",
      cwd: ROOT_DIR,
      timeoutMs: 60000
    });
    res.json({
      ok: true,
      message: "Restored previous commit. Server will restart."
    });
    setImmediate(() => {
      runShellCommand({
        command: "./restart",
        cwd: ROOT_DIR,
        timeoutMs: ADMIN_AI_RESTART_TIMEOUT_MS
      }).catch((e) => {
        console.error("git-revert-last restart:", e && e.message ? e.message : e);
      });
    });
  } catch (error) {
    return res.status(500).json({
      error: String(error.message || "Git revert failed"),
      stdout: String(error.stdout || ""),
      stderr: String(error.stderr || "")
    });
  } finally {
    gitRevertRunning = false;
  }
});


(async () => {
  await touchAiLogOnStartup();
  app.listen(PORT, HOST, () => {
    const interfaces = os.networkInterfaces();
    const ipList = [];

    Object.values(interfaces).forEach((entries) => {
      (entries || []).forEach((entry) => {
        if (entry && entry.family === "IPv4" && !entry.internal) {
          ipList.push(entry.address);
        }
      });
    });

    console.log(`Server running on http://localhost:${PORT}/nina-bejo/`);
    console.log(`AI agent log: ${AI_AGENT_LOG_FILE}`);
    ipList.forEach((ip) => {
      console.log(`LAN URL: http://${ip}:${PORT}/nina-bejo/`);
      console.log(`Admin URL: http://${ip}:${PORT}/nina-bejo/admin/`);
    });
  });
})();
