import { useMemo, useState } from "react";
import { BackupPanel } from "@shared/BackupPanel.jsx";
import { IconButton } from "@shared/ui.jsx";
import { computeWhist, computeRentz, signed } from "./rules.js";
import { KEY, mergeImport, validateBackup } from "./storage.js";

function summary(g) {
  const c = g.type === "whist" ? computeWhist(g) : computeRentz(g);
  const scored = g.type === "whist" ? c.completeRounds > 0 : c.handsPlayed > 0;
  const progress = c.done
    ? "Finished"
    : g.type === "whist"
      ? `Round ${Math.min(c.completeRounds + 1, c.seq.length)}/${c.seq.length}`
      : `Hand ${c.handsPlayed + 1}/${c.totalHands}`;
  if (!scored) return { done: c.done, progress, leader: "No scores yet" };
  const best = Math.max(...c.totals);
  const top = g.players.filter((_, i) => c.totals[i] === best);
  const label = top.length > 1 ? "Tied" : c.done ? "Winner" : "Leader";
  return { done: c.done, progress, leader: `${label}: ${top.join(" & ")} ${signed(best)}` };
}

const monthLabel = (ts) => new Date(ts).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

function GameCard({ g, s, onOpen, onDelete }) {
  return (
    <div
      className="card gamecard"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(g.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(g.id);
        }
      }}
    >
      <div className="gamecard-main">
        <div className="gamecard-title">
          <span className={"typetag " + g.type}>{g.type === "whist" ? "Whist" : "Rentz"}</span>
          {g.players.join(", ")}
        </div>
        <div className="gamecard-sub">
          {s.progress} · {s.leader} · {new Date(g.updatedAt || g.createdAt).toLocaleDateString()}
        </div>
      </div>
      <IconButton
        label="Delete game"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(g.id);
        }}
      >
        ✕
      </IconButton>
    </div>
  );
}

const FILTERS = [
  ["all", "All"],
  ["whist", "Whist"],
  ["rentz", "Rentz"],
];

export default function Home({ store, setStore, onOpen, onNewWhist, onNewRentz, onDelete }) {
  const [filter, setFilter] = useState("all");
  const games = useMemo(
    () =>
      Object.values(store.games)
        .map((g) => ({ g, s: summary(g) }))
        .sort((a, b) => (b.g.updatedAt || 0) - (a.g.updatedAt || 0)),
    [store.games]
  );
  const active = games.filter((x) => !x.s.done);
  const finished = games.filter((x) => x.s.done);
  const hasBothTypes = new Set(finished.map((x) => x.g.type)).size > 1;
  const type = hasBothTypes ? filter : "all";
  const shown = finished.filter((x) => type === "all" || x.g.type === type);
  const months = [];
  for (const x of shown) {
    const label = monthLabel(x.g.updatedAt || x.g.createdAt || 0);
    const last = months[months.length - 1];
    if (last && last.label === label) last.items.push(x);
    else months.push({ label, items: [x] });
  }

  const card = (x) => <GameCard key={x.g.id} g={x.g} s={x.s} onOpen={onOpen} onDelete={onDelete} />;

  return (
    <div className="page">
      <h1 className="apptitle">
        Whist <span>&</span> Rentz
      </h1>
      <div className="newrow">
        <button type="button" className="bigbtn whist" onClick={onNewWhist}>
          + New Whist
        </button>
        <button type="button" className="bigbtn rentz" onClick={onNewRentz}>
          + New Rentz
        </button>
      </div>
      {active.length > 0 && (
        <>
          <h2>Unfinished games</h2>
          {active.map(card)}
        </>
      )}
      {finished.length > 0 && (
        <>
          <h2>History</h2>
          {hasBothTypes && (
            <div className="chips" role="group" aria-label="Filter history">
              {FILTERS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={type === id}
                  className={"chip" + (type === id ? " sel" : "")}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {months.map((m) => (
            <section key={m.label} className="monthgroup">
              <h3 className="monthlabel">{m.label}</h3>
              {m.items.map(card)}
            </section>
          ))}
        </>
      )}
      {games.length === 0 && (
        <p className="hint">
          No games yet. Every tap is saved on this device instantly, so closing the app never loses a
          game.
        </p>
      )}
      <h2>Backup</h2>
      <BackupPanel
        data={store}
        onRestore={(d) => setStore((s) => mergeImport(s, d))}
        validate={validateBackup}
        prefix="whist-rentz"
        strip={["_recovered"]}
        storageKey={KEY}
      />
    </div>
  );
}
