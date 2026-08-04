export function NumberGrid({ max, disabled = [], onPick }) {
  const nums = Array.from({ length: max + 1 }, (_, i) => i);
  return (
    <div className="numgrid">
      {nums.map((i) => (
        <button
          key={i}
          className={"numbtn" + (disabled.includes(i) ? " off" : "")}
          disabled={disabled.includes(i)}
          onClick={() => onPick(i)}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

export function NumInput({ value, onChange, min = -999, max = 999, step = 1 }) {
  const clamp = (v) => Math.max(min, Math.min(max, v));
  return (
    <div className="stepper">
      <button onClick={() => onChange(clamp(value - step))}>−</button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!Number.isNaN(v)) onChange(clamp(v));
        }}
      />
      <button onClick={() => onChange(clamp(value + step))}>+</button>
    </div>
  );
}

export function Toggle({ checked, onChange }) {
  return (
    <button className={"toggle" + (checked ? " on" : "")} onClick={() => onChange(!checked)}>
      <span className="knob" />
    </button>
  );
}

export function SettingRow({ label, children }) {
  return (
    <div className="setrow">
      <span className="setlabel">{label}</span>
      {children}
    </div>
  );
}

export function PlayersEditor({ players, setPlayers, onCountChange }) {
  return (
    <div className="field">
      <div className="flabel">Players</div>
      <div className="chips">
        {[3, 4, 5, 6].map((k) => (
          <button
            key={k}
            className={"chip" + (players.length === k ? " sel" : "")}
            onClick={() => onCountChange(k)}
          >
            {k}
          </button>
        ))}
      </div>
      {players.map((p, i) => (
        <input
          key={i}
          className="input"
          placeholder={`Player ${i + 1}`}
          value={p}
          onChange={(e) =>
            setPlayers((ps) => ps.map((x, j) => (j === i ? e.target.value : x)))
          }
        />
      ))}
    </div>
  );
}

export function Standings({ players, totals }) {
  const rank = players
    .map((p, i) => ({ p, t: totals[i] }))
    .sort((a, b) => b.t - a.t);
  return (
    <div className="card standings">
      <h3>Final standings</h3>
      {rank.map((r, i) => (
        <div key={i} className={"standrow r" + i}>
          <span className="place">{i + 1}</span>
          <span className="pname">{r.p}</span>
          <span className="ptotal">{r.t}</span>
        </div>
      ))}
    </div>
  );
}
