import { useState } from "react";
import { addDays, dayKey } from "@shared/store.js";
import {
  INSIGHT_DAYS,
  dayFocusMinutes,
  dayStartMs,
  goalStreaks,
  hourHistogram,
  interruptionsByDay,
  lastNDayKeys,
  recentDistractionNotes,
  taskTotals,
  weekComparison,
  weekdayIndex,
  workOutcomes,
} from "./logic.js";
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

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function fmtWhen(ts, today) {
  const key = dayKey(new Date(ts));
  if (key === today) return fmtTime(ts);
  if (key > addDays(today, -7)) return `${dayLabel(key, today)} ${fmtTime(ts)}`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtHour(h) {
  return new Date(2000, 0, 1, h).toLocaleTimeString(undefined, { hour: "numeric" });
}

function fmtDelta(mins) {
  const sign = mins > 0.5 ? "+" : mins < -0.5 ? "-" : "±";
  return `${sign}${fmtMin(Math.abs(mins))}`;
}

const KIND_LABEL = { work: "Focus", short: "Short break", long: "Long break", task: "Task" };

export default function StatsTab({ store, now, today }) {
  const [taskRange, setTaskRange] = useState("today");
  const days = store.logs.days;
  const liveTask = store.tasks.run;
  const liveMins = liveTask ? Math.max(0, now - liveTask.startedAt) / 60000 : 0;
  const focusOn = (key) => dayFocusMinutes(days[key]) + (key === today ? liveMins : 0);

  const todayDay = days[today] || { pomodoroCount: 0, tasks: {}, pomoTasks: {} };
  const perTask = taskTotals(days, taskRange === "today" ? [today] : lastNDayKeys(today, 7));
  if (liveTask) perTask[liveTask.taskId] = (perTask[liveTask.taskId] || 0) + liveMins;
  const taskRows = Object.entries(perTask)
    .filter(([, mins]) => mins > 0.01)
    .map(([id, mins]) => ({ id, name: store.tasks.items[id]?.name || "(deleted task)", mins }))
    .sort((a, b) => b.mins - a.mins);
  const taskMax = Math.max(1, ...taskRows.map((t) => t.mins));

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

  const dayStart = dayStartMs(today);
  const cmp = weekComparison(focusOn, today);
  const insightSince = dayStartMs(addDays(today, -(INSIGHT_DAYS - 1)));
  const hours = hourHistogram(store.logs.sessions, insightSince);
  const hourMax = Math.max(...hours);
  const bestHour = hourMax > 0 ? hours.indexOf(hourMax) : -1;
  const outcomes = workOutcomes(store.logs.sessions, insightSince);
  const outcomeTotal = outcomes.completed + outcomes.interrupted;
  const weekKeys = lastNDayKeys(today, 7);
  const distractByDay = interruptionsByDay(store, weekKeys);
  const distractMax = Math.max(1, ...Object.values(distractByDay));
  const distractTotal = Object.values(distractByDay).reduce((a, b) => a + b, 0);
  const notes = recentDistractionNotes(store, 10);
  const completedPct = outcomeTotal ? Math.round((outcomes.completed / outcomeTotal) * 100) : 0;
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

      <h2>This week</h2>
      <div className="card">
        <div className="statgrid">
          <div className="statbox">
            <div className="statval">{fmtMin(cmp.thisWeek)}</div>
            <div className="statlabel">this week</div>
          </div>
          <div className="statbox">
            <div className={"statval delta" + (cmp.delta > 0.5 ? " up" : cmp.delta < -0.5 ? " down" : "")}>
              {fmtDelta(cmp.delta)}
            </div>
            <div className="statlabel">vs last week</div>
          </div>
        </div>
        <p className="hint small statnote">
          Last week {fmtMin(cmp.lastToDate)} by this point · {fmtMin(cmp.lastWeek)} in total
        </p>
      </div>

      <div className="rowhead">
        <h2>Per task</h2>
        <div className="chips rangechips" role="group" aria-label="Range">
          {[
            ["today", "Today"],
            ["week", "7 days"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={"chip" + (taskRange === id ? " sel" : "")}
              aria-pressed={taskRange === id}
              onClick={() => setTaskRange(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        {taskRows.length === 0 && (
          <p className="hint small">{taskRange === "today" ? "No task time logged today yet." : "No task time in the last 7 days."}</p>
        )}
        {taskRows.map((t) => (
          <div className="statbar-row" key={t.id}>
            <span className="statbar-label wide">{t.name}</span>
            <div className="statbar-track">
              <div className="statbar-fill" style={{ width: `${(t.mins / taskMax) * 100}%` }} />
            </div>
            <span className="statbar-val">{fmtMin(t.mins)}</span>
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

      <h2>Best hours</h2>
      <div className="card">
        {bestHour < 0 ? (
          <p className="hint small">Finish a few focus sessions to see when you focus best.</p>
        ) : (
          <>
            <div className="hourhist" role="img" aria-label={`Focus by hour of day, best around ${fmtHour(bestHour)}`}>
              {hours.map((m, h) => (
                <div
                  key={h}
                  className={"hourbar" + (h === bestHour ? " best" : "")}
                  style={{ height: `${Math.max(m > 0 ? 4 : 0, (m / hourMax) * 100)}%` }}
                  title={`${fmtHour(h)}: ${fmtMin(m)}`}
                />
              ))}
            </div>
            <div className="hourlabels" aria-hidden="true">
              {[0, 6, 12, 18].map((h) => (
                <span key={h}>{fmtHour(h)}</span>
              ))}
            </div>
            <p className="hint small statnote">
              Best hour: {fmtHour(bestHour)} to {fmtHour((bestHour + 1) % 24)}, {fmtMin(hourMax)} over the last {INSIGHT_DAYS} days
            </p>
          </>
        )}
      </div>

      <h2>Completed vs interrupted</h2>
      <div className="card">
        {outcomeTotal === 0 ? (
          <p className="hint small">No focus sessions in the last {INSIGHT_DAYS} days.</p>
        ) : (
          <>
            <div className="splitbar" role="img" aria-label={`${completedPct}% of focus sessions completed`}>
              <div className="splitbar-ok" style={{ width: `${completedPct}%` }} />
            </div>
            <div className="splitlegend">
              <span>
                <i className="dot ok" /> {outcomes.completed} completed
              </span>
              <span>
                <i className="dot bad" /> {outcomes.interrupted} interrupted
              </span>
            </div>
            <p className="hint small statnote">
              {completedPct}% completed over the last {INSIGHT_DAYS} days
            </p>
          </>
        )}
      </div>

      <h2>Distractions</h2>
      <div className="card">
        {weekKeys.map((key) => (
          <div className="statbar-row" key={key}>
            <span className="statbar-label">{dayLabel(key, today)}</span>
            <div className="statbar-track">
              {distractByDay[key] > 0 && (
                <div className="statbar-fill bad" style={{ width: `${(distractByDay[key] / distractMax) * 100}%` }} />
              )}
            </div>
            <span className="statbar-val">{distractByDay[key]}</span>
          </div>
        ))}
        <p className="hint small statnote">
          {distractTotal === 0
            ? "Tap \"I got distracted\" during focus to track what breaks your flow."
            : `${distractTotal} in the last 7 days`}
        </p>
      </div>
      {notes.length > 0 && (
        <div className="card notes-list">
          <div className="flabel">Last notes</div>
          {notes.map((n) => (
            <div className="taskbreak-row" key={n.at}>
              <span className="taskbreak-name">{n.text}</span>
              <span className="note-when">{fmtWhen(n.at, today)}</span>
            </div>
          ))}
        </div>
      )}

      <h2>Sessions today</h2>
      <div className="card">
        {todaySessions.length === 0 && <p className="hint small">No sessions logged today yet.</p>}
        {todaySessions.map((s) => (
          <div className="taskbreak-row" key={s.id}>
            <span className="taskbreak-name">
              {fmtTime(s.start)} {KIND_LABEL[s.kind] || s.kind}
              {s.taskId && store.tasks.items[s.taskId] ? `: ${store.tasks.items[s.taskId].name}` : ""}
              {s.completed ? "" : " (stopped early)"}
              {s.interruptions ? ` · ${s.interruptions} distracted` : ""}
            </span>
            <span className="taskbreak-val">{fmtMin((s.end - s.start) / 60000)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
