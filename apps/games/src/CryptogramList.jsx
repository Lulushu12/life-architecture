import { useState } from "react";

// Parses "Quote text | Author" lines (— and – also accepted as separators).
// Lines without a separator get attribution "Anonymous". Diacritics are
// folded to plain A–Z (ă→a, ș→s…) so the whole quote gets enciphered —
// otherwise accented letters would show through in the clear.
export function parsePuzzleLines(raw) {
  const entries = [];
  const rejected = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    const m = t.split(/\s*(?:\||—|–)\s*/);
    const text = (m[0] || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const attribution = (m[1] || "").trim() || "Anonymous";
    const letters = (text.match(/[a-zA-Z]/g) || []).length;
    if (letters >= 12) entries.push({ text, attribution });
    else rejected.push(t);
  }
  return { entries, rejected };
}

export default function CryptogramList({ puzzles, progress, onOpen, onAdd, onDeleteCustom, onHome }) {
  const [adding, setAdding] = useState(false);
  const [raw, setRaw] = useState("");
  const [notice, setNotice] = useState("");
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
