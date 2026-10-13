import { useMemo } from "react";
import { PIECE_SETS, BOARD_THEMES } from "./Board.jsx";

// A small, still picture of a position in your own board theme and pieces,
// for cards and lists (plan item 10). Not interactive.
export default function MiniBoard({ fen, orientation = "w", lastMove = null, settings = {}, size = 96, label }) {
  const colors = BOARD_THEMES[settings.theme] || BOARD_THEMES.brown;
  const custom = settings.boardCustom || {};
  const svgs = PIECE_SETS[settings.pieces] || PIECE_SETS.cburnett;
  const squares = useMemo(() => {
    const rows = String(fen || "").split(" ")[0].split("/");
    const grid = rows.map((r) => {
      const out = [];
      for (const ch of r) {
        if (/\d/.test(ch)) for (let i = 0; i < Number(ch); i++) out.push(null);
        else out.push((ch === ch.toUpperCase() ? "w" : "b") + ch.toUpperCase());
      }
      return out;
    });
    const list = [];
    for (let row = 0; row < 8; row++)
      for (let col = 0; col < 8; col++) {
        const r = orientation === "w" ? row : 7 - row;
        const f = orientation === "w" ? col : 7 - col;
        const sq = "abcdefgh"[f] + (8 - r);
        list.push({ sq, piece: grid[r]?.[f] || null, light: (r + f) % 2 === 0 });
      }
    return list;
  }, [fen, orientation]);
  return (
    <div
      className="miniboard"
      role="img"
      aria-label={label || "Board position"}
      style={{ width: size, height: size, "--light": custom.light || colors.light, "--dark": custom.dark || colors.dark }}
    >
      {squares.map(({ sq, piece, light }) => (
        <div
          key={sq}
          className={"msq " + (light ? "light" : "dark") + (lastMove?.includes(sq) ? " last" : "")}
          dangerouslySetInnerHTML={piece ? { __html: svgs[piece] } : undefined}
        />
      ))}
    </div>
  );
}
