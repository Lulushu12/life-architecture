import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import Board from "./Board.jsx";
import { TopBar } from "./ui.jsx";
import {
  loadOpeningMeta,
  continuations,
  nameFor,
  searchLines,
  formatEval,
  verdict,
} from "./openingdb.js";

// Browsable reference over every named opening the app knows (3,704 lines from
// lichess-org/chess-openings, CC0). You walk the tree move by move; at each
// position it names what you're in, lists every continuation that leads
// somewhere named, and — where the data exists — how often each is actually
// played and what the engine makes of it.
export default function Openings({ store, nav }) {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");
  const [sans, setSans] = useState([]); // moves played so far
  const [query, setQuery] = useState("");
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadOpeningMeta()
      .then((m) => !cancelled && setMeta(m))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  const chess = useMemo(() => {
    const c = new Chess();
    for (const san of sans) {
      try {
        if (!c.move(san)) break;
      } catch {
        break;
      }
    }
    return c;
  }, [sans]);

  const named = useMemo(() => (sans.length ? nameFor(sans) : null), [sans]);
  const nexts = useMemo(() => continuations(sans, meta), [sans, meta]);
  const results = useMemo(() => searchLines(query, meta), [query, meta]);

  const ev = named && meta?.evals?.[named.key];
  const exact = named && named.sans.length === sans.length;

  // Legal destinations, so the board can be played on directly.
  const dests = useMemo(() => {
    const map = new Map();
    for (const m of chess.moves({ verbose: true })) {
      if (!map.has(m.from)) map.set(m.from, []);
      map.get(m.from).push(m.to);
    }
    return map;
  }, [chess]);

  const playMove = (from, to, promotion) => {
    const probe = new Chess(chess.fen());
    let mv = null;
    try {
      mv = probe.move({ from, to, promotion: promotion || "q" });
    } catch {
      mv = null;
    }
    if (mv) setSans((s) => [...s, mv.san]);
  };

  const jumpTo = (line) => {
    setSans(line.sans.slice());
    setQuery("");
  };

  return (
    <div className="page gamepage">
      <TopBar
        title="Openings"
        sub={
          named
            ? `${named.eco} · ${named.name}${exact ? "" : " (transposed)"}`
            : `${sans.length ? "unnamed position" : "3,704 named lines"}`
        }
        onBack={() => nav("home")}
      />

      {error && <p className="warn">Couldn't load opening data: {error}</p>}

      <input
        className="input"
        placeholder="Search by name or ECO — e.g. Najdorf, B90, London"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query.trim() ? (
        <div className="card">
          {results.length === 0 && <p className="hint">Nothing matches “{query}”.</p>}
          {results.map((l) => (
            <button key={l.key} className="openrow" onClick={() => jumpTo(l)}>
              <span className="or-eco">{l.eco}</span>
              <span className="or-name">{l.name}</span>
              <span className="or-plays">{meta?.plays?.[l.key] ? fmtPlays(meta.plays[l.key]) : ""}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <Board
            fen={chess.fen()}
            orientation={flipped ? "b" : "w"}
            dests={dests}
            onMove={playMove}
            theme={store.settings.theme}
            pieceSet={store.settings.pieces}
            animMs={store.settings.animMs}
            arrowColors={store.settings.arrowColors}
            needsPromotion={(from, to) => {
              const piece = chess.get(from);
              return piece?.type === "p" && (to[1] === "8" || to[1] === "1");
            }}
          />

          <div className="movepath">
            {sans.length === 0 ? (
              <span className="hint small">Play a move, or pick one below.</span>
            ) : (
              sans.map((s, i) => (
                <button key={i} className="pathmove" onClick={() => setSans(sans.slice(0, i + 1))}>
                  {i % 2 === 0 ? `${i / 2 + 1}.` : ""}
                  {s}
                </button>
              ))
            )}
          </div>

          {named && (
            <div className="card opencard">
              <div className="oc-title">
                {named.eco} · {named.name}
              </div>
              {!exact && <div className="hint small">Position is deeper than this name — you've transposed out of book.</div>}
              {ev && (
                <div className="oc-eval">
                  <b>{formatEval(ev)}</b> <span className="hint small">{verdict(ev)}</span>
                </div>
              )}
              {meta?.plays?.[named.key] != null && (
                <div className="hint small">Seen in {fmtPlays(meta.plays[named.key])} of the reference set</div>
              )}
            </div>
          )}

          <h2>
            {nexts.length ? `Continuations (${nexts.length})` : "End of book"}
            <span className="groupcount">{chess.turn() === "w" ? "White" : "Black"} to move</span>
          </h2>

          {nexts.length === 0 && (
            <p className="hint">
              No named line continues from here. Everything past this point is your own.
            </p>
          )}

          {nexts.map((n) => (
            <button key={n.move} className="openrow" onClick={() => setSans((s) => [...s, n.move])}>
              <span className="or-move">{n.move}</span>
              <span className="or-name">
                {n.best.name}
                {n.lines > 1 && <span className="or-sub"> +{n.lines - 1} more</span>}
              </span>
              <span className="or-plays">
                {n.exactPlays != null ? fmtPlays(n.exactPlays) : `${n.lines} line${n.lines === 1 ? "" : "s"}`}
              </span>
            </button>
          ))}

          <div className="btnrow toolrow">
            <button className="linkbtn" onClick={() => setSans((s) => s.slice(0, -1))} disabled={!sans.length}>
              ‹ Back
            </button>
            <button className="linkbtn" onClick={() => setSans([])} disabled={!sans.length}>
              Reset
            </button>
            <button className="linkbtn" onClick={() => setFlipped((f) => !f)}>
              ⇅ Flip
            </button>
            <button
              className="bigbtn"
              onClick={() =>
                nav("play", {
                  pick: true,
                  fromFen: chess.fen(),
                  fromLabel: named ? `${named.eco} ${named.name}` : "this position",
                })
              }
            >
              ♟ Play from here
            </button>
          </div>

          <p className="hint small footernote">
            Lines from lichess-org/chess-openings (CC0). Game counts come from tagged games in the
            Lichess puzzle database and are shown only for exactly-named lines — sub-variations
            without their own count are listed by how many named lines run through them, rather
            than inheriting their parent's figures. Evaluations are this app's own Stockfish at
            depth 12.
          </p>
        </>
      )}
    </div>
  );
}

function fmtPlays(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M games";
  if (n >= 1000) return Math.round(n / 1000) + "k games";
  return n + " games";
}
