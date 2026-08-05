import { useEffect, useRef } from "react";

// Left/right arrow keys navigate moves wherever a board screen mounts this.
export function useArrowKeys(onPrev, onNext) {
  const ref = useRef({ onPrev, onNext });
  ref.current = { onPrev, onNext };
  useEffect(() => {
    const h = (e) => {
      const t = e.target.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        ref.current.onPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        ref.current.onNext();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
}

export function TopBar({ title, sub, onBack, right }) {
  return (
    <div className="topbar">
      {onBack && (
        <button className="iconbtn" onClick={onBack}>
          ‹
        </button>
      )}
      <div className="tb-main">
        <div className="tb-title">{title}</div>
        {sub && <div className="tb-sub">{sub}</div>}
      </div>
      {right}
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

// Two-column SAN move list. onTap(plyIndex) with plyIndex 0-based.
export function MoveList({ sans, annotations, activePly, onTap }) {
  const rows = [];
  for (let i = 0; i < sans.length; i += 2) rows.push([i, i + 1]);
  return (
    <div className="movelist">
      {rows.map(([a, b]) => (
        <div key={a} className="mlrow">
          <span className="mlnum">{a / 2 + 1}.</span>
          {[a, b].map(
            (p) =>
              p < sans.length && (
                <button
                  key={p}
                  className={"mlmove" + (p === activePly ? " active" : "")}
                  style={annotations?.[p] ? { color: annotations[p].color } : undefined}
                  onClick={() => onTap && onTap(p)}
                >
                  {sans[p]}
                  {annotations?.[p] && <span className="mlbadge">{annotations[p].icon}</span>}
                </button>
              )
          )}
        </div>
      ))}
    </div>
  );
}

export function PersonaCard({ persona, record, onClick, small }) {
  const rec = record || { w: 0, l: 0, d: 0 };
  return (
    <button className={"personacard" + (small ? " small" : "")} onClick={onClick}>
      <span className="pc-avatar">{persona.avatar}</span>
      <span className="pc-main">
        <span className="pc-name">{persona.name}</span>
        <span className="pc-sub">
          {persona.elo} · {persona.tagline}
        </span>
        {!small && (
          <span className="pc-record">
            you: {rec.w}W {rec.d}D {rec.l}L
          </span>
        )}
      </span>
    </button>
  );
}
