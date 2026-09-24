import { Chess } from "chess.js";

export const SOURCES = {
  lichess: { label: "Lichess", host: "lichess" },
  chesscom: { label: "Chess.com", host: "chess.com" },
};

const TIMEOUT_MS = 15000;

export class ImportError extends Error {}

async function fetchWithTimeout(url, { headers, signal } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort("timeout"), TIMEOUT_MS);
  const onAbort = () => ctrl.abort("cancelled");
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    return await fetch(url, { headers, signal: ctrl.signal });
  } catch (e) {
    if (ctrl.signal.aborted && ctrl.signal.reason === "timeout") throw new ImportError("The server took too long to answer. Try again.");
    if (ctrl.signal.aborted) throw new ImportError("Cancelled.");
    throw new ImportError("Couldn't reach the server. Check your connection.");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

function checkStatus(res, site, user) {
  if (res.ok) return;
  if (res.status === 404) throw new ImportError(`No ${site} player named "${user}".`);
  if (res.status === 429) throw new ImportError(`${site} is rate limiting requests. Wait a minute and try again.`);
  if (res.status === 410) throw new ImportError(`That ${site} account is closed.`);
  if (res.status === 403) throw new ImportError(`${site} refused the request. Try again later.`);
  throw new ImportError(`${site} answered with an error (${res.status}).`);
}

function cleanUser(u) {
  const s = String(u || "").trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9_-]{2,30}$/.test(s)) throw new ImportError("Enter a valid username.");
  return s;
}

export function parseImported(pgn, { source, sourceId, user, url, speed, playedAt }) {
  const c = new Chess();
  try {
    c.loadPgn(pgn);
  } catch {
    return null;
  }
  const sans = c.history();
  if (sans.length < 2) return null;
  const h = c.header();
  if (h.Variant && !/standard|from position/i.test(h.Variant)) return null;
  const lower = user.toLowerCase();
  const playerColor =
    String(h.White || "").toLowerCase() === lower ? "w" : String(h.Black || "").toLowerCase() === lower ? "b" : null;
  return {
    source,
    sourceId,
    url: url || h.Site || null,
    speed: speed || null,
    playedAt: playedAt || null,
    white: h.White || "White",
    black: h.Black || "Black",
    whiteElo: h.WhiteElo && h.WhiteElo !== "?" ? h.WhiteElo : null,
    blackElo: h.BlackElo && h.BlackElo !== "?" ? h.BlackElo : null,
    result: h.Result && h.Result !== "*" ? h.Result : null,
    event: h.Event || null,
    date: h.Date || h.UTCDate || null,
    startFen: h.SetUp === "1" && h.FEN ? h.FEN : null,
    playerColor,
    sans,
  };
}

async function fetchLichess(user, signal) {
  const url = `https://lichess.org/api/games/user/${encodeURIComponent(user)}?max=20&pgnInJson=true`;
  const res = await fetchWithTimeout(url, { headers: { Accept: "application/x-ndjson" }, signal });
  checkStatus(res, "Lichess", user);
  const text = await res.text();
  const out = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let g;
    try {
      g = JSON.parse(line);
    } catch {
      continue;
    }
    if (!g.pgn || (g.variant && g.variant !== "standard" && g.variant !== "fromPosition")) continue;
    const parsed = parseImported(g.pgn, {
      source: "lichess",
      sourceId: `lichess:${g.id}`,
      user,
      url: `https://lichess.org/${g.id}`,
      speed: g.speed,
      playedAt: g.lastMoveAt || g.createdAt,
    });
    if (parsed) out.push(parsed);
  }
  return out;
}

async function fetchChessCom(user, signal) {
  const lower = user.toLowerCase();
  const res = await fetchWithTimeout(`https://api.chess.com/pub/player/${encodeURIComponent(lower)}/games/archives`, { signal });
  checkStatus(res, "Chess.com", user);
  const { archives = [] } = await res.json();
  if (!archives.length) return [];
  const raw = [];
  for (const archive of archives.slice(-2).reverse()) {
    const r = await fetchWithTimeout(archive, { signal });
    checkStatus(r, "Chess.com", user);
    const { games = [] } = await r.json();
    raw.push(...games);
    if (raw.length >= 20) break;
  }
  return raw
    .filter((g) => g.pgn && (!g.rules || g.rules === "chess"))
    .sort((a, b) => (b.end_time || 0) - (a.end_time || 0))
    .slice(0, 20)
    .map((g) =>
      parseImported(g.pgn, {
        source: "chesscom",
        sourceId: `chesscom:${g.uuid || g.url}`,
        user,
        url: g.url,
        speed: g.time_class,
        playedAt: g.end_time ? g.end_time * 1000 : null,
      })
    )
    .filter(Boolean);
}

export async function fetchRecentGames(source, username, { signal } = {}) {
  const user = cleanUser(username);
  const list = source === "chesscom" ? await fetchChessCom(user, signal) : await fetchLichess(user, signal);
  return list.sort((a, b) => (b.playedAt || 0) - (a.playedAt || 0)).slice(0, 20);
}

export function toArchiveGame(g, id, date) {
  return {
    id,
    date,
    mode: "import",
    source: g.source,
    sourceId: g.sourceId,
    label: `${g.white} vs ${g.black}`,
    headers: {
      ...(g.event ? { Event: g.event } : {}),
      ...(g.url ? { Site: g.url } : {}),
      ...(g.date ? { Date: g.date } : {}),
    },
    players: { w: g.white, b: g.black, wElo: g.whiteElo, bElo: g.blackElo },
    playerColor: g.playerColor,
    playedAt: g.playedAt,
    sans: g.sans,
    ...(g.startFen ? { startFen: g.startFen } : {}),
    result: g.result,
    review: null,
  };
}
