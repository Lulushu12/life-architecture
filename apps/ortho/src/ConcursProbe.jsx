import { useState } from "react";
import { TopBar } from "./ui.jsx";
import { topicList, topicProgress, questionQueue, updateItem, daysUntil } from "./concurs.js";
import { PROBES } from "./tematica.js";
import QuestionDrill from "./QuestionDrill.jsx";

const EXPERIENCE_LABEL = { performed: "operat", assisted: "asistat", never: "niciodată" };
const EXPERIENCE_RANK = { never: 0, assisted: 1, performed: 2 };

export default function ConcursProbe({ probeKey, store, setStore, onOpenTopic, onBack }) {
  const probe = PROBES.find((p) => p.key === probeKey);
  const topics = topicList(probeKey);
  const [sort, setSort] = useState("number");
  const [drill, setDrill] = useState(false);

  const rows = topics.map((t) => ({ t, p: topicProgress(store, t) }));
  const dueTotal = rows.reduce((a, r) => a + r.p.qDue + r.p.sDue, 0);
  const withContent = rows.filter((r) => r.t.content).length;

  const sorted = [...rows].sort((a, b) => {
    if (sort === "due") return b.p.qDue + b.p.sDue - (a.p.qDue + a.p.sDue) || a.t.number - b.t.number;
    if (sort === "weak") return b.p.weak - a.p.weak || a.t.number - b.t.number;
    if (sort === "experience")
      return (EXPERIENCE_RANK[a.t.experience] ?? 3) - (EXPERIENCE_RANK[b.t.experience] ?? 3) || a.t.number - b.t.number;
    return a.t.number - b.t.number;
  });

  const days = daysUntil(probe.date);

  if (drill) {
    return (
      <div className="page">
        <TopBar title="Întrebări scadente" subtitle={probe.label} onBack={() => setDrill(false)} />
        <QuestionDrill
          queue={questionQueue(store, topics, Date.now(), 40)}
          onGrade={(key, g) => setStore((s) => updateItem(s, key, g))}
          onDone={() => setDrill(false)}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <TopBar
        title={probe.label}
        subtitle={`${days >= 0 ? `peste ${days} zile` : "trecut"} · ${withContent}/${topics.length} subiecte cu material`}
        onBack={onBack}
      />

      <button className="bigbtn" onClick={() => setDrill(true)} disabled={withContent === 0}>
        Sesiune de întrebări{dueTotal ? ` · ${dueTotal} scadente` : ""}
      </button>

      <div className="filterrow">
        <span className="filterrow-label">Sortare</span>
        <div className="filterrow-chips">
          {[
            ["number", "Tematică"],
            ["due", "Scadente"],
            ["weak", "Slabe"],
            ...(probeKey === "p" ? [["experience", "Experiență"]] : []),
          ].map(([k, l]) => (
            <button key={k} className={"chip" + (sort === k ? " active" : "")} onClick={() => setSort(k)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {sorted.map(({ t, p }) => (
        <div
          key={t.id}
          className={"card topicrow" + (t.content ? "" : " missing")}
          onClick={() => t.content && onOpenTopic(t.id)}
        >
          <div className="topicrow-num">{t.number}</div>
          <div className="topicrow-main">
            <div className="topicrow-title">{t.title}</div>
            <div className="topicrow-sub">
              {!t.content && "material negenerat"}
              {t.content && (
                <>
                  {t.experience && (
                    <span className={"exp exp-" + t.experience}>{EXPERIENCE_LABEL[t.experience]}</span>
                  )}
                  <span>
                    {p.qSeen}/{p.q} întrebări
                  </span>
                  {p.qDue + p.sDue > 0 && <span className="due">{p.qDue + p.sDue} scadente</span>}
                  {p.weak > 0 && <span className="weak">{p.weak} slabe</span>}
                  {p.last && (
                    <span>
                      prezentare {p.last.score}%
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <span className="catcard-arrow">›</span>
        </div>
      ))}
    </div>
  );
}
