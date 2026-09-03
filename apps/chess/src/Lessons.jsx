import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board from "./Board.jsx";
import { TopBar, useArrowKeys } from "./ui.jsx";
import {
  LESSONS,
  CATEGORY_LABELS,
  categoryCounts,
  lessonsByCategory,
  getLesson,
  groupShare,
  levelCounts,
  LEVELS,
  LEVEL_LABELS,
} from "./lessons/index.js";
import { play as sfx, buzz } from "./audio.js";

// Numbered step strip: jump to any part of a lesson directly.
function StepStrip({ lesson, stepIdx, onJump }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector(".stepdot.active")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [stepIdx]);
  return (
    <div className="stepstrip" ref={ref}>
      {lesson.steps.map((s, i) => (
        <button
          key={i}
          className={
            "stepdot" + (i === stepIdx ? " active" : "") + (i < stepIdx ? " past" : "") + (s.quiz ? " quiz" : "")
          }
          title={stepLabel(s, i)}
          onClick={() => onJump(i)}
        >
          {s.quiz ? "?" : i + 1}
        </button>
      ))}
    </div>
  );
}

export default function Lessons({ store, setStore, nav, view }) {
  if (view.lessonId) {
    const lesson = getLesson(view.lessonId);
    if (lesson) return <LessonRunner lesson={lesson} store={store} setStore={setStore} nav={nav} />;
  }
  if (view.category) return <LessonList category={view.category} store={store} nav={nav} />;
  return <LessonHome store={store} nav={nav} />;
}

const progressOf = (store, id) => store.lessonProgress?.[id];

// Short label for a step, used by the chapter strip. Content may supply
// `label`; otherwise we derive one from the text, or name the move played.
function stepLabel(step, i) {
  if (step.label) return step.label;
  if (step.quiz) return "Quiz";
  if (step.text) {
    const words = step.text.replace(/[—–]/g, " ").split(/\s+/).slice(0, 3).join(" ");
    return words.length > 22 ? words.slice(0, 22) + "…" : words;
  }
  if (step.play?.length) return step.play[step.play.length - 1];
  return "Step " + (i + 1);
}

function LessonProgressBar({ lesson, progress }) {
  const pct = progress?.completed
    ? 100
    : progress
      ? Math.round((((progress.step || 0) + 1) / lesson.steps.length) * 100)
      : 0;
  if (!pct) return null;
  return (
    <div className="rowbar">
      <div className="rowbar-fill" style={{ width: pct + "%" }} />
    </div>
  );
}

function LessonHome({ store, nav }) {
  const cats = categoryCounts();
  const done = Object.values(store.lessonProgress || {}).filter((p) => p.completed).length;
  const inProgress = LESSONS.filter((l) => {
    const p = progressOf(store, l.id);
    return p && !p.completed;
  });

  return (
    <div className="page">
      <TopBar
        title="Lessons"
        sub={`${done}/${LESSONS.length} completed`}
        onBack={() => nav("home")}
      />

      {inProgress.length > 0 && (
        <>
          <h2>Continue</h2>
          {inProgress.slice(0, 3).map((l) => (
            <div key={l.id} className="card lessonrow" onClick={() => nav("lessons", { lessonId: l.id })}>
              <div className="gamecard-main">
                <div className="gamecard-title">{l.title}</div>
                <div className="gamecard-sub">
                  step {(progressOf(store, l.id).step || 0) + 1} of {l.steps.length}
                </div>
              </div>
              <span className="catcard-arrow">›</span>
            </div>
          ))}
        </>
      )}

      <h2>Browse</h2>
      {cats.map((c) => {
        const inCat = LESSONS.filter((l) => l.category === c.key);
        const doneHere = inCat.filter((l) => progressOf(store, l.id)?.completed).length;
        const byLevel = levelCounts(c.key);
        return (
          <div key={c.key} className="card catcard" onClick={() => nav("lessons", { category: c.key })}>
            <div className="catcard-main">
              <div className="catcard-title">{c.label}</div>
              <div className="catcard-sub">
                {doneHere}/{c.count} lessons
              </div>
              <div className="levelsplit">
                {LEVELS.filter((lv) => byLevel[lv]).map((lv) => (
                  <span key={lv}>
                    <b>{byLevel[lv]}</b> {LEVEL_LABELS[lv].toLowerCase()}
                  </span>
                ))}
              </div>
              <div className="rowbar">
                <div className="rowbar-fill" style={{ width: (doneHere / Math.max(1, c.count)) * 100 + "%" }} />
              </div>
            </div>
            <span className="catcard-arrow">›</span>
          </div>
        );
      })}

      <p className="hint small footernote">
        Lessons run on the same board as the rest of the app — play the moves yourself when
        asked. Progress is saved on this device.
      </p>
    </div>
  );
}

function LessonList({ category, store, nav }) {
  // The whole tree is browsable at once, or one skill level at a time — a
  // beginner shouldn't have to pick their way past hanging-pawn structures to
  // find forks, and someone past that shouldn't have to scroll through them.
  const [level, setLevel] = useState(null);
  const groups = useMemo(() => lessonsByCategory(category, level), [category, level]);
  const counts = useMemo(() => levelCounts(category), [category]);
  const total = counts.beginner + counts.intermediate + counts.advanced;

  return (
    <div className="page">
      <TopBar
        title={CATEGORY_LABELS[category]}
        sub={level ? `${LEVEL_LABELS[level]} · ${counts[level]} lessons` : `${total} lessons`}
        onBack={() => nav("lessons")}
      />

      <div className="chips levelchips">
        <button className={"chip" + (level === null ? " sel" : "")} onClick={() => setLevel(null)}>
          All {total}
        </button>
        {LEVELS.map((lv) => (
          <button
            key={lv}
            className={"chip " + lv + (level === lv ? " sel" : "")}
            onClick={() => setLevel(lv)}
            disabled={!counts[lv]}
          >
            {LEVEL_LABELS[lv]} {counts[lv]}
          </button>
        ))}
      </div>

      {groups.length === 0 && <p className="hint">Nothing at this level yet.</p>}

      {groups.map(([group, list]) => {
        const done = list.filter((l) => progressOf(store, l.id)?.completed).length;
        return (
          <div key={group}>
            <h2>
              {group}
              {category === "openings" && groupShare(group) && (
                <span className="groupshare">{groupShare(group)}</span>
              )}
              <span className="groupcount">
                {done}/{list.length}
              </span>
            </h2>
            {list.map((l) => {
              const p = progressOf(store, l.id);
              return (
                <div key={l.id} className="card lessonrow" onClick={() => nav("lessons", { lessonId: l.id })}>
                  <div className="gamecard-main">
                    <div className="gamecard-title">
                      {p?.completed && <span className="lessondone">✓ </span>}
                      {l.title}
                      {l.eco && <span className="eco"> {l.eco}</span>}
                    </div>
                    <div className="gamecard-sub">{l.summary}</div>
                    <LessonProgressBar lesson={l} progress={p} />
                  </div>
                  <span className={"levelbadge " + (l.level || "intermediate")}>
                    {(l.level || "")[0]?.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function LessonRunner({ lesson, store, setStore, nav }) {
  const saved = progressOf(store, lesson.id);
  const [stepIdx, setStepIdx] = useState(saved && !saved.completed ? saved.step || 0 : 0);
  const [solved, setSolved] = useState(false); // current step's quiz answered
  const [wrong, setWrong] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const stepIdxRef = useRef(stepIdx);
  stepIdxRef.current = stepIdx;

  const step = lesson.steps[stepIdx];
  const isLast = stepIdx === lesson.steps.length - 1;

  // Position at the start of a step: replay everything before it.
  const { fenBefore, fenAfterPlay, lastMove } = useMemo(() => {
    const c = lesson.startFen ? new Chess(lesson.startFen) : new Chess();
    for (let i = 0; i < stepIdx; i++) {
      const s = lesson.steps[i];
      for (const san of s.play || []) c.move(san);
      if (s.quiz) c.move(s.quiz.answer);
    }
    const before = c.fen();
    let mv = null;
    for (const san of step.play || []) mv = c.move(san);
    return {
      fenBefore: before,
      fenAfterPlay: c.fen(),
      lastMove: mv ? [mv.from, mv.to] : null,
    };
  }, [lesson, stepIdx, step]);

  // Position shown: after the step's own moves, plus the quiz answer once found.
  const shownFen = useMemo(() => {
    if (!step.quiz || !solved) return fenAfterPlay;
    const c = new Chess(fenAfterPlay);
    c.move(step.quiz.answer);
    return c.fen();
  }, [fenAfterPlay, step, solved]);

  const quizLastMove = useMemo(() => {
    if (!step.quiz || !solved) return lastMove;
    const c = new Chess(fenAfterPlay);
    const mv = c.move(step.quiz.answer);
    return mv ? [mv.from, mv.to] : lastMove;
  }, [fenAfterPlay, step, solved, lastMove]);

  const chess = useMemo(() => new Chess(shownFen), [shownFen]);
  const needsAnswer = Boolean(step.quiz) && !solved;

  const dests = useMemo(() => {
    if (!needsAnswer) return null;
    const map = new Map();
    for (const m of chess.moves({ verbose: true })) {
      if (!map.has(m.from)) map.set(m.from, []);
      map.get(m.from).push(m.to);
    }
    return map;
  }, [chess, needsAnswer]);

  const save = (patch) =>
    setStore((s) => ({
      ...s,
      lessonProgress: {
        ...(s.lessonProgress || {}),
        [lesson.id]: { ...(s.lessonProgress?.[lesson.id] || {}), ...patch },
      },
    }));

  const goto = (i) => {
    const next = Math.max(0, Math.min(lesson.steps.length - 1, i));
    setStepIdx(next);
    setSolved(false);
    setWrong(null);
    setShowAnswer(false);
    setShowChapters(false);
    save({ step: next });
  };

  const finish = () => {
    save({ step: lesson.steps.length - 1, completed: true, completedAt: Date.now() });
    sfx(store, "gameEnd");
    nav("lessons", { category: lesson.category });
  };

  // Steps without a quiz are free to navigate with the arrow keys.
  useArrowKeys(
    () => goto(stepIdx - 1),
    () => {
      if (!needsAnswer && !isLast) goto(stepIdx + 1);
    }
  );

  const onMove = (from, to, promotion) => {
    if (!needsAnswer) return;
    const probe = new Chess(fenAfterPlay);
    const mv = probe.move({ from, to, promotion: promotion || "q" });
    if (!mv) return;
    const accepted = [step.quiz.answer, ...(step.quiz.also || [])];
    if (accepted.includes(mv.san)) {
      sfx(store, mv.captured ? "capture" : "move");
      buzz(store, 18);
      setSolved(true);
      setWrong(null);
      if (mv.san !== step.quiz.answer) {
        // an accepted alternative: continue from the main answer so later
        // steps still line up
        setTimeout(() => setSolved(true), 0);
      }
    } else {
      sfx(store, "lose");
      buzz(store, 50);
      setWrong(mv.san);
    }
  };

  const answerArrow = useMemo(() => {
    if (!step.quiz || (!showAnswer && !solved)) return null;
    const probe = new Chess(fenAfterPlay);
    const mv = probe.move(step.quiz.answer);
    return mv && showAnswer && !solved ? [mv.from, mv.to] : null;
  }, [step, fenAfterPlay, showAnswer, solved]);

  return (
    <div className="page gamepage">
      <TopBar
        title={lesson.title}
        sub={`${stepIdx + 1}/${lesson.steps.length}${lesson.eco ? " · " + lesson.eco : ""}`}
        onBack={() => nav("lessons", { category: lesson.category })}
      />

      <div className="lessonbar">
        <div className="lessonfill" style={{ width: ((stepIdx + 1) / lesson.steps.length) * 100 + "%" }} />
      </div>

      <StepStrip lesson={lesson} stepIdx={stepIdx} onJump={goto} />

      <Board
        fen={shownFen}
        orientation={lesson.orientation || "w"}
        lastMove={quizLastMove}
        dests={dests}
        onMove={onMove}
        arrow={answerArrow}
        guideArrows={step.arrows || []}
        highlightSquares={step.circles || []}
        theme={store.settings.theme}
        custom={store.settings.boardCustom}
        pieceSet={store.settings.pieces}
        animMs={store.settings.animMs}
        arrowColors={store.settings.arrowColors}
        needsPromotion={(from, to) => {
          const piece = chess.get(from);
          return piece?.type === "p" && (to[1] === "8" || to[1] === "1");
        }}
      />

      {showChapters && (
        <div className="chapterlist card">
          {lesson.steps.map((s, i) => (
            <button
              key={i}
              className={"chapteritem" + (i === stepIdx ? " active" : "")}
              onClick={() => goto(i)}
            >
              <span className="ch-num">{i + 1}</span>
              <span className="ch-label">{stepLabel(s, i)}</span>
              {s.quiz && <span className="ch-quiz">?</span>}
            </button>
          ))}
        </div>
      )}

      {step.text && <div className="lessontext">{step.text}</div>}

      {step.quiz && (
        <div className={"lessonquiz" + (solved ? " solved" : wrong ? " wrong" : "")}>
          {!solved ? (
            <>
              <b>{step.quiz.prompt || "Your move."}</b>
              {wrong && <div className="quizfeed">{wrong} isn't it — try again.</div>}
              {showAnswer && <div className="quizfeed">The move is {step.quiz.answer}.</div>}
              {step.quiz.hint && !showAnswer && <div className="quizhint">Hint: {step.quiz.hint}</div>}
            </>
          ) : (
            <>
              <b className="okmsg">✓ {step.quiz.answer}</b>
              {step.quiz.explain && <div className="quizfeed">{step.quiz.explain}</div>}
            </>
          )}
        </div>
      )}

      <div className="btnrow toolrow">
        <button className="linkbtn" onClick={() => goto(stepIdx - 1)} disabled={stepIdx === 0}>
          ‹ Back
        </button>
        <button className="linkbtn" onClick={() => setShowChapters((s) => !s)}>
          ☰ Steps
        </button>
        {/* Take the position you're looking at into a real game — the natural
            next question after "so that's the idea" is "can I actually play it?" */}
        <button
          className="linkbtn"
          onClick={() =>
            nav("play", {
              pick: true,
              fromFen: shownFen,
              fromLabel: `${lesson.title} · step ${stepIdx + 1}`,
            })
          }
        >
          ♟ Play from here
        </button>
        {needsAnswer && !showAnswer && (
          <button className="linkbtn" onClick={() => setShowAnswer(true)}>
            Show me
          </button>
        )}
        {needsAnswer && showAnswer && (
          <button className="linkbtn" onClick={() => setSolved(true)}>
            Continue anyway
          </button>
        )}
        {!needsAnswer &&
          (isLast ? (
            <button className="bigbtn" onClick={finish}>
              Finish lesson
            </button>
          ) : (
            <button className="bigbtn" onClick={() => goto(stepIdx + 1)}>
              Next ›
            </button>
          ))}
      </div>
    </div>
  );
}
