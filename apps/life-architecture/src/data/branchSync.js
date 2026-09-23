/**
 * Deprecated branch sync: commits the local snapshot to data/store.json on a
 * git branch via the GitHub contents API. Off by default; local mode plus
 * backup and import is the supported path.
 */

import { buildSnapshot } from "./store.js";

const CFG_KEY = "la3_sync";
const FILE_PATH = "data/store.json";
const API = "https://api.github.com";

export function getSyncConfig() {
  try { const r = localStorage.getItem(CFG_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function isGithubMode() {
  return getSyncConfig()?.mode === "github";
}
export function setSyncConfig(cfg) {
  try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch { /* blocked */ }
}

let sha = null;
let timer = null;
let pushing = false;
let queued = false;
let statusCb = () => {};

export function onSyncStatus(cb) { statusCb = cb || (() => {}); }

const hdrs = (cfg) => ({
  Accept: "application/vnd.github+json",
  ...(cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {}),
});
const fileUrl = (cfg) => `${API}/repos/${cfg.repo}/contents/${FILE_PATH}?ref=${encodeURIComponent(cfg.branch)}`;

function b64encode(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
const b64decode = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, "")), c => c.charCodeAt(0)));

export async function pullSnapshot() {
  const cfg = getSyncConfig();
  if (!cfg || cfg.mode !== "github") return null;
  const res = await fetch(fileUrl(cfg), { headers: hdrs(cfg) });
  if (res.status === 404) { sha = null; return null; }
  if (!res.ok) throw new Error(`GitHub read failed (${res.status})`);
  const body = await res.json();
  sha = body.sha;
  if (!body.content || body.encoding === "none") throw new Error("Remote data file is too large to read through the contents API.");
  try { return JSON.parse(b64decode(body.content)); } catch { throw new Error("Remote data file is not valid JSON."); }
}

async function refreshSha(cfg) {
  const res = await fetch(fileUrl(cfg), { headers: hdrs(cfg) });
  if (res.status === 404) { sha = null; return; }
  if (res.ok) sha = (await res.json()).sha;
}

async function pushNow() {
  const cfg = getSyncConfig();
  if (!cfg || cfg.mode !== "github" || !cfg.token) return;
  pushing = true;
  statusCb("syncing");
  try {
    const snap = buildSnapshot();
    const body = {
      message: `data: sync ${new Date(snap.savedAt || Date.now()).toISOString()}`,
      content: b64encode(JSON.stringify(snap, null, 2)),
      branch: cfg.branch,
      ...(sha ? { sha } : {}),
    };
    let res = await fetch(`${API}/repos/${cfg.repo}/contents/${FILE_PATH}`, { method: "PUT", headers: hdrs(cfg), body: JSON.stringify(body) });
    if (res.status === 409 || res.status === 422) {
      await refreshSha(cfg);
      res = await fetch(`${API}/repos/${cfg.repo}/contents/${FILE_PATH}`, { method: "PUT", headers: hdrs(cfg), body: JSON.stringify({ ...body, ...(sha ? { sha } : {}) }) });
    }
    if (!res.ok) throw new Error(`GitHub write failed (${res.status})`);
    sha = (await res.json()).content.sha;
    statusCb("synced");
  } catch {
    statusCb("error");
  } finally {
    pushing = false;
    if (queued) { queued = false; schedulePush(); }
  }
}

export function schedulePush() {
  const cfg = getSyncConfig();
  if (!cfg || cfg.mode !== "github") return;
  if (pushing) { queued = true; return; }
  clearTimeout(timer);
  timer = setTimeout(pushNow, 2500);
}

export async function testConnection(cfg) {
  const res = await fetch(`${API}/repos/${cfg.repo}/branches/${encodeURIComponent(cfg.branch)}`, { headers: hdrs(cfg) });
  if (res.status === 404) return { ok: false, msg: "Repo or branch not found (private repos need the token to read too)." };
  if (res.status === 401) return { ok: false, msg: "Token rejected. Check it has contents read/write on this repo." };
  if (!res.ok) return { ok: false, msg: `GitHub answered ${res.status}.` };
  return { ok: true, msg: `Found ${cfg.repo} @ ${cfg.branch}.` };
}
