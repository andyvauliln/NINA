#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

const DEFAULT_OR_MODEL = "google/gemini-2.5-pro";

function argValue(flag, fallback = "") {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return fallback;
  return process.argv[idx + 1];
}


function normalizePatch(text) {
  const t = String(text || "").trim();
  if (t.includes("diff --git")) return t;
  const lines = t.split("\n");
  const start = lines.findIndex((l) => l.startsWith("--- a/"));
  if (start === -1) return t;
  const pathLine = lines[start].replace(/^---\s+a\//, "").trim();
  const rest = lines.slice(start).join("\n");
  return `diff --git a/${pathLine} b/${pathLine}\n` + rest;
}

function extractPatch(content) {
  const t = String(content || "").trim();
  const fenced = trimCodeFence(t);
  if (fenced.includes("diff --git")) return fenced;
  if (fenced.includes("--- a/")) return fenced;
  const idx = t.indexOf("diff --git");
  if (idx !== -1) return t.slice(idx).trim();
  const idx2 = t.indexOf("--- a/");
  if (idx2 !== -1) return t.slice(idx2).trim();
  const m = t.match(/diff --git[\s\S]*/);
  return m ? m[0].trim() : "";
}

function trimCodeFence(text) {
  const t = String(text || "").trim();
  if (t.startsWith("```")) {
    const firstNl = t.indexOf("\n");
    const lastFence = t.lastIndexOf("```");
    if (firstNl !== -1 && lastFence > firstNl) {
      return t.slice(firstNl + 1, lastFence).trim();
    }
  }
  return t;
}

async function readContextFiles(cwd) {
  const raw = process.env.OPENROUTER_CONTEXT_FILES || "index.html";
  const names = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const maxChars = Number(process.env.OPENROUTER_MAX_CONTEXT_CHARS || 120000);
  let out = "";
  for (const name of names) {
    const fp = path.isAbsolute(name) ? name : path.join(cwd, name);
    try {
      const text = await fs.readFile(fp, "utf8");
      out += `\n\n--- file: ${name} ---\n${text}`;
    } catch {
      out += `\n\n--- file: ${name} (unreadable) ---\n`;
    }
    if (out.length > maxChars) {
      out = out.slice(0, maxChars) + "\n\n[truncated]\n";
      break;
    }
  }
  return out.trim();
}

async function main() {
  const cwd = argValue("--cwd", process.cwd());
  const modelIn = argValue("--model", "auto");
  const prompt = argValue("--prompt", "").trim();
  const model =
    modelIn === "auto"
      ? process.env.OPENROUTER_MODEL_DEFAULT || DEFAULT_OR_MODEL
      : modelIn;
  const apiKey = process.env.OPENROUTER_API_KEY || "";

  if (!prompt) {
    throw new Error("Prompt is required");
  }
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing");
  }

  const contextBlock = await readContextFiles(cwd);

  const system = [
    "You are a coding agent. Return ONLY a valid unified git diff patch.",
    "Hard requirements:",
    "- The patch MUST begin with: diff --git a/<path> b/<path>",
    "- Then include the standard index lines and file hunks that match the real repository files.",
    "- Keep changes minimal and directly related to the request.",
    "- No markdown fences. No prose. Only patch text.",
    "- The patch must apply cleanly with: git apply --whitespace=fix",
    "- Do not include changes outside what is needed."
  ].join("\n");

  const user = [
    `Repository root: ${cwd}`,
    "The following file contents are provided only as context (may be truncated):",
    contextBlock || "(no extra files)",
    "",
    "Task:",
    prompt,
    "",
    "Output: unified git diff only."
  ].join("\n");

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.2
    })
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.error?.message || `OpenRouter request failed (${resp.status})`);
  }

  const content = data?.choices?.[0]?.message?.content || "";
  let patch = extractPatch(content);
  if (!patch) patch = trimCodeFence(content);
  patch = normalizePatch(patch);
  if (!patch.includes("diff --git")) {
    throw new Error("Model did not return a valid git diff patch");
  }

  const tmpFile = path.join(os.tmpdir(), `openrouter-agent-${Date.now()}.patch`);
  await fs.writeFile(tmpFile, patch, "utf8");

  try {
    await execFileAsync("git", ["apply", "--whitespace=fix", tmpFile], { cwd });
  } catch (error) {
    const stderr = error?.stderr ? String(error.stderr) : "";
    throw new Error(`Failed to apply patch: ${stderr || error.message}`);
  } finally {
    await fs.unlink(tmpFile).catch(() => {});
  }

  process.stdout.write("Patch applied successfully.\n");
}

main().catch((err) => {
  process.stderr.write(String(err?.message || err) + "\n");
  process.exit(1);
});
