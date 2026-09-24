import { formatElapsed, plural } from "./format.js";
import { isRetention, patternById } from "./patterns.js";
import MoodPicker from "./Mood.jsx";

export default function BreathingEnd({ entry, onDone, onOneMore, onUpdate }) {
  if (!isRetention(entry)) return <PacedEnd entry={entry} onDone={onDone} onUpdate={onUpdate} />;
  const rounds = entry.rounds;
  const times = rounds.map((r) => r.retentionSeconds);
  const best = times.length ? Math.max(...times) : 0;
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="tb-title">{entry.complete ? "Session complete" : "Session ended"}</div>
          <div className="tb-sub">
            {entry.complete
              ? plural(rounds.length, "round")
              : `Ended early · ${rounds.length}/${entry.plannedRounds} rounds`}
          </div>
        </div>
      </div>

      {rounds.length > 0 ? (
        <>
          <div className="tablewrap">
            <table className="scoretable">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Retention</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="time">{formatElapsed(r.retentionSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="summaryrow">
            <div className="stattile">
              <div className="val">{formatElapsed(best)}</div>
              <div className="lbl">Best hold</div>
            </div>
            <div className="stattile">
              <div className="val">{formatElapsed(avg)}</div>
              <div className="lbl">Average hold</div>
            </div>
          </div>
        </>
      ) : (
        <p className="hint">No rounds were completed this session.</p>
      )}

      <MoodPicker entry={entry} onUpdate={onUpdate} />

      <button type="button" className="bigbtn start" onClick={onDone}>
        Done
      </button>
      <button type="button" className="bigbtn secondary gap" onClick={onOneMore}>
        One more round
      </button>
    </div>
  );
}

function PacedEnd({ entry, onDone, onUpdate }) {
  const pattern = patternById(entry.pattern);
  const seconds = entry.activeSeconds || 0;
  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="tb-title">{entry.complete ? "Session complete" : "Session ended"}</div>
          <div className="tb-sub">{pattern.label}</div>
        </div>
      </div>

      <div className="summaryrow">
        <div className="stattile">
          <div className="val">{formatElapsed(seconds)}</div>
          <div className="lbl">Time breathing</div>
        </div>
        <div className="stattile">
          <div className="val">{entry.cycles}</div>
          <div className="lbl">{entry.cycles === 1 ? "Cycle planned" : "Cycles planned"}</div>
        </div>
      </div>

      <p className="hint">Notice how you feel before you move on.</p>

      <MoodPicker entry={entry} onUpdate={onUpdate} />

      <button type="button" className="bigbtn start" onClick={onDone}>
        Done
      </button>
    </div>
  );
}
