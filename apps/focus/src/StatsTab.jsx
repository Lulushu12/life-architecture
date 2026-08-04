import { dayKey, last7DayKeys } from "./storage.js";

function fmtMin(mins) {
  const total = Math.round(mins);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function dayLabel(key, now) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (key === dayKey(now)) return "Today";
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

export default function StatsTab({ store, now }) {
  const todayKey = dayKey(now);
  const today = store.logs.days[todayKey] || { pomodoroCount: 0, pomodoroMinutes: 0, tasks: {} };

  const taskMinutes = { ...today.tasks };
  if (store.tasks.run) {
    const id = store.tasks.run.taskId;
    taskMinutes[id] = (taskMinutes[id] || 0) + (now - store.tasks.run.startedAt) / 60000;
  }
  const totalTaskMinutes = Object.values(taskMinutes).reduce((a, b) => a + b, 0);
  const totalFocusMinutes = today.pomodoroMinutes + totalTaskMinutes;

  const taskRows = Object.entries(taskMinutes)
    .filter(([, mins]) => mins > 0.01)
    .map(([id, mins]) => ({ id, name: store.tasks.items[id]?.name || "(deleted task)", mins }))
    .sort((a, b) => b.mins - a.mins);

  const week = last7DayKeys(now).map((key) => {
    const day = store.logs.days[key];
    let mins = day ? day.pomodoroMinutes + Object.values(day.tasks).reduce((a, b) => a + b, 0) : 0;
    if (key === todayKey) mins = totalFocusMinutes;
    return { key, mins };
  });
  const maxMins = Math.max(1, ...week.map((d) => d.mins));

  return (
    <div>
      <h2>Today</h2>
      <div className="card">
        <div className="statgrid">
          <div className="statbox">
            <div className="statval">{today.pomodoroCount}</div>
            <div className="statlabel">pomodoros</div>
          </div>
          <div className="statbox">
            <div className="statval">{fmtMin(totalFocusMinutes)}</div>
            <div className="statlabel">focus time</div>
          </div>
        </div>
      </div>

      <h2>Per task today</h2>
      <div className="card">
        {taskRows.length === 0 && <div className="hint small">No task time logged today yet.</div>}
        {taskRows.map((t) => (
          <div className="taskbreak-row" key={t.id}>
            <span className="taskbreak-name">{t.name}</span>
            <span className="taskbreak-val">{fmtMin(t.mins)}</span>
          </div>
        ))}
      </div>

      <h2>Last 7 days</h2>
      <div className="card">
        {week.map((d) => (
          <div className="statbar-row" key={d.key}>
            <span className="statbar-label">{dayLabel(d.key, now)}</span>
            <div className="statbar-track">
              <div className="statbar-fill" style={{ width: `${(d.mins / maxMins) * 100}%` }} />
            </div>
            <span className="statbar-val">{fmtMin(d.mins)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
