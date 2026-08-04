export function NumInput({ value, onChange, min = 1, max = 999, step = 1 }) {
  const clamp = (v) => Math.max(min, Math.min(max, v));
  return (
    <div className="stepper">
      <button onClick={() => onChange(clamp(round1(value - step)))}>−</button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) onChange(clamp(v));
        }}
      />
      <button onClick={() => onChange(clamp(round1(value + step)))}>+</button>
    </div>
  );
}

function round1(v) {
  return Math.round(v * 10) / 10;
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

export function ProgressRing({ pct, children }) {
  const deg = Math.max(0, Math.min(1, pct)) * 360;
  return (
    <div
      className="pomo-ring"
      style={{ background: `conic-gradient(var(--accent) ${deg}deg, var(--surface2) ${deg}deg)` }}
    >
      <div className="pomo-ring-inner">{children}</div>
    </div>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={"tabbtn" + (active === t.id ? " sel" : "")}
          onClick={() => onChange(t.id)}
        >
          <span className="tabicon">{t.icon}</span>
          <span className="tablabel">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
