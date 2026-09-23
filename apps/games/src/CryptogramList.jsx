import { useEffect, useRef, useState } from "react";
import { IconButton } from "@shared/ui.jsx";
import { letterCount } from "./cryptogram.js";
import { fmtElapsed } from "./timing.js";

const FETCH_TIMEOUT_MS = 8000;

const foldText = (s) => s.trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
const fingerprint = (s) => foldText(s).toLowerCase().replace(/[^a-z]/g, "");

export function parsePuzzleLines(raw) {
  const entries = [];
  const rejected = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    const m = t.split(/\s*(?:\||\u2014|\u2013)\s*/);
    const text = foldText(m[0] || "");
    const attribution = (m[1] || "").trim() || "Anonymous";
    if (letterCount(text) >= 12) entries.push({ text, attribution });
    else rejected.push(t);
  }
  return { entries, rejected };
}

async function fetchJson(url, signal) {
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function fetchOnlineQuotes(signal) {
  try {
    const skip = Math.floor(Math.random() * 1400);
    const j = await fetchJson(`https://dummyjson.com/quotes?limit=40&skip=${skip}`, signal);
    const qs = (j.quotes || []).map((q) => ({ text: q.quote, attribution: q.author })).filter((q) => q.text);
    if (qs.length) return qs;
  } catch (err) {
    if (signal.aborted) throw err;
  }
  const j = await fetchJson("https://zenquotes.io/api/quotes", signal);
  return (Array.isArray(j) ? j : []).map((q) => ({ text: q.q, attribution: q.a })).filter((q) => q.text);
}

export function selectFetchedQuotes(candidates, existing, count = 10) {
  const seen = new Set(existing.map((p) => fingerprint(p.text)));
  const picked = [];
  for (const c of candidates) {
    const text = foldText(String(c.text || ""));
    if (text.length < 25 || text.length > 140 || letterCount(text) < 12) continue;
    const fp = fingerprint(text);
    if (seen.has(fp)) continue;
    seen.add(fp);
    picked.push({ text, attribution: (c.attribution || "").trim() || "Anonymous" });
    if (picked.length >= count) break;
  }
  return picked;
}

function useOnline() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine !== false);
  useEffect(() => {
    const on = () => setOnline(navigator.onLine !== false);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  return online;
}

export default function CryptogramList({ puzzles, progress, onOpen, onAdd, onDeleteCustom, onShuffle, onHome }) {
  const [adding, setAdding] = useState(false);
  const [raw, setRaw] = useState("");
  const [notice, setNotice] = useState("");
  const [fetching, setFetching] = useState(false);
  const [failed, setFailed] = useState(false);
  const online = useOnline();
  const abortRef = useRef(null);
  const solvedCount = puzzles.filter((p) => progress[p.id]?.solved).length;

  useEffect(() => () => abortRef.current?.abort(), []);

  const doImport = () => {
    const { entries, rejected } = parsePuzzleLines(raw);
    if (entries.length) onAdd(entries, "custom");
    setNotice(
      `${entries.length} added` + (rejected.length ? `, ${rejected.length} skipped (need at least 12 letters)` : "")
    );
    if (entries.length) {
      setRaw("");
      setAdding(false);
    }
  };

  const doFetch = async () => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    setFetching(true);
    setFailed(false);
    setNotice("");
    try {
      const candidates = await fetchOnlineQuotes(ctrl.signal);
      const picked = selectFetchedQuotes(candidates, puzzles, 10);
      if (picked.length) onAdd(picked, "web");
      setNotice(
        picked.length
          ? `${picked.length} new quotes added from the web. Attributions come from the source and are unverified.`
          : "No new suitable quotes this time. Try again."
      );
    } catch {
      if (abortRef.current !== ctrl) return;
      setFailed(true);
      setNotice(
        ctrl.signal.aborted
          ? "The quote services took too long to answer."
          : "Could not reach the quote services. Check your connection."
      );
    } finally {
      clearTimeout(timer);
      if (abortRef.current === ctrl) {
        abortRef.current = null;
        setFetching(false);
      }
    }
  };

  const offline = !online || failed;

  return (
    <div className="page">
      <div className="topbar">
        <IconButton label="Back" onClick={onHome}>
          ←
        </IconButton>
        <div>
          <div className="tb-title">Cryptogram</div>
          <div className="tb-sub">
            {solvedCount}/{puzzles.length} solved
          </div>
        </div>
        <button
          type="button"
          className="linkbtn"
          onClick={() => {
            setAdding((a) => !a);
            setNotice("");
          }}
        >
          {adding ? "Close" : "+ Add your own"}
        </button>
      </div>

      <div className="fetchrow">
        <button type="button" className="bigbtn fetchbtn" onClick={doFetch} disabled={fetching || !online}>
          {fetching ? "Fetching…" : online ? "⇣ Fetch 10 quotes from the web" : "Offline"}
        </button>
        {offline && (
          <button type="button" className="bigbtn secondary fetchbtn" onClick={onShuffle}>
            Shuffle from bundle
          </button>
        )}
      </div>

      {adding && (
        <div className="card">
          <p className="hint small" style={{ margin: "0 0 8px" }}>
            One puzzle per line: <b>Quote text | Author</b> (author optional). Romanian works: diacritics are
            converted to plain letters so the cipher covers them.
          </p>
          <textarea
            className="input"
            rows={5}
            placeholder={"Cine se scoală de dimineață departe ajunge | Proverb\nThe obstacle is the way | Marcus Aurelius"}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <button type="button" className="bigbtn" onClick={doImport} disabled={!raw.trim()}>
            Import
          </button>
        </div>
      )}
      {notice && <p className="hint small">{notice}</p>}

      {puzzles.map((p, idx) => {
        const prog = progress[p.id];
        const solved = prog?.solved;
        const started = prog && !solved && Object.keys(prog.guesses || {}).length > 0;
        const tag = p.source === "web" ? " · web" : p.custom ? " · yours" : "";
        return (
          <div key={p.id} className="card cg-listitem">
            <button type="button" className="cg-open" onClick={() => onOpen(p.id)}>
              <span className="gamecard-main">
                <span className="gamecard-title">
                  #{idx + 1} · {letterCount(p.text)} letters{tag}
                </span>
                <span className="gamecard-sub">
                  {p.attribution}
                  {solved ? ` · ${fmtElapsed(prog.elapsedMs || 0)}` : ""}
                </span>
              </span>
              {solved ? (
                <span className="cg-badge solved" aria-label="Solved">
                  ✓
                </span>
              ) : started ? (
                <span className="cg-badge started" aria-label="In progress">
                  …
                </span>
              ) : null}
            </button>
            {(p.custom || p.source === "web") && (
              <IconButton label="Delete puzzle" onClick={() => onDeleteCustom(p.id)}>
                ✕
              </IconButton>
            )}
          </div>
        );
      })}
    </div>
  );
}
