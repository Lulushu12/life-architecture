import { useState } from "react";
import { Markdown } from "./markdown.jsx";
import { GRADES } from "./concurs.js";

// One question at a time: read it, answer out loud, reveal, grade.
// `queue` entries: { key, topicTitle, q, a, state }.
export default function QuestionDrill({ queue, onGrade, onDone }) {
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [grades, setGrades] = useState([]);

  if (queue.length === 0) return <p className="hint">Nu există întrebări pentru acest subiect încă.</p>;

  if (i >= queue.length) {
    const good = grades.filter((g) => g >= 2).length;
    return (
      <div className="card">
        <h3>Gata</h3>
        <p className="hint">
          {good} din {grades.length} corecte. Cele notate „Din nou” revin peste 10 minute, „Greu” mâine.
        </p>
        <button className="bigbtn" onClick={onDone}>
          Închide
        </button>
      </div>
    );
  }

  const item = queue[i];
  const grade = (g) => {
    onGrade(item.key, g);
    setGrades((x) => [...x, g]);
    setRevealed(false);
    setI(i + 1);
  };

  return (
    <div>
      <div className="drill-progress">
        <span>
          {i + 1} / {queue.length}
        </span>
        <span className="drill-topic">{item.topicTitle}</span>
      </div>
      <div className="card">
        <div className="drill-q">
          <Markdown text={item.q} />
        </div>
        {!revealed && (
          <button className="bigbtn" onClick={() => setRevealed(true)}>
            Arată răspunsul
          </button>
        )}
        {revealed && (
          <div className="drill-a md-content">
            <Markdown text={item.a} />
          </div>
        )}
      </div>
      {revealed && <GradeRow onGrade={grade} />}
    </div>
  );
}

export function GradeRow({ onGrade }) {
  return (
    <div className="graderow">
      {GRADES.map((g) => (
        <button key={g.value} className={`gradebtn g${g.value}`} onClick={() => onGrade(g.value)}>
          <span>{g.label}</span>
          <small>{g.hint}</small>
        </button>
      ))}
    </div>
  );
}
