import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

// Distance between two squares in board units, for matching moved pieces.
function sqDist(a, b) {
  return Math.hypot(FILES.indexOf(a[0]) - FILES.indexOf(b[0]), parseInt(a[1], 10) - parseInt(b[1], 10));
}

// Reconcile the tracked piece list against a new FEN map so each physical
// piece keeps a stable identity (and thus animates) across moves. Matching
// is heuristic but covers every legal transition: quiet moves and captures
// (nearest same-code piece), castling (two same-code matches), en passant
// (the captured pawn fades on its own square), and promotion (same-color
// fallback lets the pawn glide into its new piece). Unmatched appearing
// pieces are minted fresh; unmatched disappearing ones fade out where they
// stood and are dropped on the next reconcile.
function diffPieces(prev, map, keyCounter) {
  const next = [];
  const remaining = { ...map };
  const displaced = [];
  for (const p of prev) {
    if (p.dead) continue;
    if (remaining[p.sq] === p.code) {
      next.push({ ...p, moving: false });
      delete remaining[p.sq];
    } else displaced.push(p);
  }
  for (const sq of Object.keys(remaining)) {
    let best = null;
    let bestD = Infinity;
    for (const p of displaced) {
      if (p.code !== remaining[sq]) continue;
      const d = sqDist(p.sq, sq);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (best) {
      next.push({ ...best, sq, moving: true });
      displaced.splice(displaced.indexOf(best), 1);
      delete remaining[sq];
    }
  }
  for (const sq of Object.keys(remaining)) {
    const code = remaining[sq];
    const i = displaced.findIndex((p) => {
      if (p.code[0] !== code[0]) return false;
      const promoRank = code[0] === "w" ? "8" : "1";
      return (
        (p.code[1] === "P" && code[1] !== "P" && code[1] !== "K" && sq[1] === promoRank) ||
        (code[1] === "P" && p.code[1] !== "P" && p.code[1] !== "K" && p.sq[1] === promoRank)
      );
    });
    if (i >= 0) {
      const p = displaced.splice(i, 1)[0];
      next.push({ ...p, sq, code, moving: true });
      delete remaining[sq];
    }
  }
  for (const sq of Object.keys(remaining)) {
    next.push({ key: "p" + keyCounter.current++, code: remaining[sq], sq, moving: false, dead: false });
  }
  for (const p of displaced) next.push({ ...p, dead: true });
  // Canonical order: React must never reorder the keyed piece nodes — moving
  // a DOM node (insertBefore) kills its in-flight CSS transition, which
  // would make exactly the gliding piece snap into place instead.
  next.sort((a, b) => parseInt(a.key.slice(1), 10) - parseInt(b.key.slice(1), 10));
  return next;
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
  guideArrows,
  highlightSquares,
  theme = "brown",
  pieceSet = "cburnett",
  arrowColors,
  needsPromotion,
  animMs = 200,
}) {
  const colorsArrow = { ...DEFAULT_ARROW_COLORS, ...(arrowColors || {}) };
  const [selected, setSelected] = useState(null);
  const [pendingPromo, setPendingPromo] = useState(null); // {from,to}
  const [shapes, setShapes] = useState([]); // {from,to}; from===to → circle
  const [drawFrom, setDrawFrom] = useState(null);
  const [dragTo, setDragTo] = useState(null); // live preview while drawing
  const boardRef = useRef(null);
  const touch = useRef(null);
  const suppressClick = useRef(false);
  const pieces = useMemo(() => fenToMap(fen), [fen]);
  // Stable-identity piece list, reconciled whenever the FEN changes (ref
  // mutation during render is the derived-state pattern: idempotent per fen).
  const keyCounter = useRef(0);
  const animRef = useRef(null);
  if (animRef.current === null) {
    animRef.current = {
      fen,
      list: Object.entries(pieces).map(([sq, code]) => ({
        key: "p" + keyCounter.current++,
        code,
        sq,
        moving: false,
        dead: false,
      })),
    };
  } else if (animRef.current.fen !== fen) {
    animRef.current = { fen, list: diffPieces(animRef.current.list, pieces, keyCounter) };
  }
  const animPieces = animRef.current.list;
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
    if (suppressClick.current) return; // tail of a long-press drawing gesture
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

  const addShape = useCallback((from, to) => {
    setShapes((ss) => {
      const exists = ss.findIndex((s) => s.from === from && s.to === to);
      if (exists >= 0) return ss.filter((_, i) => i !== exists);
      return [...ss, { from, to }];
    });
  }, []);

  // Mobile planning: long-press a square to start drawing, drag to the
  // target, release to place the arrow (release in place = circle). Native
  // listeners because React's touchmove is passive and can't block scroll.
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const LONG_PRESS_MS = 320;
    const MOVE_TOLERANCE = 12;
    const sqAt = (x, y) => document.elementFromPoint(x, y)?.closest?.("[data-sq]")?.dataset.sq || null;

    const cancel = () => {
      if (touch.current?.timer) clearTimeout(touch.current.timer);
      touch.current = null;
    };

    const onStart = (e) => {
      if (e.touches.length !== 1) return cancel();
      const t = e.touches[0];
      const sq = sqAt(t.clientX, t.clientY);
      if (!sq) return;
      const st = { sq, to: sq, x: t.clientX, y: t.clientY, drawing: false };
      st.timer = setTimeout(() => {
        st.drawing = true;
        setDrawFrom(sq);
        setDragTo(sq);
        navigator.vibrate?.(12);
      }, LONG_PRESS_MS);
      touch.current = st;
    };

    const onMove = (e) => {
      const st = touch.current;
      if (!st) return;
      const t = e.touches[0];
      if (!st.drawing) {
        // moved before the press registered → it's a scroll/tap, not a draw
        if (Math.hypot(t.clientX - st.x, t.clientY - st.y) > MOVE_TOLERANCE) cancel();
        return;
      }
      e.preventDefault(); // hold the page still while drawing
      const sq = sqAt(t.clientX, t.clientY);
      if (sq && sq !== st.to) {
        st.to = sq;
        setDragTo(sq);
      }
    };

    const onEnd = (e) => {
      const st = touch.current;
      if (!st) return;
      const wasDrawing = st.drawing;
      const { sq, to } = st;
      cancel();
      if (!wasDrawing) return;
      e.preventDefault();
      addShape(sq, to);
      setDrawFrom(null);
      setDragTo(null);
      // preventDefault above usually stops the synthetic click; this is a
      // short belt-and-braces window, kept tight so the next real tap works
      suppressClick.current = true;
      setTimeout(() => {
        suppressClick.current = false;
      }, 80);
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: false });
    el.addEventListener("touchcancel", onEnd, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
      cancel();
    };
  }, [addShape]);

  return (
    <div className="boardwrap">
      <div
        ref={boardRef}
        className={"board" + (drawFrom ? " drawing" : "")}
        style={{ "--light": colors.light, "--dark": colors.dark, "--anim-ms": animMs + "ms" }}
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
                  if (e.button === 2) {
                    setDrawFrom(sq);
                    setDragTo(sq);
                  }
                }}
                onMouseEnter={() => {
                  if (drawFrom) setDragTo(sq);
                }}
                onMouseUp={(e) => {
                  if (e.button === 2 && drawFrom) {
                    addShape(drawFrom, sq);
                    setDrawFrom(null);
                    setDragTo(null);
                  }
                }}
              >
                {col === 0 && <span className="coord rank">{r + 1}</span>}
                {row === 7 && <span className="coord file">{FILES[f]}</span>}
                {targets.includes(sq) && <div className={pieces[sq] ? "hintring" : "hintdot"} />}
                {(circled || (drawFrom === sq && dragTo === sq)) && (
                  <div className="usercircle" style={{ borderColor: colorsArrow.plan }} />
                )}
                {(highlightSquares || []).includes(sq) && (
                  <div className="usercircle guide" style={{ borderColor: colorsArrow.hint }} />
                )}
              </div>
            );
          })
        )}
        <div className="piecelayer">
          {animPieces.map((p) => {
            const { col, row } = idx(p.sq);
            return (
              <div
                key={p.key}
                className={"apiece" + (p.dead ? " dead" : "") + (p.moving ? " moving" : "")}
                style={{ transform: `translate(${col * 100}%, ${row * 100}%)` }}
                dangerouslySetInnerHTML={{ __html: svgs[p.code] }}
              />
            );
          })}
        </div>
        <svg className="arrowlayer" viewBox="0 0 100 100">
          {(threats || []).map((t, i) => (
            <Arrow key={"t" + i} from={idx(t[0])} to={idx(t[1])} color={colorsArrow.threat} width={2.2} />
          ))}
          {shapes
            .filter((s) => s.from !== s.to)
            .map((s, i) => (
              <Arrow key={"p" + i} from={idx(s.from)} to={idx(s.to)} color={colorsArrow.plan} width={2.4} />
            ))}
          {(guideArrows || []).map((a, i) => (
            <Arrow key={"g" + i} from={idx(a[0])} to={idx(a[1])} color={colorsArrow.hint} width={2.3} />
          ))}
          {drawFrom && dragTo && drawFrom !== dragTo && (
            <Arrow from={idx(drawFrom)} to={idx(dragTo)} color={colorsArrow.plan} width={2.4} />
          )}
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
