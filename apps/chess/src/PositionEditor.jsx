import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { TopBar } from "./ui.jsx";
import { BOARD_THEMES, PIECE_SETS } from "./Board.jsx";

// Set up any position by hand, then hand it to the rest of the app: analyse it,
// play it against a bot, or set two engines loose on it.
//
// This can't reuse Board.jsx — that board moves pieces according to the rules,
// and an editor needs to put a piece anywhere, including positions that aren't
// reachable by legal play.

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];
const PALETTE = ["K", "Q", "R", "B", "N", "P"];

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Board array (a8..h1) from the piece-placement field of a FEN. */
function boardFromFen(fen) {
  const rows = fen.split(" ")[0].split("/");
  const out = {};
  rows.forEach((row, r) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) f += Number(ch);
      else out[FILES[f++] + RANKS[r]] = ch;
    }
  });
  return out;
}

function fenFromBoard(board, turn, castling, ep) {
  const rows = RANKS.map((rank) => {
    let row = "";
    let empty = 0;
    for (const file of FILES) {
      const p = board[file + rank];
      if (p) {
        if (empty) { row += empty; empty = 0 }
        row += p;
      } else empty++;
    }
    if (empty) row += empty;
    return row;
  });
  return `${rows.join("/")} ${turn} ${castling || "-"} ${ep || "-"} 0 1`;
}

/** A position where the side NOT to move is in check is illegal — the king
 *  could simply be captured. chess.js loads these; engines hang on them. */
function opponentInCheck(fen) {
  const p = fen.split(" ");
  p[1] = p[1] === "w" ? "b" : "w";
  p[3] = "-";
  try {
    return new Chess(p.join(" ")).inCheck();
  } catch {
    return false;
  }
}

function problems(board, fen) {
  const out = [];
  const vals = Object.values(board);
  const wk = vals.filter((p) => p === "K").length;
  const bk = vals.filter((p) => p === "k").length;
  if (wk !== 1) out.push(wk === 0 ? "White needs a king." : "White has more than one king.");
  if (bk !== 1) out.push(bk === 0 ? "Black needs a king." : "Black has more than one king.");
  for (const [sq, p] of Object.entries(board)) {
    if ((p === "P" || p === "p") && (sq[1] === "1" || sq[1] === "8"))
      out.push(`A pawn can't stand on ${sq}.`);
  }
  if (out.length) return out;
  try {
    new Chess(fen);
  } catch (e) {
    out.push(e.message.replace(/^Invalid FEN:?\s*/i, ""));
    return out;
  }
  if (opponentInCheck(fen))
    out.push("The side not to move is in check — that position can't arise.");
  return out;
}

export default function PositionEditor({ store, setStore, nav }) {
  const [board, setBoard] = useState(() => boardFromFen(store.editor?.fen || START));
  const [turn, setTurn] = useState(() => (store.editor?.fen || START).split(" ")[1] || "w");
  const [castling, setCastling] = useState(() => (store.editor?.fen || START).split(" ")[2] || "-");
  const [held, setHeld] = useState("P"); // palette selection; "" = eraser
  const [flipped, setFlipped] = useState(false);
  const [paste, setPaste] = useState("");
  const [pasteErr, setPasteErr] = useState("");

  const theme = BOARD_THEMES[store.settings.theme] || BOARD_THEMES.brown;
  const svgs = PIECE_SETS[store.settings.pieces] || PIECE_SETS.cburnett;

  const fen = useMemo(() => fenFromBoard(board, turn, castling, "-"), [board, turn, castling]);
  const issues = useMemo(() => problems(board, fen), [board, fen]);
  const valid = issues.length === 0;

  // Castling rights are only meaningful when king and rook are still home.
  const canCastle = (right) => {
    const map = { K: ["e1", "h1", "K", "R"], Q: ["e1", "a1", "K", "R"], k: ["e8", "h8", "k", "r"], q: ["e8", "a8", "k", "r"] };
    const [ks, rs, kp, rp] = map[right];
    return board[ks] === kp && board[rs] === rp;
  };
  const toggleCastle = (right) => {
    const cur = new Set(castling.replace("-", "").split(""));
    cur.has(right) ? cur.delete(right) : cur.add(right);
    const order = ["K", "Q", "k", "q"].filter((r) => cur.has(r));
    setCastling(order.length ? order.join("") : "-");
  };

  const tap = (sq) => {
    setBoard((b) => {
      const next = { ...b };
      if (!held) delete next[sq];
      else if (next[sq] === held) delete next[sq]; // tapping the same piece clears
      else next[sq] = held;
      return next;
    });
  };

  const load = (f) => {
    try {
      new Chess(f); // throws on nonsense
      setBoard(boardFromFen(f));
      const parts = f.split(" ");
      setTurn(parts[1] || "w");
      setCastling(parts[2] || "-");
      setPaste("");
      setPasteErr("");
    } catch (e) {
      setPasteErr(e.message.replace(/^Invalid FEN:?\s*/i, ""));
    }
  };

  // Remember the position so returning to the editor doesn't start over.
  const remember = () => setStore((s) => ({ ...s, editor: { fen } }));

  const ranks = flipped ? [...RANKS].reverse() : RANKS;
  const files = flipped ? [...FILES].reverse() : FILES;

  return (
    <div className="page">
      <TopBar title="Custom position" sub={valid ? "Ready" : `${issues.length} to fix`} onBack={() => nav("home")} />

      <div className="editboard" style={{ background: theme.dark }}>
        {ranks.map((rank) =>
          files.map((file) => {
            const sq = file + rank;
            const light = (FILES.indexOf(file) + rank) % 2 === 1;
            const piece = board[sq];
            return (
              <button
                key={sq}
                className="editsq"
                style={{ background: light ? theme.light : theme.dark }}
                onClick={() => tap(sq)}
                aria-label={sq}
              >
                {piece && (
                  <span
                    className="piece"
                    dangerouslySetInnerHTML={{
                      __html: svgs[(piece === piece.toUpperCase() ? "w" : "b") + piece.toUpperCase()],
                    }}
                  />
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="palette">
        {["w", "b"].map((color) => (
          <div key={color} className="palrow">
            {PALETTE.map((p) => {
              const code = color === "w" ? p : p.toLowerCase();
              return (
                <button
                  key={code}
                  className={"palpiece" + (held === code ? " sel" : "")}
                  onClick={() => setHeld(code)}
                  aria-label={`${color === "w" ? "white" : "black"} ${p}`}
                >
                  <span className="piece" dangerouslySetInnerHTML={{ __html: svgs[color + p] }} />
                </button>
              );
            })}
          </div>
        ))}
        <button className={"palpiece erase" + (held === "" ? " sel" : "")} onClick={() => setHeld("")}>
          ⌫ Erase
        </button>
      </div>

      <div className="setrow">
        <span className="setlabel">To move</span>
        <div className="chips">
          <button className={"chip" + (turn === "w" ? " sel" : "")} onClick={() => setTurn("w")}>White</button>
          <button className={"chip" + (turn === "b" ? " sel" : "")} onClick={() => setTurn("b")}>Black</button>
        </div>
      </div>

      <div className="setrow">
        <span className="setlabel">Castling</span>
        <div className="chips">
          {["K", "Q", "k", "q"].map((r) => (
            <button
              key={r}
              className={"chip" + (castling.includes(r) ? " sel" : "")}
              disabled={!canCastle(r)}
              onClick={() => toggleCastle(r)}
              title={canCastle(r) ? "" : "King and rook must be on their home squares"}
            >
              {r === "K" ? "White O-O" : r === "Q" ? "White O-O-O" : r === "k" ? "Black O-O" : "Black O-O-O"}
            </button>
          ))}
        </div>
      </div>

      <div className="btnrow toolrow">
        <button className="linkbtn" onClick={() => load(START)}>Start position</button>
        <button className="linkbtn" onClick={() => { setBoard({}); setCastling("-") }}>Clear</button>
        <button className="linkbtn" onClick={() => setFlipped((f) => !f)}>⇅ Flip</button>
      </div>

      {issues.length > 0 && (
        <div className="card">
          {issues.map((p, i) => (
            <p key={i} className="warn">{p}</p>
          ))}
        </div>
      )}

      <h2>Use this position</h2>
      <div className="btnrow toolrow">
        <button className="bigbtn" disabled={!valid} onClick={() => { remember(); nav("analysis", { fen }) }}>
          🔬 Analyse
        </button>
        <button
          className="bigbtn"
          disabled={!valid}
          onClick={() => { remember(); nav("play", { pick: true, fromFen: fen, fromLabel: "your position" }) }}
        >
          ♟ Play a bot
        </button>
        <button className="bigbtn" disabled={!valid} onClick={() => { remember(); nav("enginematch", { fen }) }}>
          ⚔ Engine match
        </button>
      </div>

      <h2>FEN</h2>
      <textarea className="input backuptext" readOnly value={fen} onFocus={(e) => e.target.select()} />
      <textarea
        className="input backuptext"
        placeholder="…or paste a FEN to load it"
        value={paste}
        onChange={(e) => { setPaste(e.target.value); setPasteErr("") }}
      />
      {pasteErr && <p className="warn">{pasteErr}</p>}
      <button className="linkbtn" disabled={!paste.trim()} onClick={() => load(paste.trim())}>
        Load pasted FEN
      </button>
    </div>
  );
}
