import { useEffect, useState } from "react";
import { Markdown } from "./markdown.jsx";
import { formatSeconds } from "./concurs.js";
import { GradeRow } from "./QuestionDrill.jsx";

// Timed oral presentation drill.
// Phase "ready": skeleton of steps with target times, Start button.
// Phase "run": stopwatch, current step highlighted, content hidden; Next
//   moves on and stamps the step's elapsed time.
// Phase "review": every step revealed with its time vs target and a grade
//   row; extras (Fraze-cheie etc) shown at the end; Save records the session.
export default function PresentDrill({ script, onGradeStep, onFinish }) {
  const [phase, setPhase] = useState("ready");
  const [step, setStep] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [stepStart, setStepStart] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [times, setTimes] = useState([]);
  const [grades, setGrades] = useState({});

  useEffect(() => {
    if (phase !== "run") return undefined;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [phase]);

  const steps = script.steps;
  const targetTotal = steps.reduce((a, s) => a + s.seconds, 0);

  if (steps.length === 0) return <p className="hint">Scriptul acestui subiect nu are pași numerotați.</p>;

  const start = () => {
    const t = Date.now();
    setStartedAt(t);
    setStepStart(t);
    setNow(t);
    setStep(0);
    setTimes([]);
    setGrades({});
    setPhase("run");
  };

  const next = () => {
    const t = Date.now();
    const elapsed = (t - stepStart) / 1000;
    const newTimes = [...times, elapsed];
    setTimes(newTimes);
    if (step + 1 >= steps.length) {
      setPhase("review");
    } else {
      setStep(step + 1);
      setStepStart(t);
    }
  };

  const skipToReview = () => {
    setTimes(steps.map(() => 0));
    setPhase("review");
  };

  if (phase === "ready") {
    return (
      <div>
        <p className="hint">
          Prezintă cu voce tare, ca în fața comisiei. Conținutul rămâne ascuns până la sfârșit; apoi îl compari
          cu scriptul și te notezi pe fiecare secțiune.
        </p>
        <div className="card">
          {steps.map((s, i) => (
            <div key={i} className="steprow">
              <span className="stepnum">{s.number}</span>
              <span className="steptitle">{s.title}</span>
              <span className="steptime">{s.seconds ? formatSeconds(s.seconds) : ""}</span>
            </div>
          ))}
          <div className="steprow total">
            <span className="stepnum" />
            <span className="steptitle">Total țintă</span>
            <span className="steptime">{formatSeconds(targetTotal)}</span>
          </div>
        </div>
        <button className="bigbtn" onClick={start}>
          Start cronometru
        </button>
        <button className="linkbtn center" onClick={skipToReview}>
          Fără cronometru, doar verific scriptul
        </button>
      </div>
    );
  }

  if (phase === "run") {
    const s = steps[step];
    const stepElapsed = (now - stepStart) / 1000;
    const over = s.seconds && stepElapsed > s.seconds;
    return (
      <div>
        <div className="timerbox">
          <div className="timer-total">{formatSeconds((now - startedAt) / 1000)}</div>
          <div className="timer-sub">
            total, țintă {formatSeconds(targetTotal)}
          </div>
        </div>
        <div className={"card stepcard" + (over ? " over" : "")}>
          <div className="stepcard-label">
            Pasul {s.number} din {steps.length}
          </div>
          <div className="stepcard-title">{s.title}</div>
          <div className="stepcard-time">
            {formatSeconds(stepElapsed)}
            {s.seconds ? <span> / {formatSeconds(s.seconds)}</span> : null}
          </div>
        </div>
        <button className="bigbtn" onClick={next}>
          {step + 1 >= steps.length ? "Am terminat" : "Următorul pas"}
        </button>
        <div className="upcoming">
          {steps.slice(step + 1, step + 3).map((u, i) => (
            <div key={i} className="hint small">
              urmează: {u.number}. {u.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const total = times.reduce((a, b) => a + b, 0);
  const allGraded = steps.every((_, i) => grades[i] !== undefined);
  const finish = () => {
    const values = steps.map((_, i) => grades[i]);
    onFinish({
      durationSec: Math.round(total),
      targetSec: targetTotal,
      grades: values,
      score: Math.round((values.reduce((a, b) => a + b, 0) / (3 * values.length)) * 100),
    });
  };

  return (
    <div>
      {total > 0 && (
        <div className="timerbox">
          <div className="timer-total">{formatSeconds(total)}</div>
          <div className="timer-sub">total, țintă {formatSeconds(targetTotal)}</div>
        </div>
      )}
      {steps.map((s, i) => (
        <div key={i} className="card">
          <div className="steprow">
            <span className="stepnum">{s.number}</span>
            <span className="steptitle">{s.title}</span>
            <span className={"steptime" + (s.seconds && times[i] > s.seconds * 1.25 ? " over" : "")}>
              {times[i] ? formatSeconds(times[i]) : ""}
              {s.seconds ? ` / ${formatSeconds(s.seconds)}` : ""}
            </span>
          </div>
          <div className="md-content stepcontent">
            <Markdown text={s.content} />
          </div>
          {grades[i] === undefined ? (
            <GradeRow
              onGrade={(g) => {
                setGrades((x) => ({ ...x, [i]: g }));
                onGradeStep(i, g);
              }}
            />
          ) : (
            <div className="graded">Notat: {["Din nou", "Greu", "Bine", "Ușor"][grades[i]]}</div>
          )}
        </div>
      ))}
      {script.extras.map((e, i) => (
        <div key={i} className="card extras">
          <h3>{e.title}</h3>
          <div className="md-content">
            <Markdown text={e.content} />
          </div>
        </div>
      ))}
      <button className="bigbtn" disabled={!allGraded} onClick={finish}>
        Salvează sesiunea
      </button>
      {!allGraded && <p className="hint small center">Notează fiecare secțiune ca să salvezi.</p>}
    </div>
  );
}
