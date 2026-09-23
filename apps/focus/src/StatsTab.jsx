import { addDays } from "@shared/store.js";
import { dayFocusMinutes, goalStreaks, lastNDayKeys } from "./logic.js";
import { fmtMin } from "./ui.jsx";

const HEAT_WEEKS = 12;

function dayLabel(key, today) {
  if (key === today) return "Today";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString(undefined, { weekday: "short" });
}

function heatLevel(mins) {
  if (mins <= 0) return 0;
  if (mins < 25) return 1;
  if (mins < 60) return 2;
  if (mins < 120) return 3;
  return 4;
}

function weekdayIndex(key) {
  const [y, m, d] = key.split("-").map(Number);
  return (new Date(y, m - 1, d, 12).getDay() + 6) % 7;
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

const KIND_LABEL = { work: "Focus", short: "Short break", long: "Long break", task: "Task" };

export default function StatsTab({ store, now, today }) {
  const days = store.logs.days;
  const liveTask = store.tasks.run;
  const liveMins = liveTask ? Math.max(0, now - liveTask.startedAt) / 60000 : 0;
  const focusOn = (key) => dayFocusMinutes(days[key]) + (key === today ? liveMins : 0);

  const todayDay = days[today] || { pomodoroCount: 0, tasks: {}, pomoTasks: {} };
  const perTask = {};
  for (const [id, m] of Object.entries(todayDay.tasks || {})) perTask[id] = (perTask[id] || 0) + m;
  for (const [id, m] of Object.entries(todayDay.pomoTasks || {})) perTask[id] = (perTask[id] || 0) + m;
  if (liveTask) perTask[liveTask.taskId] = (perTask[liveTask.taskId] || 0) + liveMins;
  const taskRows = Object.entries(perTask)
    .filter(([, mins]) => mins > 0.01)
    .map(([id, mins]) => ({ id, name: store.tasks.items[id]?.name || "(deleted task)", mins }))
    .sort((a, b) => b.mins - a.mins);

  const goal = store.settings.dailyGoal;
  const streak = goalStreaks(days, goal, today);

  const week = lastNDayKeys(today, 7).map((key) => ({ key, mins: focusOn(key) }));
  const maxMins = Math.max(1, ...week.map((d) => d.mins));

  const heatStart = addDays(addDays(today, -weekdayIndex(today)), -(HEAT_WEEKS - 1) * 7);
  const heat = [];
  for (let i = 0; i < HEAT_WEEKS * 7; i++) {
    const key = addDays(heatStart, i);
    heat.push({ key, future: key > today, mins: key > today ? 0 : focusOn(key) });
  }
  const heatTotal = heat.reduce((a, c) => a + c.mins, 0);

  const [ty, tm, td] = today.split("-").map(Number);
  const dayStart = new Date(ty, tm - 1, td).getTime();
  const todaySessions = store.logs.sessions
    .filter((s) => s.end >= dayStart)
    .slice(-10)
    .reverse();
  const interrupted = store.logs.sessions.filter(
    (s) => s.kind === "work" && !s.completed && s.end >= dayStart
  ).length;

  return (
    <div>
      <h2>Today</h2>
      <div className="card">
        <div className="statgrid">
          <div className="statbox">
            <div className="statval">{todayDay.pomodoroCount}</div>
            <div className="statlabel">pomodoros</div>
          </div>
          <div className="statbox">
            <div className="statval">{fmtMin(focusOn(today))}</div>
            <div className="statlabel">focus time</div>
          </div>
          <div className="statbox">
            <div className="statval">{streak.current}</div>
            <div className="statlabel">goal streak</div>
          </div>
        </div>
        <p className="hint small statnote">
          Goal {goal} a day · best streak {streak.best}
          {interrupted > 0 ? ` · ${interrupted} interrupted today` : ""}
        </p>
      </div>

      <h2>Per task today</h2>
      <div className="card">
        {taskRows.length === 0 && <p className="hint small">No task time logged today yet.</p>}
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
            <span className="statbar-label">{dayLabel(d.key, today)}</span>
            <div className="statbar-track">
              <div className="statbar-fill" style={{ width: `${(d.mins / maxMins) * 100}%` }} />
            </div>
            <span className="statbar-val">{fmtMin(d.mins)}</span>
          </div>
        ))}
      </div>

      <h2>12 weeks</h2>
      <div className="card">
        <div className="heatmap" role="img" aria-label={`Focus minutes over the last 12 weeks, ${fmtMin(heatTotal)} in total`}>
          {heat.map((c) => (
            <div
              key={c.key}
              className={"heatcell" + (c.future ? " future" : ` l${heatLevel(c.mins)}`) + (c.key === today ? " today" : "")}
              title={c.future ? undefined : `${c.key}: ${fmtMin(c.mins)}`}
            />
          ))}
        </div>
        <div className="heatlegend">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className={`heatcell l${l}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <h2>Sessions today</h2>
      <div className="card">
        {todaySessions.length === 0 && <p className="hint small">No sessions logged today yet.</p>}
        {todaySessions.map((s) => (
          <div className="taskbreak-row" key={s.id}>
            <span className="taskbreak-name">
              {fmtTime(s.start)} {KIND_LABEL[s.kind] || s.kind}
              {s.taskId && store.tasks.items[s.taskId] ? `: ${store.tasks.items[s.taskId].name}` : ""}
              {s.completed ? "" : " (stopped early)"}
            </span>
            <span className="taskbreak-val">{fmtMin((s.end - s.start) / 60000)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
