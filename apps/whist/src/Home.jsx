import { computeWhist, computeRentz } from "./rules.js";
import { mergeImport } from "./storage.js";
import BackupPanel from "./BackupPanel.jsx";

function summary(g) {
  const c = g.type === "whist" ? computeWhist(g) : computeRentz(g);
  const progress =
    g.type === "whist"
      ? c.done
        ? "Finished"
        : `Round ${Math.min(c.completeRounds + 1, c.seq.length)}/${c.seq.length}`
      : c.done
        ? "Finished"
        : `Hand ${c.handsPlayed + 1}/${c.totalHands}`;
  const best = Math.max(...c.totals);
  const leader = `${g.players[c.totals.indexOf(best)]} ${best > 0 ? "+" : ""}${best}`;
  return { done: c.done, progress, leader };
}

export default function Home({ store, setStore, onOpen, onNewWhist, onNewRentz, onDelete }) {
  const games = Object.values(store.games)
    .map((g) => ({ g, s: summary(g) }))
    .sort((a, b) => (b.g.updatedAt || 0) - (a.g.updatedAt || 0));
  const active = games.filter((x) => !x.s.done);
  const finished = games.filter((x) => x.s.done);

  const GameCard = ({ g, s }) => (
    <div className="card gamecard" onClick={() => onOpen(g.id)}>
      <div className="gamecard-main">
        <div className="gamecard-title">
          {g.type === "whist" ? "Whist" : "Rentz"} · {g.players.join(", ")}
        </div>
        <div className="gamecard-sub">
          {s.progress} · {s.done ? "winner" : "leader"}: {s.leader} ·{" "}
          {new Date(g.updatedAt || g.createdAt).toLocaleDateString()}
        </div>
      </div>
      <button
        className="iconbtn"
        onClick={(e) => {
          e.stopPropagation();
          if (confirm("Delete this game?")) onDelete(g.id);
        }}
      >
        ✕
      </button>
    </div>
  );

  return (
    <div className="page">
      <h1 className="apptitle">
        Whist <span>&</span> Rentz
      </h1>
      <div className="newrow">
        <button className="bigbtn whist" onClick={onNewWhist}>
          + New Whist
        </button>
        <button className="bigbtn rentz" onClick={onNewRentz}>
          + New Rentz
        </button>
      </div>
      {active.length > 0 && (
        <>
          <h2>Unfinished games</h2>
          {active.map((x) => (
            <GameCard key={x.g.id} g={x.g} s={x.s} />
          ))}
        </>
      )}
      {finished.length > 0 && (
        <>
          <h2>History</h2>
          {finished.map((x) => (
            <GameCard key={x.g.id} g={x.g} s={x.s} />
          ))}
        </>
      )}
      {games.length === 0 && (
        <p className="hint">
          No games yet. Every tap is saved on this device instantly — closing the
          app never loses a game.
        </p>
      )}
      <BackupPanel
        data={store}
        onRestore={(d) => setStore((s) => mergeImport(s, d))}
        validate={(d) => Boolean(d && d.games)}
        prefix="whist-rentz"
      />
    </div>
  );
}
