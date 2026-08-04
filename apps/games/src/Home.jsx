import { DIFFICULTIES } from "./sudokuGen.js";
import { fmtElapsed } from "./Sudoku.jsx";
import { PUZZLES } from "./cryptogramPuzzles.js";

function GameCard({ icon, title, subtitle, resume, onClick }) {
  return (
    <div className="card gamecard" onClick={onClick}>
      <div className="gc-icon">{icon}</div>
      <div className="gamecard-main">
        <div className="gamecard-title">{title}</div>
        <div className="gamecard-sub">{subtitle}</div>
      </div>
      <div className="gc-cta">{resume ? "Resume →" : "Play →"}</div>
    </div>
  );
}

export default function Home({ store, onChess, onSudoku, onCrypto }) {
  const chessActive = !!store.chess;
  const chessSub = store.chess
    ? `${store.chess.presetLabel} · ${
        store.chess.flagged != null ? "flag fallen" : store.chess.started ? "in progress" : "not started"
      }`
    : "Presets from bullet to classical, plus custom + Fischer increment";

  const sudokuActive = !!store.sudoku && !store.sudoku.solved;
  const sudokuSub = store.sudoku
    ? `${DIFFICULTIES[store.sudoku.difficulty].label} · ${
        store.sudoku.solved ? "solved" : fmtElapsed(Date.now() - store.sudoku.startedAt)
      }`
    : "Generated puzzles with a guaranteed unique solution";

  const solvedCount = PUZZLES.filter((p) => store.crypto.progress[p.id]?.solved).length;
  const cryptoActive = PUZZLES.some((p) => {
    const prog = store.crypto.progress[p.id];
    return prog && !prog.solved;
  });
  const cryptoSub = `${solvedCount}/${PUZZLES.length} solved`;

  return (
    <div className="page">
      <h1 className="apptitle">
        <span>Games</span>
      </h1>
      <GameCard
        icon="♟"
        title="Chess Clock"
        subtitle={chessSub}
        resume={chessActive}
        onClick={onChess}
      />
      <GameCard
        icon="🔢"
        title="Sudoku"
        subtitle={sudokuSub}
        resume={sudokuActive}
        onClick={onSudoku}
      />
      <GameCard
        icon="🔐"
        title="Cryptogram"
        subtitle={cryptoSub}
        resume={cryptoActive}
        onClick={onCrypto}
      />
    </div>
  );
}
