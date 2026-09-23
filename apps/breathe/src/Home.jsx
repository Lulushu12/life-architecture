import { useState } from "react";
import { IconButton } from "@shared/ui.jsx";
import { BackupPanel } from "@shared/BackupPanel.jsx";
import { formatElapsed } from "./format.js";
import { STORE_KEY, validateBackup } from "./storage.js";

const PAGE = 20;

function monthLabel(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function HistoryCard({ entry, onDelete }) {
  const date = new Date(entry.startedAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const breathing = entry.type === "breathing";
  const title = breathing ? "Breathing" : "Meditation";

  return (
    <div className="card histcard">
      <div className="histcard-main">
        <div className="histcard-title">
          <span aria-hidden="true">{breathing ? "🌬️" : "🧘"}</span> {title}
          {!entry.complete && <span className="badge incomplete">incomplete</span>}
        </div>
        {breathing ? (
          <>
            <div className="histcard-sub">
              {date} · {entry.rounds.length}/{entry.plannedRounds} round{entry.plannedRounds === 1 ? "" : "s"}
            </div>
            {entry.rounds.length > 0 && (
              <div className="histcard-rounds">
                {entry.rounds.map((r) => formatElapsed(r.retentionSeconds)).join("  ·  ")}
              </div>
            )}
          </>
        ) : (
          <div className="histcard-sub">
            {date} · {formatElapsed(entry.actualSeconds || 0)} of {formatElapsed(entry.targetSeconds)}
          </div>
        )}
      </div>
      <IconButton label={`Delete ${title.toLowerCase()} session from ${date}`} onClick={() => onDelete(entry.id)}>
        ✕
      </IconButton>
    </div>
  );
}

export default function Home({ store, stats, hiddenId, onDelete, onNewBreathing, onNewMeditation, onRestore, onSafety }) {
  const [limit, setLimit] = useState(PAGE);
  const history = store.history.filter((h) => h.id !== hiddenId).sort((a, b) => b.startedAt - a.startedAt);
  const shown = history.slice(0, limit);
  const groups = [];
  for (const h of shown) {
    const label = monthLabel(h.startedAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(h);
    else groups.push({ label, items: [h] });
  }

  return (
    <div className="page">
      <h1 className="apptitle">
        Bre<span>athe</span>
      </h1>

      <div className="statsgrid">
        <div className="stattile">
          <div className="val">{stats.breathingThisWeek}</div>
          <div className="lbl">Breathing sessions this week</div>
        </div>
        <div className="stattile">
          <div className="val">{stats.meditationMinutesThisWeek}</div>
          <div className="lbl">Meditation minutes this week</div>
        </div>
        <div className="stattile">
          <div className="val">{stats.streak}</div>
          <div className="lbl">Day streak</div>
        </div>
        <div className="stattile">
          <div className="val">{formatElapsed(stats.bestHold)}</div>
          <div className="lbl">Best breath hold</div>
        </div>
      </div>

      <button type="button" className="modebtn" onClick={onNewBreathing}>
        <span className="emoji" aria-hidden="true">🌬️</span>
        <span>
          <span className="modetitle">Breathing</span>
          <span className="modesub">Wim Hof style rounds with retention holds</span>
        </span>
      </button>
      <button type="button" className="modebtn" onClick={onNewMeditation}>
        <span className="emoji" aria-hidden="true">🧘</span>
        <span>
          <span className="modetitle">Meditation</span>
          <span className="modesub">Timed sit with optional interval bell</span>
        </span>
      </button>

      {history.length > 0 && <h2>History</h2>}
      {groups.map((g) => (
        <section key={g.label} aria-label={g.label}>
          <div className="monthlabel">{g.label}</div>
          {g.items.map((h) => (
            <HistoryCard key={h.id} entry={h} onDelete={onDelete} />
          ))}
        </section>
      ))}
      {history.length > limit && (
        <button type="button" className="bigbtn secondary" onClick={() => setLimit((n) => n + PAGE)}>
          Show more ({history.length - limit} older)
        </button>
      )}
      {history.length === 0 && (
        <p className="hint">No sessions yet. Start a breathing round or a timed meditation above.</p>
      )}

      <h2>Data</h2>
      <div className="card">
        <BackupPanel
          data={store}
          prefix="breathe"
          storageKey={STORE_KEY}
          strip={["_recovered", "activeSession"]}
          validate={validateBackup}
          onRestore={onRestore}
        />
        <button type="button" className="linkbtn" onClick={onSafety}>
          Breathing safety notes
        </button>
      </div>
    </div>
  );
}
