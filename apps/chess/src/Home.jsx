import { IS_NATIVE } from "./platform.js";
import { getPersona } from "./personas.js";
import {
  Archive, BookOpen, Bot, ChartLine, Download, GraduationCap, Handshake, Landmark, Microscope, Pencil, Puzzle, Swords,
} from "lucide-react";

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
          <span className="mb-icon"><Bot aria-hidden="true" /></span>Play bots
        </button>
        <button className="menubtn" onClick={() => nav("passplay", { setup: true })}>
          <span className="mb-icon"><Handshake aria-hidden="true" /></span>Pass & play
        </button>
        <button className="menubtn primary" onClick={() => nav("lessons")}>
          <span className="mb-icon"><GraduationCap aria-hidden="true" /></span>Lessons
        </button>
        <button className="menubtn" onClick={() => nav("openings")}>
          <span className="mb-icon"><BookOpen aria-hidden="true" /></span>Openings
        </button>
        <button className="menubtn" onClick={() => nav("games")}>
          <span className="mb-icon"><Landmark aria-hidden="true" /></span>Pro games
        </button>
        <button className="menubtn" onClick={() => nav("analysis")}>
          <span className="mb-icon"><Microscope aria-hidden="true" /></span>Analysis
        </button>
        <button className="menubtn" onClick={() => nav("enginematch")}>
          <span className="mb-icon"><Swords aria-hidden="true" /></span>Engine match
        </button>
        <button className="menubtn" onClick={() => nav("editor")}>
          <span className="mb-icon"><Pencil aria-hidden="true" /></span>Custom position
        </button>
        <button className="menubtn" onClick={() => nav("review", { importing: true })}>
          <span className="mb-icon"><Download aria-hidden="true" /></span>Import games
        </button>
        <button className="menubtn" onClick={() => nav("puzzles")}>
          <span className="mb-icon"><Puzzle aria-hidden="true" /></span>Puzzles{unsolved > 0 ? ` (${unsolved} blunders)` : ""}
        </button>
        <button className="menubtn" onClick={() => nav("archive")}>
          <span className="mb-icon"><Archive aria-hidden="true" /></span>Game archive
        </button>
        <button className="menubtn" onClick={() => nav("stats")}>
          <span className="mb-icon"><ChartLine aria-hidden="true" /></span>Stats
        </button>
      </div>

      <button className="linkbtn center" onClick={() => nav("settings")}>
        Settings & themes
      </button>

      <p className="hint small footernote">
        Everything runs on this phone, Stockfish 16 NNUE included.
        {!IS_NATIVE && " First visit downloads the 39 MB engine net once; after that it works fully offline."}
      </p>
    </div>
  );
}
