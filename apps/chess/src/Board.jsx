import { useEffect, useMemo, useState } from "react";

// Piece sets (SVGs from lichess, see README attribution) inlined at build
// time — fully offline. Folder name = set id: pieces/<set>/<wK…bP>.svg
const pieceModules = import.meta.glob("./pieces/*/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});
export const PIECE_SETS = {};
for (const [path, svg] of Object.entries(pieceModules)) {
  const m = path.match(/\.\/pieces\/([^/]+)\/([wb][KQRBNP])\.svg$/);
  if (!m) continue;
  (PIECE_SETS[m[1]] = PIECE_SETS[m[1]] || {})[m[2]] = svg;
}
export const PIECE_SET_NAMES = { cburnett: "Cburnett", merida: "Merida", kosal: "Kosal" };

export const BOARD_THEMES = {
  brown: { light: "#f0d9b5", dark: "#b58863", name: "Brown (lichess)" },
  blue: { light: "#dee3e6", dark: "#8ca2ad", name: "Blue" },
  green: { light: "#ffffdd", dark: "#86a666", name: "Green" },
  ice: { light: "#e8edf9", dark: "#7286a3", name: "Ice" },
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function squareName(fileIdx, rankIdx) {
  return FILES[fileIdx] + (rankIdx + 1);
}

// Parse the piece-placement field of a FEN into { e4: "wP", ... }.
function fenToMap(fen) {
  const map = {};
  const rows = fen.split(" ")[0].split("/");
  for (let r = 0; r < 8; r++) {
    let f = 0;
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) f += parseInt(ch, 10);
      else {
        const color = ch === ch.toUpperCase() ? "w" : "b";
        map[squareName(f, 7 - r)] = color + ch.toUpperCase();
        f++;
      }
    }
  }
  return map;
}

const cx = (c) => c.col * 12.5 + 6.25;
const cy = (c) => c.row * 12.5 + 6.25;

// Square-center to square-center path; knight-shaped moves bend in an L
// (long leg first), chess.com style. The arrowhead marker's ref point is
// its tip, so the tip lands exactly on the destination square's center.
function arrowPath(from, to) {
  const x1 = cx(from), y1 = cy(from), x2 = cx(to), y2 = cy(to);
  const df = Math.abs(from.col - to.col);
  const dr = Math.abs(from.row - to.row);
  if ((df === 1 && dr === 2) || (df === 2 && dr === 1)) {
    const mx = df === 2 ? x2 : x1;
    const my = df === 2 ? y1 : y2;
    return `M ${x1} ${y1} L ${mx} ${my} L ${x2} ${y2}`;
  }
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

/**
 * Tap-tap interactive chess board with right-click planning (circles and
 * arrows, cleared on left-click or position change).
 * Props: fen, orientation, lastMove, checkSquare, dests, onMove, arrow,
 *        theme, pieceSet, needsPromotion
 */
export default function Board({
  fen,
  orientation = "w",
  lastMove,
  checkSquare,
  dests,
  onMove,
  arrow,
  theme = "brown",
  pieceSet = "cburnett",
  needsPromotion,
}) {
  const [selected, setSelected] = useState(null);
  const [pendingPromo, setPendingPromo] = useState(null); // {from,to}
  const [shapes, setShapes] = useState([]); // {from,to}; from===to → circle
  const [drawFrom, setDrawFrom] = useState(null);
  const pieces = useMemo(() => fenToMap(fen), [fen]);
  const colors = BOARD_THEMES[theme] || BOARD_THEMES.brown;
  const svgs = PIECE_SETS[pieceSet] || PIECE_SETS.cburnett;
  const ranks = orientation === "w" ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const files = orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const targets = selected && dests ? dests.get(selected) || [] : [];

  useEffect(() => {
    setShapes([]);
    setSelected(null);
  }, [fen]);

  const tap = (sq) => {
    setShapes([]);
    if (!dests) return;
    if (selected && targets.includes(sq)) {
      if (needsPromotion && needsPromotion(selected, sq)) {
        setPendingPromo({ from: selected, to: sq });
      } else {
        onMove(selected, sq);
      }
      setSelected(null);
      return;
    }
    setSelected(dests.has(sq) && sq !== selected ? sq : null);
  };

  const idx = (sq) => {
    const f = FILES.indexOf(sq[0]);
    const r = parseInt(sq[1], 10) - 1;
    const col = orientation === "w" ? f : 7 - f;
    const row = orientation === "w" ? 7 - r : r;
    return { col, row };
  };

  const addShape = (from, to) => {
    setShapes((ss) => {
      const exists = ss.findIndex((s) => s.from === from && s.to === to);
      if (exists >= 0) return ss.filter((_, i) => i !== exists);
      return [...ss, { from, to }];
    });
  };

  return (
    <div className="boardwrap">
      <div
        className="board"
        style={{ "--light": colors.light, "--dark": colors.dark }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {ranks.map((r, row) =>
          files.map((f, col) => {
            const sq = squareName(f, r);
            const isDark = (f + r) % 2 === 0;
            const isLast = lastMove && (lastMove[0] === sq || lastMove[1] === sq);
            const circled = shapes.some((s) => s.from === sq && s.to === sq);
            const cls =
              "sq " +
              (isDark ? "dark" : "light") +
              (isLast ? " last" : "") +
              (sq === selected ? " sel" : "") +
              (sq === checkSquare ? " check" : "");
            return (
              <div
                key={sq}
                data-sq={sq}
                className={cls}
                style={{ gridColumn: col + 1, gridRow: row + 1 }}
                onClick={() => tap(sq)}
                onMouseDown={(e) => {
                  if (e.button === 2) setDrawFrom(sq);
                }}
                onMouseUp={(e) => {
                  if (e.button === 2 && drawFrom) {
                    addShape(drawFrom, sq);
                    setDrawFrom(null);
                  }
                }}
              >
                {col === 0 && <span className="coord rank">{r + 1}</span>}
                {row === 7 && <span className="coord file">{FILES[f]}</span>}
                {pieces[sq] && (
                  <div className="piece" dangerouslySetInnerHTML={{ __html: svgs[pieces[sq]] }} />
                )}
                {targets.includes(sq) && <div className={pieces[sq] ? "hintring" : "hintdot"} />}
                {circled && <div className="usercircle" />}
              </div>
            );
          })
        )}
        <svg className="arrowlayer" viewBox="0 0 100 100">
          <defs>
            <marker id="head-hint" markerWidth="4" markerHeight="4" refX="4" refY="2" orient="auto">
              <path d="M0,0 L4,2 L0,4 Z" fill="rgba(21, 128, 61, 0.85)" />
            </marker>
            <marker id="head-user" markerWidth="4" markerHeight="4" refX="4" refY="2" orient="auto">
              <path d="M0,0 L4,2 L0,4 Z" fill="rgba(229, 143, 42, 0.9)" />
            </marker>
          </defs>
          {shapes
            .filter((s) => s.from !== s.to)
            .map((s, i) => (
              <path
                key={i}
                d={arrowPath(idx(s.from), idx(s.to))}
                fill="none"
                stroke="rgba(229, 143, 42, 0.8)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd="url(#head-user)"
              />
            ))}
          {arrow && (
            <path
              d={arrowPath(idx(arrow[0]), idx(arrow[1]))}
              fill="none"
              stroke="rgba(21, 128, 61, 0.75)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd="url(#head-hint)"
            />
          )}
        </svg>
      </div>

      {pendingPromo && (
        <div className="promo-overlay" onClick={() => setPendingPromo(null)}>
          <div className="promo-box" onClick={(e) => e.stopPropagation()}>
            {["q", "r", "b", "n"].map((p) => {
              const color = fen.split(" ")[1] === "w" ? "w" : "b";
              return (
                <button
                  key={p}
                  className="promo-piece"
                  onClick={() => {
                    onMove(pendingPromo.from, pendingPromo.to, p);
                    setPendingPromo(null);
                  }}
                  dangerouslySetInnerHTML={{ __html: svgs[color + p.toUpperCase()] }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Eval bar: cp from white's perspective; oriented with the board.
export function EvalBar({ cp, orientation }) {
  const pct = 50 + 50 * (2 / (1 + Math.exp(-0.004 * Math.max(-1500, Math.min(1500, cp)))) - 1);
  const whiteShare = Math.max(4, Math.min(96, pct));
  const label = Math.abs(cp) >= 9000 ? (cp > 0 ? "M" : "-M") : (cp / 100).toFixed(1);
  return (
    <div className={"evalbar" + (orientation === "b" ? " flipped" : "")}>
      <div className="evalbar-white" style={{ height: whiteShare + "%" }} />
      <span className="evalbar-label">{label}</span>
    </div>
  );
}
