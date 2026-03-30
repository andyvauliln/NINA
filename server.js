const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_FILE = path.join(ROOT_DIR, "data.json");
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");

app.use(express.json());
app.use(express.static(ROOT_DIR));

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
  limits: { fileSize: 10 * 1024 * 1024 }
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

app.get("/nina-bejo", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

app.get("/nina-bejo/admin", (_req, res) => {
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

app.post("/api/books/:id/upload", upload.single("file"), async (req, res) => {
  try {
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
    const view = { id, name, svg };
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/nina-bejo`);
});
