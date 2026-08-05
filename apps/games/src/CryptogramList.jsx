import { useState } from "react";

// Diacritics are folded to plain A-Z so the whole quote gets enciphered --
// otherwise accented letters would show through in the clear.
const foldText = (s) => s.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const letterCount = (s) => (s.match(/[a-zA-Z]/g) || []).length;
// Letters-only fingerprint for deduping the same quote across sources.
const fingerprint = (s) => foldText(s).toLowerCase().replace(/[^a-z]/g, "");

// Parses "Quote text | Author" lines (em/en dashes also work as separators).
// Lines without a separator get attribution "Anonymous".
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

// Fetches candidate quotes from free no-key APIs: DummyJSON's ~1450-quote
// database first (CORS-friendly), ZenQuotes' random-50 endpoint as fallback.
async function fetchOnlineQuotes() {
  try {
    const skip = Math.floor(Math.random() * 1400);
    const r = await fetch(`https://dummyjson.com/quotes?limit=40&skip=${skip}`);
    if (r.ok) {
      const j = await r.json();
      const qs = (j.quotes || [])
        .map((q) => ({ text: q.quote, attribution: q.author }))
        .filter((q) => q.text);
      if (qs.length) return qs;
    }
  } catch {
    /* fall through to the next source */
  }
  const r = await fetch("https://zenquotes.io/api/quotes");
  const j = await r.json();
  return (j || []).map((q) => ({ text: q.q, attribution: q.a })).filter((q) => q.text);
}

// Filter to cryptogram-suitable quotes, deduped against existing puzzles.
export function selectFetchedQuotes(candidates, existing, count = 10) {
  const seen = new Set(existing.map((p) => fingerprint(p.text)));
  const picked = [];
  for (const c of candidates) {
    const text = foldText(c.text);
    if (text.length < 25 || text.length > 140 || letterCount(text) < 12) continue;
    const fp = fingerprint(text);
    if (seen.has(fp)) continue;
    seen.add(fp);
    picked.push({ text, attribution: (c.attribution || "").trim() || "Anonymous" });
    if (picked.length >= count) break;
  }
  return picked;
}

export default function CryptogramList({ puzzles, progress, onOpen, onAdd, onDeleteCustom, onHome }) {
  const [adding, setAdding] = useState(false);
  const [raw, setRaw] = useState("");
  const [notice, setNotice] = useState("");
  const [fetching, setFetching] = useState(false);
  const solvedCount = puzzles.filter((p) => progress[p.id]?.solved).length;

  const doImport = () => {
    const { entries, rejected } = parsePuzzleLines(raw);
    if (entries.length) onAdd(entries);
    setNotice(
      `${entries.length} added` +
        (rejected.length ? `, ${rejected.length} skipped (need at least 12 letters)` : "")
    );
    if (entries.length) {
      setRaw("");
      setAdding(false);
    }
  };

  const doFetch = async () => {
    setFetching(true);
    setNotice("");
    try {
      const candidates = await fetchOnlineQuotes();
      const picked = selectFetchedQuotes(candidates, puzzles, 10);
      if (picked.length) onAdd(picked);
      setNotice(
        picked.length
          ? `${picked.length} new quotes added from the internet`
          : "No new suitable quotes this time — try again"
      );
    } catch {
      setNotice("Couldn't reach the quote services — check your connection.");
    }
    setFetching(false);
  };

  return (
    <div className="page">
      <div className="topbar">
        <button className="iconbtn" onClick={onHome}>
          ←
        </button>
        <div>
          <div className="tb-title">Cryptogram</div>
          <div className="tb-sub">
            {solvedCount}/{puzzles.length} solved
          </div>
        </div>
        <button className="linkbtn" onClick={() => { setAdding((a) => !a); setNotice(""); }}>
          {adding ? "Close" : "+ Add your own"}
        </button>
      </div>

      <button className="bigbtn fetchbtn" onClick={doFetch} disabled={fetching}>
        {fetching ? "Fetching…" : "⇣ Fetch 10 quotes from the internet"}
      </button>

      {adding && (
        <div className="card">
          <p className="hint small" style={{ margin: "0 0 8px" }}>
            One puzzle per line: <b>Quote text | Author</b> (author optional). Romanian works —
            diacritics are converted to plain letters so the cipher covers them.
          </p>
          <textarea
            className="input"
            rows={5}
            placeholder={"Cine se scoală de dimineață departe ajunge | Proverb\nThe obstacle is the way | Marcus Aurelius"}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <div className="btnrow">
            <button className="bigbtn" onClick={doImport} disabled={!raw.trim()}>
              Import
            </button>
          </div>
        </div>
      )}
      {notice && <p className="hint small">{notice}</p>}

      {puzzles.map((p, idx) => {
        const prog = progress[p.id];
        const solved = prog?.solved;
        const started = prog && !solved;
        return (
          <div key={p.id} className="card cg-listitem" onClick={() => onOpen(p.id)}>
            <div className="gamecard-main">
              <div className="gamecard-title">
                #{idx + 1} · {p.text.length} letters{p.custom ? " · yours" : ""}
              </div>
              <div className="gamecard-sub">{p.attribution}</div>
            </div>
            {solved ? (
              <span className="cg-badge solved">✓</span>
            ) : started ? (
              <span className="cg-badge started">…</span>
            ) : null}
            {p.custom && (
              <button
                className="iconbtn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this puzzle?")) onDeleteCustom(p.id);
                }}
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
