import { useMemo } from "react";
import { WEEKDAYS, CAT_COLORS, plannedSession } from "../system/constants.js";
import { SCHEDULE_V2 } from "../system/schedule.js";
import { isScheduled, isPlanned } from "../system/streak.js";
import { getWorkoutLogSync } from "../data/logs.js";
import { appsWithLastUsed, relativeTime } from "../data/launcher.js";
import { isNative } from "../data/platform.js";
import { DQ } from "./shared.jsx";
import Timeline from "./Timeline.jsx";

const QUEST_TIME = {
  hf_creatine: [b => /wake|breakfast/i.test(b.label), 6],
  hf_breath:   [null, 7],
  hf_gym:      [b => b.type.startsWith("gym_"), 13],
  hf_despina:  [b => b.type === "sacred", 19.5],
  hf_phone:    [b => /phone/i.test(b.label), 21],
  hf_vmo:      [b => b.type === "mobility", 21.75],
  hf_mobility: [b => b.type === "mobility", 21.75],
  hf_lights:   [b => b.type === "sleep", 22],
  d8:  [null, 12], d9: [null, 12], d10: [null, 12], d11: [null, 8], d12: [null, 15],
  d13: [b => b.type === "joker", 16], d14: [null, 17.5], d15: [null, 12], d16: [b => b.type === "joker", 16],
  d17: [null, 10], d18: [b => b.type === "joker", 16], d19: [null, 21.5],
  d20: [b => b.type === "joker", 16], d21: [b => b.type === "joker", 16], d22: [b => b.type === "joker", 16],
};

function blockHour(b) {
  const m = /(\d{1,2}):(\d{2})/.exec(b.time);
  if (m) return +m[1] + +m[2] / 60;
  const t = b.time.toLowerCase();
  if (t.includes("morning")) return 8;
  if (t.includes("evening")) return 19;
  if (t.includes("after")) return 14;
  return 12;
}

function questHour(q, blocks) {
  const [test, fallback] = QUEST_TIME[q.id] || [null, 12];
  const b = test ? blocks.find(test) : null;
  return b ? blockHour(b) : fallback;
}

const bucketOf = (h) => (h < 11 ? "Morning" : h < 18 ? "Day" : "Evening");

export function daysUntil(due, today) {
  const [y, m, d] = due.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d, 12) - new Date(ty, tm - 1, td, 12)) / 86400000);
}

export function dueLabel(n) {
  if (n < 0) return `${-n} day${n === -1 ? "" : "s"} overdue`;
  if (n === 0) return "due today";
  if (n === 1) return "due tomorrow";
  return `${n} days left`;
}

export default function Today({ data, today, toggleDaily, onQuestMenu, nav, macros, targets, pplOffset }) {
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  const weekday = WEEKDAYS[(date.getDay() + 6) % 7];
  const day = SCHEDULE_V2[weekday];
  const planned = plannedSession(date, pplOffset);
  const log = getWorkoutLogSync(today);

  const groups = useMemo(() => {
    const out = { Morning: [], Day: [], Evening: [] };
    for (const q of data.dailyQ) {
      if (q.auto || !isPlanned(q, today)) continue;
      const h = questHour(q, day.blocks);
      out[bucketOf(h)].push({ q, h });
    }
    for (const k of Object.keys(out)) out[k].sort((a, b) => a.h - b.h);
    return out;
  }, [data.dailyQ, today, day]);

  const dueSoon = data.longQ
    .filter(q => q.due && q.status !== "Completed")
    .map(q => ({ q, n: daysUntil(q.due, today) }))
    .filter(x => x.n <= 14)
    .sort((a, b) => a.n - b.n);

  const t = macros.totals;
  const kcalLeft = Math.round(targets.kcal - (t.kcal || 0));
  const proteinLeft = Math.round(targets.protein - (t.protein || 0));
  const manual = data.dailyQ.filter(q => !q.auto && isScheduled(q, today));
  const doneCount = manual.filter(q => q.lastDone === today).length;
  const autoQ = data.dailyQ.filter(q => q.auto && isScheduled(q, today));

  return (
    <>
      <div className="pg-head">
        <div className="pg-title">Today</div>
        <button type="button" className="bs pg-head-btn" onClick={() => nav({ page: "stats" })}>Stats</button>
      </div>
      <div className="pg-sub">{weekday} · {day.type} · {doneCount}/{manual.length} quests done</div>

      {dueSoon.length > 0 && (
        <>
          <div className="sec-h">Due soon</div>
          <div className="due-strip">
            {dueSoon.map(({ q, n }) => (
              <button type="button" key={q.id} className={"due-chip" + (n < 0 ? " over" : "")} onClick={() => nav({ page: "quests" })}>
                {q.title}<b>{dueLabel(n)}</b>
              </button>
            ))}
          </div>
        </>
      )}

      <Timeline key={today} blocks={day.blocks} />

      <div className="card">
        <div className="card-t">Session</div>
        <div style={{ fontSize: 14, marginBottom: 12 }}>
          {planned === "REST"
            ? <>Rest day. VMO and bedtime mobility still count.</>
            : <><b style={{ color: "var(--gold)" }}>{planned}</b> @ Titan Park</>}
        </div>
        {log ? (
          <div className={"callout " + (log.missed ? "cr" : "cgr")} style={{ marginBottom: 0 }}>
            <div className="ct">
              {log.missed ? "Missed session logged. PPL slid forward." : `${log.session} logged${log.minimum ? " (show-up minimum)" : ""}. ${log.exercises?.length || 0} lifts.`}
            </div>
          </div>
        ) : (
          <div className="btnrow">
            <button className="bp green" onClick={() => nav({ page: "train" })}>Log session</button>
            <button className="bs" onClick={() => nav({ page: "train", mode: "minimum" })}>Show-up minimum</button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-t">Fuel remaining</div>
        <div className="mrem">
          <div className="mrem-i">
            <div className="mrem-v" style={{ color: kcalLeft < 0 ? "var(--red-t)" : "var(--tx)" }}>{Math.abs(kcalLeft).toLocaleString()}</div>
            <div className="mrem-l">kcal {kcalLeft < 0 ? "over" : "left"} of {targets.kcal.toLocaleString()}</div>
          </div>
          <div className="mrem-i">
            <div className="mrem-v" style={{ color: proteinLeft <= 0 ? "var(--green-t)" : "var(--tx)" }}>{Math.max(0, proteinLeft)}g</div>
            <div className="mrem-l">protein left of {targets.protein}g</div>
          </div>
        </div>
        <div className="src-line">
          <span>{macros.source === "calories" ? "From Calories" : macros.source === "la" ? "From this app's log" : "Nothing logged yet"}</span>
          <button className="bs" style={{ minHeight: 44 }} onClick={() => nav({ page: "fuel" })}>Open Fuel</button>
        </div>
        {autoQ.length > 0 && (
          <div className="qhint" style={{ marginTop: 8 }}>
            Auto: {autoQ.map(q => `${q.title} ${q.lastDone === today ? "✓" : "·"}`).join("  ·  ")}
          </div>
        )}
      </div>

      {["Morning", "Day", "Evening"].map(k => groups[k].length > 0 && (
        <section key={k}>
          <div className="sec-h">{k}</div>
          {groups[k].map(({ q }) => (
            <DQ key={q.id} q={q} today={today} onToggle={toggleDaily} onMenu={onQuestMenu} ac={(CAT_COLORS[q.category] || CAT_COLORS["Health & Fitness"]).accent} />
          ))}
        </section>
      ))}

      <Launcher />
    </>
  );
}

function Launcher() {
  const apps = useMemo(() => (isNative() ? [] : appsWithLastUsed()), []);
  if (!apps.length) return null;
  return (
    <section>
      <div className="sec-h">Apps</div>
      <div className="apps">
        {apps.map(a => (
          <a key={a.id} className="app-tile" href={`./${a.id}/`}>
            <span className="app-g" aria-hidden="true">{a.glyph}</span>
            <span className="app-n">{a.name}</span>
            {a.lastUsed && <span className="app-u">last used {relativeTime(a.lastUsed)}</span>}
          </a>
        ))}
      </div>
    </section>
  );
}
