import { useMemo, useState } from "react";
import { IconButton } from "@shared/ui.jsx";
import { BackupPanel } from "@shared/BackupPanel.jsx";
import { formatElapsed } from "./format.js";
import { STORE_KEY, validateBackup } from "./storage.js";
import { isRetention, patternById } from "./patterns.js";
import { GoalRing, HoldTrend, WeekBars } from "./Charts.jsx";
import { averageMood, holdTrend, weeklyMinutes } from "./stats.js";
import { moodLabel } from "./Mood.jsx";

const PAGE = 20;

function monthLabel(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function HistoryCard({ entry, onDelete, onOpen }) {
  const date = new Date(entry.startedAt).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const breathing = entry.type === "breathing";
  const title = breathing ? "Breathing" : "Meditation";

  return (
    <div className="card histcard">
      <button
        type="button"
        className="histcard-main"
        onClick={() => onOpen(entry.id)}
        aria-label={`Open ${title.toLowerCase()} session from ${date}`}
      >
        <div className="histcard-title">
          <span aria-hidden="true">{breathing ? "🌬️" : "🧘"}</span> {title}
          {!entry.complete && <span className="badge incomplete">incomplete</span>}
        </div>
        {breathing && !isRetention(entry) ? (
          <div className="histcard-sub">
            {date} · {patternById(entry.pattern).label} · {formatElapsed(entry.activeSeconds || 0)}
          </div>
        ) : breathing ? (
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
        {entry.mood && (
          <div className="histcard-mood">
            Felt {moodLabel(entry.mood).toLowerCase()}
            {entry.note ? ` · ${entry.note}` : ""}
          </div>
        )}
      </button>
      <IconButton label={`Delete ${title.toLowerCase()} session from ${date}`} onClick={() => onDelete(entry.id)}>
        ✕
      </IconButton>
    </div>
  );
}

function Progress({ history, today }) {
  const trend = useMemo(() => holdTrend(history), [history]);
  const weeks = useMemo(() => weeklyMinutes(history), [history, today]);
  const trendMood = averageMood(history.filter((h) => trend.some((p) => p.id === h.id)));
  if (!trend.length && !weeks.some((w) => w.minutes > 0)) return null;
  return (
    <>
      <h2>Progress</h2>
      <div className="card">
        {trend.length > 0 && (
          <>
            <h3>Best hold per session</h3>
            {trendMood != null && (
              <p className="hint small trendmood">Average mood {trendMood.toFixed(1)} of 5 across these sessions</p>
            )}
            <HoldTrend points={trend} />
          </>
        )}
        <h3>Minutes per week</h3>
        <WeekBars weeks={weeks} />
      </div>
    </>
  );
}

export default function Home({
  store,
  stats,
  today,
  week,
  hiddenId,
  onDelete,
  onOpen,
  onSettings,
  onNewBreathing,
  onNewMeditation,
  onRestore,
  onSafety,
}) {
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
      <div className="hometop">
        <h1 className="apptitle">
          Bre<span>athe</span>
        </h1>
        <IconButton label="Settings" onClick={onSettings}>
          ⚙
        </IconButton>
      </div>

      <div className="statsgrid">
        <div className="stattile">
          <div className="val">{stats.breathingThisWeek}</div>
          <div className="lbl">Breathing sessions this week</div>
        </div>
        <div className="stattile">
          <div className="val">{stats.minutesThisWeek}</div>
          <div className="lbl">Minutes this week</div>
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

      {week.goal > 0 && (
        <div className="card goalcard">
          <GoalRing done={week.done} goal={week.goal} />
          <div>
            <div className="goaltitle">{week.left > 0 ? `${week.left} to go this week` : "Weekly goal met"}</div>
            <div className="goalsub">
              {week.done} of {week.goal} {week.goal === 1 ? "session" : "sessions"} since Monday
            </div>
          </div>
        </div>
      )}

      <button type="button" className="modebtn" onClick={onNewBreathing}>
        <span className="emoji" aria-hidden="true">
          🌬️
        </span>
        <span>
          <span className="modetitle">Breathing</span>
          <span className="modesub">Wim Hof rounds, box, 4-7-8, sigh or coherent pacing</span>
        </span>
      </button>
      <button type="button" className="modebtn" onClick={onNewMeditation}>
        <span className="emoji" aria-hidden="true">
          🧘
        </span>
        <span>
          <span className="modetitle">Meditation</span>
          <span className="modesub">Timed sit with optional interval bell</span>
        </span>
      </button>

      <Progress history={store.history} today={today} />

      {history.length > 0 && <h2>History</h2>}
      {groups.map((g) => (
        <section key={g.label} aria-label={g.label}>
          <div className="monthlabel">{g.label}</div>
          {g.items.map((h) => (
            <HistoryCard key={h.id} entry={h} onDelete={onDelete} onOpen={onOpen} />
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
