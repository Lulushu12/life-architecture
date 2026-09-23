import { formatElapsed, plural } from "./format.js";

export default function MeditationEnd({ entry, streak, onDone }) {
  const seconds = entry.actualSeconds || 0;
  const minutes = Math.floor(seconds / 60);

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="tb-title">{entry.complete ? "Meditation complete" : "Meditation ended"}</div>
          <div className="tb-sub">
            {entry.complete
              ? `${Math.round(entry.targetSeconds / 60)} min sit`
              : `Ended early · ${formatElapsed(seconds)} of ${formatElapsed(entry.targetSeconds)}`}
          </div>
        </div>
      </div>

      <div className="summaryrow three">
        <div className="stattile">
          <div className="val">{minutes}</div>
          <div className="lbl">{minutes === 1 ? "Minute sat" : "Minutes sat"}</div>
        </div>
        <div className="stattile">
          <div className="val">{entry.bells || 0}</div>
          <div className="lbl">{entry.bells === 1 ? "Bell" : "Bells"}</div>
        </div>
        <div className="stattile">
          <div className="val">{streak}</div>
          <div className="lbl">Day streak</div>
        </div>
      </div>

      <p className="hint">
        {entry.complete
          ? "Take a few breaths before you get up."
          : `You sat for ${seconds < 60 ? plural(seconds, "second") : plural(minutes, "minute")}. Every sit counts.`}
      </p>

      <button type="button" className="bigbtn start" onClick={onDone}>
        Done
      </button>
    </div>
  );
}
