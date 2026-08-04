import { formatMMSS } from "./ui.jsx";

export default function BreathingEnd({ entry, onDone }) {
  const rounds = entry.rounds || [];
  const times = rounds.map((r) => r.retentionSeconds);
  const best = times.length ? Math.max(...times) : 0;
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;

  return (
    <div className="page">
      <div className="topbar">
        <span />
        <div>
          <div className="tb-title">Session complete</div>
          <div className="tb-sub">
            {entry.complete ? `${rounds.length} round${rounds.length === 1 ? "" : "s"}` : `Ended early · ${rounds.length}/${entry.plannedRounds} rounds`}
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
                    <td className="time">{formatMMSS(r.retentionSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="summaryrow">
            <div className="stattile">
              <div className="val">{formatMMSS(best)}</div>
              <div className="lbl">Best</div>
            </div>
            <div className="stattile">
              <div className="val">{formatMMSS(avg)}</div>
              <div className="lbl">Average</div>
            </div>
          </div>
        </>
      ) : (
        <p className="hint">No rounds were completed this session.</p>
      )}

      <button className="bigbtn start" onClick={onDone}>
        Done
      </button>
    </div>
  );
}
