// Small reusable form controls, styled the same way as apps/whist/src/ui.jsx.

export function Stepper({ value, onChange, min = 0, max = 999, step = 1, format = (v) => v }) {
  const round = (v) => Math.round(v / step) * step;
  const clamp = (v) => Math.min(max, Math.max(min, v));
  const dec = () => onChange(Number(clamp(round(value - step)).toFixed(2)));
  const inc = () => onChange(Number(clamp(round(value + step)).toFixed(2)));
  return (
    <div className="stepper">
      <button onClick={dec} disabled={value <= min}>
        −
      </button>
      <span className="stepper-val">{format(value)}</span>
      <button onClick={inc} disabled={value >= max}>
        +
      </button>
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

export function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
