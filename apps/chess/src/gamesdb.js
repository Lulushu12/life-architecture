// Historic games database (public/games/, built by scripts/build-games-db.mjs)
// plus live tournament broadcasts from the Lichess API.
//
// Bundled data is fetched lazily per event and cached by the service worker,
// so anything browsed once keeps working offline. Live broadcasts need the
// network; the last successful fetch is kept in localStorage so the screen
// still shows something on a plane.

let indexCache = null;
let famousCache = null;
const eventCache = new Map();

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url.split("/").pop()}: HTTP ${r.status}`);
  return r.json();
}

export async function loadGamesIndex() {
  if (!indexCache) indexCache = await getJson(`${import.meta.env.BASE_URL}games/index.json`);
  return indexCache;
}

export async function loadFamous() {
  if (!famousCache) famousCache = await getJson(`${import.meta.env.BASE_URL}games/famous.json`);
  return famousCache;
}

export async function loadEvent(id) {
  if (!eventCache.has(id)) {
    eventCache.set(id, await getJson(`${import.meta.env.BASE_URL}games/ev/${id}.json`));
    if (eventCache.size > 12) eventCache.delete(eventCache.keys().next().value); // keep memory flat
  }
  return eventCache.get(id);
}

export const RESULT_LABEL = { "1-0": "1–0", "0-1": "0–1", "=": "½–½" };

/** "Carlsen, Magnus" -> "Carlsen" ; "Comp Deep Blue" stays whole. */
export function surname(name) {
  const comma = name.indexOf(",");
  return comma > 0 ? name.slice(0, comma) : name;
}

/** Group index entries into { series, events[] } sorted by best-known-first. */
export function groupSeries(entries) {
  const map = new Map();
  for (const e of entries) {
    if (!map.has(e.series)) map.set(e.series, []);
    map.get(e.series).push(e);
  }
  const out = [];
  for (const [series, events] of map) {
    events.sort((a, b) => (b.year || 0) - (a.year || 0));
    out.push({ series, events, total: events.reduce((a, e) => a + e.n, 0) });
  }
  // Longest-running series first — that's where the famous names live.
  out.sort((a, b) => b.events.length - a.events.length || a.series.localeCompare(b.series));
  return out;
}

// ---------------------------------------------------------------------------
// Offline bulk download: fetch every event file once so the service worker
// caches the whole database. ~40 MB — only on explicit request.

export async function downloadAll(onProgress) {
  const idx = await loadGamesIndex();
  await loadFamous();
  const ids = idx.events.map((e) => e.id);
  let done = 0;
  const workers = Array.from({ length: 6 }, async () => {
    while (ids.length) {
      const id = ids.shift();
      try {
        const r = await fetch(`${import.meta.env.BASE_URL}games/ev/${id}.json`);
        if (!r.ok) throw new Error(String(r.status));
        await r.arrayBuffer(); // drain so the SW commits it to cache
      } catch {
        ids.unshift(id);
        throw new Error("Download interrupted — check your connection and try again.");
      }
      onProgress(++done, idx.events.length);
    }
  });
  await Promise.all(workers);
}

// ---------------------------------------------------------------------------
// Live broadcasts (lichess.org, CORS-open, no auth). Cached in localStorage.

const LIVE_KEY = "chess-live-v1";

function liveCache() {
  try {
    return JSON.parse(localStorage.getItem(LIVE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveLiveCache(c) {
  try {
    localStorage.setItem(LIVE_KEY, JSON.stringify(c));
  } catch {
    /* quota — live data is disposable */
  }
}

function remember(key, value) {
  const c = liveCache();
  c[key] = { t: Date.now(), v: value };
  // keep only the ten most recent entries; rounds can be ~100 KB each
  const keys = Object.keys(c).sort((a, b) => c[b].t - c[a].t);
  for (const k of keys.slice(10)) delete c[k];
  saveLiveCache(c);
  return value;
}

/** fetcher() with last-good-value fallback. Returns {data, stale, at}. */
async function cachedFetch(key, fetcher) {
  try {
    const data = await fetcher();
    remember(key, data);
    return { data, stale: false, at: Date.now() };
  } catch (e) {
    const hit = liveCache()[key];
    if (hit) return { data: hit.v, stale: true, at: hit.t };
    throw e;
  }
}

export function fetchBroadcasts() {
  return cachedFetch("top", async () => {
    const top = await getJson("https://lichess.org/api/broadcast/top");
    const strip = ({ tour, round }) => ({
      tourId: tour.id,
      name: tour.name,
      info: [tour.info?.format, tour.info?.location].filter(Boolean).join(" · "),
      players: tour.info?.players || "",
      tier: tour.tier || 0,
      dates: tour.dates || null,
      roundName: round?.name || "",
    });
    return {
      active: (top.active || []).sort((a, b) => (b.tour.tier || 0) - (a.tour.tier || 0)).map(strip),
      upcoming: (top.upcoming || []).map(strip),
      past: (top.past?.currentPageResults || []).map(strip),
    };
  });
}

export function fetchTour(tourId) {
  return cachedFetch(`tour:${tourId}`, async () => {
    const d = await getJson(`https://lichess.org/api/broadcast/${tourId}`);
    return {
      name: d.tour?.name || "",
      rounds: (d.rounds || []).map((r) => ({
        id: r.id,
        name: r.name,
        finished: !!r.finished,
        ongoing: !!r.ongoing,
        startsAt: r.startsAt || null,
      })),
    };
  });
}

export function fetchRoundGames(roundId) {
  return cachedFetch(`round:${roundId}`, async () => {
    const r = await fetch(`https://lichess.org/api/broadcast/round/${roundId}.pgn`);
    if (!r.ok) throw new Error(`round: HTTP ${r.status}`);
    return parsePgn(await r.text());
  });
}

// ---------------------------------------------------------------------------
// Browser-side PGN parsing for broadcast rounds (headers + bare SAN tokens;
// the viewer replays them through chess.js and stops at anything illegal).

export function parsePgn(text) {
  const games = [];
  let headers = null;
  let moves = [];
  const flush = () => {
    if (!headers) return;
    const tokens = tokenize(moves.join(" "));
    games.push({
      w: headers.White || "?",
      b: headers.Black || "?",
      res: headers.Result === "1/2-1/2" ? "=" : ["1-0", "0-1"].includes(headers.Result) ? headers.Result : null,
      d: headers.Date || null,
      rd: headers.Round || null,
      we: parseInt(headers.WhiteElo, 10) || null,
      be: parseInt(headers.BlackElo, 10) || null,
      m: tokens.join(" "),
      live: headers.Result === "*",
    });
    headers = null;
    moves = [];
  };
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("[") && /^\[\s*\w+\s+"/.test(line)) {
      if (moves.length) flush();
      headers = headers || {};
      const m = line.match(/^\[\s*(\w+)\s+"(.*)"\s*\]/);
      if (m) headers[m[1]] = m[2].replace(/\\"/g, '"');
    } else if (line && headers) {
      moves.push(line);
    }
  }
  flush();
  return games;
}

function tokenize(moveText) {
  let t = moveText.replace(/\{[^}]*\}/g, " ").replace(/;[^\n]*/g, " ");
  let prev;
  do {
    prev = t;
    t = t.replace(/\([^()]*\)/g, " ");
  } while (t !== prev);
  return t
    .replace(/\$\d+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((tok) => !/^\d+\.+$/.test(tok))
    .filter((tok) => !["1-0", "0-1", "1/2-1/2", "*"].includes(tok))
    .map((tok) => tok.replace(/^\d+\.+/, ""))
    .filter((tok) => tok !== "..." && tok !== "");
}
