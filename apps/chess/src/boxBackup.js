// One-way backup to your own box (plan item 14). Once a day at most, on
// launch and after a game, the app sends a copy of its backup to the
// receiver in ops/la-backup. It never blocks anything: a failure is noted
// and the next trigger tries again. Restoring stays manual (download the
// copy from the box, then Import in Settings).

export const BOX_INTERVAL_MS = 20 * 3600 * 1000;
// Never part of the copy: the AI key, the box's own address and token, and
// the box status (which changes on every send and would defeat de-duplication).
const STRIP = [["settings", "ai", "apiKey"], ["settings", "box"], ["boxStatus"]];

export function boxPayload(store) {
  const copy = JSON.parse(JSON.stringify(store));
  for (const path of STRIP) {
    let cur = copy;
    for (const k of path.slice(0, -1)) cur = cur?.[k];
    if (cur && typeof cur === "object") delete cur[path[path.length - 1]];
  }
  return JSON.stringify(copy);
}

/** The PUT address for this app, or null when the box address isn't usable. */
export function boxEndpoint(url, app = "chess") {
  const u = String(url || "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\/[^\s/]+/.test(u)) return null;
  return `${u}/v1/backups/${app}`;
}

/** Whether a copy is due: switched on, set up, and 20 hours since the last good one. */
export function boxDue(box, status, now = Date.now()) {
  if (!box?.enabled || !box.token || !boxEndpoint(box.url)) return false;
  return !status?.lastOk || now - status.lastOk >= BOX_INTERVAL_MS;
}

/** The reason a send failed, in plain words. */
export function boxErrorText(err) {
  if (err?.status === 401) return "The box refused the token. Check it matches the box's token file.";
  if (err?.status === 413) return "The backup was too big for the box.";
  if (err?.status === 404) return "Found a server at that address, but not the backup receiver.";
  if (err?.status) return `The box answered with an error (${err.status}).`;
  return "Couldn't reach the box. Is it on, and is the phone on your tailnet?";
}

async function gzip(text) {
  if (typeof CompressionStream === "undefined") return null;
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Browser transport: fetch, gzipped when the browser can. */
export async function fetchTransport(url, { token, text, timeoutMs = 20000 }) {
  const gz = await gzip(text);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": gz ? "application/gzip" : "application/json" },
      body: gz || text,
      signal: ctl.signal,
    });
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* not JSON */
    }
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Android transport: Capacitor's native HTTP, which has no CORS and works
 * from the app's own origin. Sends plain JSON (binary bodies don't cross the
 * bridge reliably); the box compresses it on arrival.
 */
export async function nativeTransport(url, { token, text, timeoutMs = 20000 }) {
  const { CapacitorHttp } = await import("@capacitor/core");
  const res = await CapacitorHttp.request({
    url,
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: text,
    connectTimeout: timeoutMs,
    readTimeout: timeoutMs,
  });
  return { status: res.status, json: typeof res.data === "object" ? res.data : null };
}

let sending = false;

/**
 * Sends a copy and records the outcome in the store. One send at a time;
 * returns the new status, or null when a send was already running.
 */
export async function sendToBox(store, setStore, transport) {
  if (sending) return null;
  sending = true;
  try {
    const status = await pushBackup(store, { transport });
    setStore((s) => ({ ...s, boxStatus: status }));
    return status;
  } finally {
    sending = false;
  }
}

/**
 * Sends one copy. Never throws. Returns the new box status:
 * {lastOk, lastId, lastTry, lastError} (lastError null on success).
 */
export async function pushBackup(store, { transport, now = Date.now } = {}) {
  const box = store.settings?.box || {};
  const prev = store.boxStatus || {};
  const url = boxEndpoint(box.url);
  const tried = now();
  if (!url || !box.token) return { ...prev, lastTry: tried, lastError: "Set the box address and token first." };
  try {
    const res = await transport(url, { token: box.token, text: boxPayload(store) });
    if (res.status === 200 || res.status === 201) {
      return { lastOk: now(), lastId: res.json?.id || null, lastTry: tried, lastError: null };
    }
    return { ...prev, lastTry: tried, lastError: boxErrorText({ status: res.status }) };
  } catch {
    return { ...prev, lastTry: tried, lastError: boxErrorText(null) };
  }
}
