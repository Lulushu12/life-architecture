import { TopBar } from "./ui.jsx";
import { getPersona } from "./personas.js";

export default function Archive({ store, setStore, nav }) {
  const games = store.games;
  return (
    <div className="page">
      <TopBar title="Game archive" sub={`${games.length} games`} onBack={() => nav("home")} />
      {games.length === 0 && <p className="hint">Finished games land here, with their reviews.</p>}
      {games.map((game) => (
        <div key={game.id} className="card gamecard" onClick={() => nav("review", { gameId: game.id })}>
          <div className="gamecard-main">
            <div className="gamecard-title">
              {game.mode === "bot"
                ? `${getPersona(game.personaId).avatar} vs ${getPersona(game.personaId).name}`
                : game.mode === "pass"
                  ? "🤝 Pass & play"
                  : `📋 ${game.label || "Imported"}`}
              {"  "}
              <span className="result">{game.result || ""}</span>
            </div>
            <div className="gamecard-sub">
              {new Date(game.date).toLocaleDateString()} · {game.sans.length} moves ·{" "}
              {game.review
                ? `reviewed (${game.review.accuracy.w}% / ${game.review.accuracy.b}%)`
                : "tap to review"}
            </div>
          </div>
          <button
            className="iconbtn"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Delete this game?"))
                setStore((s) => ({ ...s, games: s.games.filter((x) => x.id !== game.id) }));
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
