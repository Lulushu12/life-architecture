// Font files the user adds for the display face. Kept in IndexedDB, not in
// the chess store: a font is 20 to 500 KB, which would crowd localStorage and
// bloat every backup. They stay on this device; backups don't include them.

import { customFamily } from "./appearance.js";

const DB = "chess-fonts";
const STORE = "fonts";
export const MAX_FONT_BYTES = 2 * 1024 * 1024;
const EXT = /\.(woff2?|ttf|otf)$/i;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const out = fn(t.objectStore(STORE));
        t.oncomplete = () => resolve(out?.result ?? out);
        t.onerror = () => reject(t.error);
      })
  );
}

/** Why a file can't be used as a font, or null when it can be tried. */
export function fontFileProblem(file) {
  if (!file) return "No file chosen.";
  if (!EXT.test(file.name || "")) return "Use a .woff2, .woff, .ttf or .otf font file.";
  if (file.size > MAX_FONT_BYTES) return "That font file is over 2 MB.";
  return null;
}

/** A readable name from a file name: "Sora-ExtraBold.woff2" -> "Sora ExtraBold". */
export function fontNameFromFile(fileName) {
  return String(fileName || "Font")
    .replace(EXT, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40) || "Font";
}

async function register(font) {
  const face = new FontFace(customFamily(font.id), font.data);
  await face.load();
  document.fonts.add(face);
  return face;
}

/** Validates, loads and stores a font file; returns its record without the data. */
export async function addFontFile(file) {
  const problem = fontFileProblem(file);
  if (problem) throw new Error(problem);
  const data = await file.arrayBuffer();
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const font = { id, name: fontNameFromFile(file.name), data, added: Date.now() };
  try {
    await register(font);
  } catch {
    throw new Error("That file isn't a font this device can read.");
  }
  await tx("readwrite", (s) => s.put(font));
  return { id, name: font.name, added: font.added };
}

export async function listFonts() {
  try {
    const all = await tx("readonly", (s) => s.getAll());
    return (all || []).map(({ id, name, added }) => ({ id, name, added }));
  } catch {
    return [];
  }
}

export async function removeFont(id) {
  await tx("readwrite", (s) => s.delete(id));
}

/** Registers every stored font with the page; returns their records. */
export async function loadStoredFonts() {
  let all = [];
  try {
    all = (await tx("readonly", (s) => s.getAll())) || [];
  } catch {
    return [];
  }
  const ok = [];
  for (const f of all) {
    try {
      await register(f);
      ok.push({ id: f.id, name: f.name, added: f.added });
    } catch {
      /* a font that no longer loads is skipped, not fatal */
    }
  }
  return ok;
}
