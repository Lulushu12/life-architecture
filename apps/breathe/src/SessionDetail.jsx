import { IconButton } from "@shared/ui.jsx";
import { RetentionBars } from "./Charts.jsx";
import MoodPicker from "./Mood.jsx";
import { formatElapsed, plural } from "./format.js";
import { isRetention, patternById } from "./patterns.js";
import { bestOf, secondsOf } from "./stats.js";

export default function SessionDetail({ entry, onBack, onUpdate, onDelete }) {
  const when = new Date(entry.startedAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const breathing = entry.type === "breathing";
  const whm = breathing && isRetention(entry);
  const title = !breathing ? "Meditation" : patternById(entry.pattern).label;
  const seconds = secondsOf(entry);
  const times = whm ? entry.rounds.map((r) => r.retentionSeconds) : [];
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;

  let sub;
  if (whm) sub = `${entry.rounds.length}/${plural(entry.plannedRounds, "round")}`;
  else if (breathing) sub = plural(entry.cycles, "cycle");
  else sub = `${formatElapsed(entry.actualSeconds || 0)} of ${formatElapsed(entry.targetSeconds)}`;

  return (
    <div className="page">
      <div className="topbar">
        <IconButton label="Back" onClick={onBack}>
          ←
        </IconButton>
        <div>
          <div className="tb-title">{title}</div>
          <div className="tb-sub">
            {when} · {sub}
            {!entry.complete && " · incomplete"}
          </div>
        </div>
      </div>

      <div className={"summaryrow" + (whm ? " three" : "")}>
        <div className="stattile">
          <div className="val">{formatElapsed(seconds)}</div>
          <div className="lbl">{breathing ? "Time breathing" : "Time sat"}</div>
        </div>
        {whm && (
          <>
            <div className="stattile">
              <div className="val">{formatElapsed(bestOf(entry))}</div>
              <div className="lbl">Best hold</div>
            </div>
            <div className="stattile">
              <div className="val">{formatElapsed(avg)}</div>
              <div className="lbl">Average hold</div>
            </div>
          </>
        )}
        {!breathing && (
          <div className="stattile">
            <div className="val">{entry.bells || 0}</div>
            <div className="lbl">{entry.bells === 1 ? "Bell" : "Bells"}</div>
          </div>
        )}
      </div>

      {whm && entry.rounds.length > 0 && (
        <div className="card">
          <h3>Retention per round</h3>
          <RetentionBars rounds={entry.rounds} />
        </div>
      )}

      <MoodPicker entry={entry} onUpdate={onUpdate} />

      <button type="button" className="bigbtn ghost gap" onClick={onDelete}>
        Delete session
      </button>
    </div>
  );
}
