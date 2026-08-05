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

const HEAD_LEN = 4.6; // board units (a square is 12.5)
const HEAD_HALF = 3.2;

// Square-center to square-center arrow; knight-shaped moves bend in an L
// (long leg first), chess.com style. The shaft stops where the head begins
// and the head's tip sits exactly on the destination square's center, so
// nothing protrudes past the tip.
function arrowGeom(from, to) {
  const p0 = { x: cx(from), y: cy(from) };
  const pEnd = { x: cx(to), y: cy(to) };
  const df = Math.abs(from.col - to.col);
  const dr = Math.abs(from.row - to.row);
  const pts =
    (df === 1 && dr === 2) || (df === 2 && dr === 1)
      ? [p0, df === 2 ? { x: pEnd.x, y: p0.y } : { x: p0.x, y: pEnd.y }, pEnd]
      : [p0, pEnd];

  const prev = pts[pts.length - 2];
  const dx = pEnd.x - prev.x;
  const dy = pEnd.y - prev.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const base = { x: pEnd.x - ux * HEAD_LEN, y: pEnd.y - uy * HEAD_LEN };

  const shaft = [...pts.slice(0, -1), base];
  const d = shaft.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const head = [
    `${pEnd.x.toFixed(2)},${pEnd.y.toFixed(2)}`,
    `${(base.x - uy * HEAD_HALF).toFixed(2)},${(base.y + ux * HEAD_HALF).toFixed(2)}`,
    `${(base.x + uy * HEAD_HALF).toFixed(2)},${(base.y - ux * HEAD_HALF).toFixed(2)}`,
  ].join(" ");
  return { d, head };
}

export const DEFAULT_ARROW_COLORS = { hint: "#15803d", plan: "#e58f2a", threat: "#d02a2a" };

function Arrow({ from, to, color, width = 2.5 }) {
  const { d, head } = arrowGeom(from, to);
  return (
    <g fill={color} stroke={color} opacity="0.82">
      <path d={d} fill="none" strokeWidth={width} strokeLinecap="butt" strokeLinejoin="round" />
      <polygon points={head} stroke="none" />
    </g>
  );
}

/**
 * Tap-tap interactive chess board with right-click planning (circles and
 * arrows, cleared on left-click or position change).
 * Props: fen, orientation, lastMove, checkSquare, dests, onMove, arrow,
 *        threats (array of [from,to]), theme, pieceSet, arrowColors,
 *        needsPromotion
 */
export default function Board({
  fen,
  orientation = "w",
  lastMove,
  checkSquare,
  dests,
  onMove,
  arrow,
  threats,
  theme = "brown",
  pieceSet = "cburnett",
  arrowColors,
  needsPromotion,
}) {
  const colorsArrow = { ...DEFAULT_ARROW_COLORS, ...(arrowColors || {}) };
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
                {circled && <div className="usercircle" style={{ borderColor: colorsArrow.plan }} />}
              </div>
            );
          })
        )}
        <svg className="arrowlayer" viewBox="0 0 100 100">
          {(threats || []).map((t, i) => (
            <Arrow key={"t" + i} from={idx(t[0])} to={idx(t[1])} color={colorsArrow.threat} width={2.2} />
          ))}
          {shapes
            .filter((s) => s.from !== s.to)
            .map((s, i) => (
              <Arrow key={"p" + i} from={idx(s.from)} to={idx(s.to)} color={colorsArrow.plan} width={2.4} />
            ))}
          {arrow && <Arrow from={idx(arrow[0])} to={idx(arrow[1])} color={colorsArrow.hint} width={2.6} />}
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
