export const MOODS = [
  { v: 1, label: "Low" },
  { v: 2, label: "Meh" },
  { v: 3, label: "Okay" },
  { v: 4, label: "Good" },
  { v: 5, label: "Great" },
];

export const moodLabel = (v) => MOODS.find((m) => m.v === v)?.label || "";

export default function MoodPicker({ entry, onUpdate }) {
  return (
    <div className="card mood">
      <h3 id={`mood-${entry.id}`}>How do you feel?</h3>
      <div className="moodrow" role="radiogroup" aria-labelledby={`mood-${entry.id}`}>
        {MOODS.map((m) => (
          <button
            key={m.v}
            type="button"
            role="radio"
            aria-checked={entry.mood === m.v}
            className={"moodbtn" + (entry.mood === m.v ? " sel" : "")}
            onClick={() => onUpdate({ mood: entry.mood === m.v ? undefined : m.v })}
          >
            <span className="moodnum">{m.v}</span>
            <span className="moodlbl">{m.label}</span>
          </button>
        ))}
      </div>
      <input
        className="input moodnote"
        type="text"
        maxLength={140}
        placeholder="Add a note (optional)"
        aria-label="Note"
        value={entry.note || ""}
        onChange={(e) => onUpdate({ note: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
    </div>
  );
}
