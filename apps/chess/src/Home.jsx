import { getPersona } from "./personas.js";

export default function Home({ store, nav }) {
  const cur = store.current;
  const unsolved = store.puzzles.filter((p) => !p.solved).length;

  return (
    <div className="page">
      <h1 className="apptitle">
        Chess<span>.</span>
      </h1>

      {cur && (
        <div className="card resumecard" onClick={() => nav(cur.mode === "bot" ? "play" : "passplay")}>
          <div className="rc-title">
            Resume game{" "}
            {cur.mode === "bot" ? `vs ${getPersona(cur.personaId).name} ${getPersona(cur.personaId).avatar}` : "(pass & play)"}
          </div>
          <div className="rc-sub">{cur.sans.length} moves played</div>
        </div>
      )}

      <div className="menugrid">
        <button className="menubtn primary" onClick={() => nav("play", { pick: true })}>
          <span className="mb-icon">🤖</span>Play bots
        </button>
        <button className="menubtn" onClick={() => nav("passplay", { setup: true })}>
          <span className="mb-icon">🤝</span>Pass & play
        </button>
        <button className="menubtn primary" onClick={() => nav("lessons")}>
          <span className="mb-icon">🎓</span>Lessons
        </button>
        <button className="menubtn" onClick={() => nav("analysis")}>
          <span className="mb-icon">🔬</span>Analysis
        </button>
        <button className="menubtn" onClick={() => nav("review", { importing: true })}>
          <span className="mb-icon">📋</span>Review a PGN
        </button>
        <button className="menubtn" onClick={() => nav("puzzles")}>
          <span className="mb-icon">🧩</span>My blunders{unsolved > 0 ? ` (${unsolved})` : ""}
        </button>
        <button className="menubtn" onClick={() => nav("archive")}>
          <span className="mb-icon">🗄️</span>Game archive
        </button>
      </div>

      <button className="linkbtn center" onClick={() => nav("settings")}>
        Settings & themes
      </button>

      <p className="hint small footernote">
        Everything runs on this phone — Stockfish 16 NNUE included. First visit
        downloads the 39 MB engine net once; after that it works fully offline.
      </p>
    </div>
  );
}
