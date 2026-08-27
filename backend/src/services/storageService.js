import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSIONS_DIR = path.join(__dirname, "..", "..", "data", "sessions");

function sessionPath(sessionId) {
  return path.join(SESSIONS_DIR, `${sessionId}.json`);
}

export async function createSession(sessionId, data) {
  await fs.writeFile(sessionPath(sessionId), JSON.stringify(data, null, 2));
  return data;
}

export async function getSession(sessionId) {
  try {
    const raw = await fs.readFile(sessionPath(sessionId), "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

export async function updateSession(sessionId, updater) {
  const current = await getSession(sessionId);
  if (!current) return null;
  const updated = typeof updater === "function" ? updater(current) : { ...current, ...updater };
  await fs.writeFile(sessionPath(sessionId), JSON.stringify(updated, null, 2));
  return updated;
}

export async function deleteSession(sessionId) {
  try {
    await fs.unlink(sessionPath(sessionId));
    return true;
  } catch (err) {
    if (err.code === "ENOENT") return false;
    throw err;
  }
}
