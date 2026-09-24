import { useState } from "react";
import { TopBar } from "./ui.jsx";
import { Markdown } from "./markdown.jsx";
import { getArticle } from "./content.js";
import {
  topicWithContent,
  topicProgress,
  questionQueue,
  itemKey,
  updateItem,
  recordSession,
} from "./concurs.js";
import { PROBES } from "./tematica.js";
import QuestionDrill from "./QuestionDrill.jsx";
import PresentDrill from "./PresentDrill.jsx";

const EXPERIENCE_LABEL = { performed: "operat", assisted: "asistat", never: "niciodată" };

export default function ConcursTopic({ topicId, store, setStore, initialMode, onOpenArticle, onBack }) {
  const topic = topicWithContent(topicId);
  const [mode, setMode] = useState(initialMode || "study");
  const [drillKey, setDrillKey] = useState(0);

  if (!topic) {
    return (
      <div className="page">
        <TopBar title="Subiect inexistent" onBack={onBack} />
      </div>
    );
  }

  const probe = PROBES.find((p) => p.key === topic.probe);
  const c = topic.content;
  const prog = topicProgress(store, topic);

  const grade = (key, g) => setStore((s) => updateItem(s, key, g));

  const tabs = [
    { key: "study", label: "Recapitulare" },
    { key: "present", label: topic.probe === "p" ? "Operație" : "Prezentare" },
    { key: "questions", label: `Întrebări${prog.qDue ? ` (${prog.qDue})` : ""}` },
  ];

  return (
    <div className="page">
      <TopBar
        title={topic.title}
        subtitle={`${probe.short} · subiectul ${topic.number}${
          topic.experience ? ` · ${EXPERIENCE_LABEL[topic.experience]}` : ""
        }`}
        onBack={onBack}
      />

      {!c && (
        <p className="hint">
          Materialul pentru acest subiect nu a fost încă generat. Fișierul lipsește din
          apps/ortho/src/content/concurs/.
        </p>
      )}

      {c && (
        <>
          <div className="tabrow">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={"chip choice" + (mode === t.key ? " sel" : "")}
                onClick={() => {
                  setMode(t.key);
                  setDrillKey((k) => k + 1);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {mode === "study" && (
            <>
              <div className="card articlebody">
                <Markdown text={c.recap} />
              </div>
              {c.related.length > 0 && (
                <>
                  <h2>Articole conexe</h2>
                  {c.related.map((id) => {
                    const a = getArticle(id, store.localArticles);
                    if (!a) return null;
                    return (
                      <div key={id} className="card articlerow" onClick={() => onOpenArticle(id)}>
                        <div className="articlerow-title">{a.title}</div>
                        <div className="articlerow-tags">{a.categoryLabel}</div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}

          {mode === "present" && (
            <PresentDrill
              key={drillKey}
              script={c.script}
              onGradeStep={(i, g) => grade(itemKey(topic.id, "s", i), g)}
              onFinish={(result) => {
                setStore((s) =>
                  recordSession(s, { topicId: topic.id, mode: "present", at: Date.now(), ...result })
                );
                setMode("study");
              }}
            />
          )}

          {mode === "questions" && (
            <QuestionDrill
              key={drillKey}
              queue={questionQueue(store, [topic])}
              onGrade={grade}
              onDone={() => setMode("study")}
            />
          )}
        </>
      )}
    </div>
  );
}
