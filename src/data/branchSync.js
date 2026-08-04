/**
 * Branch sync — commits the local snapshot to a git branch via the GitHub
 * contents API, so one branch == one person's data. No accounts, no backend:
 * a fine-grained personal access token (contents: read/write on this repo
 * only) is pasted once at setup and kept in this browser's localStorage.
 *
 * File written: data/store.json on the configured branch.
 */

import { buildSnapshot } from "./store.js";

const CFG_KEY = "la3_sync";
const FILE_PATH = "data/store.json";
const API = "https://api.github.com";

export function getSyncConfig() {
  try { const r = localStorage.getItem(CFG_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function setSyncConfig(cfg) {
  try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch { /* blocked */ }
}

let sha = null;          // sha of data/store.json at the last pull/push
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

const b64encode = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const b64decode = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, "")), c => c.charCodeAt(0)));

/** Fetch the remote snapshot (null if the file doesn't exist yet). Throws on auth/network errors. */
export async function pullSnapshot() {
  const cfg = getSyncConfig();
  if (!cfg || cfg.mode !== "github") return null;
  const res = await fetch(fileUrl(cfg), { headers: hdrs(cfg) });
  if (res.status === 404) { sha = null; return null; }
  if (!res.ok) throw new Error(`GitHub read failed (${res.status})`);
  const body = await res.json();
  sha = body.sha;
  try { return JSON.parse(b64decode(body.content)); } catch { return null; }
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
      // sha drifted (edited elsewhere) — refresh and retry once, last write wins
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

/** Debounced push — call after every local write. */
export function schedulePush() {
  const cfg = getSyncConfig();
  if (!cfg || cfg.mode !== "github") return;
  if (pushing) { queued = true; return; }
  clearTimeout(timer);
  timer = setTimeout(pushNow, 2500);
}

/** Setup-screen check: can we see the repo + branch (and write, if token given)? */
export async function testConnection(cfg) {
  const res = await fetch(`${API}/repos/${cfg.repo}/branches/${encodeURIComponent(cfg.branch)}`, { headers: hdrs(cfg) });
  if (res.status === 404) return { ok: false, msg: "Repo or branch not found (private repos need the token to read too)." };
  if (res.status === 401) return { ok: false, msg: "Token rejected — check it has contents read/write on this repo." };
  if (!res.ok) return { ok: false, msg: `GitHub answered ${res.status}.` };
  return { ok: true, msg: `Found ${cfg.repo} @ ${cfg.branch}.` };
}
