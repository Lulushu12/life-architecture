export function NumInput({ value, onChange, min = 0, max = 99999, step = 1 }) {
  const clamp = (v) => Math.max(min, Math.min(max, v));
  return (
    <div className="stepper">
      <button onClick={() => onChange(clamp(round(value - step)))}>−</button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) onChange(clamp(v));
        }}
      />
      <button onClick={() => onChange(clamp(round(value + step)))}>+</button>
    </div>
  );
}

function round(v) {
  return Math.round(v * 100) / 100;
}

export function ProgressBar({ label, value, target, unit }) {
  if (!target || target <= 0) return null;
  const pct = Math.max(0, Math.min(100, (value / target) * 100));
  const over = value > target;
  return (
    <div className="pbar">
      <div className="pbar-head">
        <span className="pbar-label">{label}</span>
        <span className="pbar-val">
          {fmtNum(value)} / {fmtNum(target)}
          {unit}
        </span>
      </div>
      <div className="pbar-track">
        <div className={"pbar-fill" + (over ? " over" : "")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function fmtNum(n) {
  return Math.round(n * 10) / 10;
}

export function Modal({ onClose, children }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const TABS = [
  { id: "today", label: "Today", icon: "📅" },
  { id: "foods", label: "Foods", icon: "🍽️" },
  { id: "training", label: "Training", icon: "🏋️" },
  { id: "weight", label: "Weight", icon: "⚖️" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export function TabBar({ tab, onTab }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={"tabbtn" + (tab === t.id ? " active" : "")}
          onClick={() => onTab(t.id)}
        >
          <span className="tabicon">{t.icon}</span>
          <span className="tablabel">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function MacroRow({ kcal, protein, carbs, fat }) {
  return (
    <div className="macrorow">
      <span className="macro kcal">{fmtNum(kcal)} kcal</span>
      <span className="macro">P {fmtNum(protein)}g</span>
      <span className="macro">C {fmtNum(carbs)}g</span>
      <span className="macro">F {fmtNum(fat)}g</span>
    </div>
  );
}

export { fmtNum };
