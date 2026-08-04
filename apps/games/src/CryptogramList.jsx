import { PUZZLES } from "./cryptogramPuzzles.js";

export default function CryptogramList({ progress, onOpen, onHome }) {
  const solvedCount = PUZZLES.filter((p) => progress[p.id]?.solved).length;

  return (
    <div className="page">
      <div className="topbar">
        <button className="iconbtn" onClick={onHome}>
          ←
        </button>
        <div>
          <div className="tb-title">Cryptogram</div>
          <div className="tb-sub">
            {solvedCount}/{PUZZLES.length} solved
          </div>
        </div>
      </div>
      {PUZZLES.map((p, idx) => {
        const prog = progress[p.id];
        const solved = prog?.solved;
        const started = prog && !solved;
        return (
          <div key={p.id} className="card cg-listitem" onClick={() => onOpen(p.id)}>
            <div className="gamecard-main">
              <div className="gamecard-title">
                #{idx + 1} · {p.text.length} letters
              </div>
              <div className="gamecard-sub">{p.attribution}</div>
            </div>
            {solved ? (
              <span className="cg-badge solved">✓</span>
            ) : started ? (
              <span className="cg-badge started">…</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
