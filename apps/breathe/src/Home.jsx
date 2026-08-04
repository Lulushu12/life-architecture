import { formatMMSS } from "./ui.jsx";

function isCounted(entry) {
  if (entry.type === "breathing") return entry.rounds && entry.rounds.length > 0;
  if (entry.type === "meditation") return typeof entry.actualSeconds === "number" && entry.actualSeconds > 0;
  return false;
}

function dateKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfWeek(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return d.getTime();
}

function computeStats(history) {
  const counted = history.filter(isCounted);

  const weekStart = startOfWeek(Date.now());
  const sessionsThisWeek = counted.filter((h) => h.startedAt >= weekStart).length;

  const dayset = new Set(counted.map((h) => dateKey(h.startedAt)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!dayset.has(dateKey(cursor.getTime()))) {
    // today has no session yet — streak can still continue from yesterday
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dayset.has(dateKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  let bestRetention = 0;
  for (const h of history) {
    if (h.type !== "breathing") continue;
    for (const r of h.rounds || []) bestRetention = Math.max(bestRetention, r.retentionSeconds);
  }

  return { sessionsThisWeek, streak, bestRetention };
}

function HistoryCard({ entry, onDelete }) {
  const date = new Date(entry.startedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const incomplete = !entry.complete;

  return (
    <div className="card histcard">
      <div className="histcard-main">
        <div className="histcard-title">
          {entry.type === "breathing" ? "🌬️ Breathing" : "🧘 Meditation"}
          {incomplete && <span className="badge incomplete">incomplete</span>}
        </div>
        {entry.type === "breathing" ? (
          <>
            <div className="histcard-sub">
              {date} · {entry.rounds.length}/{entry.plannedRounds} round
              {entry.plannedRounds === 1 ? "" : "s"}
            </div>
            {entry.rounds.length > 0 && (
              <div className="histcard-rounds">
                {entry.rounds.map((r) => formatMMSS(r.retentionSeconds)).join("  ·  ")}
              </div>
            )}
          </>
        ) : (
          <div className="histcard-sub">
            {date} · {entry.actualSeconds != null ? formatMMSS(entry.actualSeconds) : "0:00"} of{" "}
            {formatMMSS(entry.targetSeconds)}
          </div>
        )}
      </div>
      <button
        className="iconbtn"
        onClick={() => {
          if (confirm("Delete this session?")) onDelete(entry.id);
        }}
      >
        ✕
      </button>
    </div>
  );
}

export default function Home({ store, onDelete, onNewBreathing, onNewMeditation }) {
  const history = [...store.history].sort((a, b) => b.startedAt - a.startedAt);
  const stats = computeStats(store.history);

  return (
    <div className="page">
      <h1 className="apptitle">
        Bre<span>athe</span>
      </h1>

      <div className="statsrow">
        <div className="stattile">
          <div className="val">{stats.sessionsThisWeek}</div>
          <div className="lbl">This week</div>
        </div>
        <div className="stattile">
          <div className="val">{stats.streak}</div>
          <div className="lbl">Day streak</div>
        </div>
        <div className="stattile">
          <div className="val">{formatMMSS(stats.bestRetention)}</div>
          <div className="lbl">Best hold</div>
        </div>
      </div>

      <button className="modebtn" onClick={onNewBreathing}>
        <span className="emoji">🌬️</span>
        <span>
          <div className="modetitle">Breathing</div>
          <div className="modesub">Wim Hof style rounds with retention holds</div>
        </span>
      </button>
      <button className="modebtn" onClick={onNewMeditation}>
        <span className="emoji">🧘</span>
        <span>
          <div className="modetitle">Meditation</div>
          <div className="modesub">Timed sit with optional interval bell</div>
        </span>
      </button>

      {history.length > 0 && <h2>History</h2>}
      {history.map((h) => (
        <HistoryCard key={h.id} entry={h} onDelete={onDelete} />
      ))}
      {history.length === 0 && (
        <p className="hint">No sessions yet. Start a breathing round or a timed meditation above.</p>
      )}
    </div>
  );
}
