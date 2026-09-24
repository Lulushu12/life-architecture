import { useMemo, useState } from "react";
import { TopBar } from "./ui.jsx";
import { getPersona } from "./personas.js";
import { getRating } from "./puzzledb.js";
import { LESSONS } from "./lessons/index.js";

function outcome(g) {
  if (!g.result || !g.playerColor) return null;
  if (g.result === "1/2-1/2") return "d";
  if (g.result !== "1-0" && g.result !== "0-1") return null;
  return (g.result === "1-0") === (g.playerColor === "w") ? "w" : "l";
}

const when = (g) => g.playedAt || g.date || 0;

function Sparkline({ values, label, fmt, lower = false }) {
  const [sel, setSel] = useState(null);
  if (values.length < 2) return <p className="hint small">Needs at least two reviewed games.</p>;
  const W = 300;
  const H = 70;
  const pad = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i) => pad + (i * (W - 2 * pad)) / (values.length - 1);
  const y = (v) => H - pad - ((v - min) / span) * (H - 2 * pad);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const shown = sel ?? values.length - 1;
  const first = values.slice(0, Math.ceil(values.length / 2));
  const second = values.slice(Math.floor(values.length / 2));
  const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const diff = avg(second) - avg(first);
  const better = lower ? diff < 0 : diff > 0;
  return (
    <div className="spark">
      <div className="spark-head">
        <span className="spark-val">{fmt(values[shown])}</span>
        <span className="hint small">
          {sel == null ? "latest" : `game ${sel + 1} of ${values.length}`}
          {Math.abs(diff) > 0.05 && sel == null ? ` · trend ${better ? "improving" : "slipping"}` : ""}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="spark-svg" role="img" aria-label={label} onMouseLeave={() => setSel(null)}>
        <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} className="spark-base" />
        <polyline points={pts} className="spark-line" />
        {values.map((v, i) => (
          <g key={i}>
            <rect
              x={x(i) - (W - 2 * pad) / (values.length - 1) / 2}
              y={0}
              width={(W - 2 * pad) / (values.length - 1)}
              height={H}
              fill="transparent"
              onMouseEnter={() => setSel(i)}
              onClick={() => setSel(i)}
            />
            {(i === shown) && <circle cx={x(i)} cy={y(v)} r={4} className="spark-dot" />}
          </g>
        ))}
      </svg>
      <div className="spark-axis hint small">
        <span>{fmt(min)}</span>
        <span>{fmt(max)}</span>
      </div>
    </div>
  );
}

function Bars({ values, label }) {
  const [sel, setSel] = useState(null);
  if (!values.length) return <p className="hint small">No reviewed games yet.</p>;
  const W = 300;
  const H = 60;
  const max = Math.max(1, ...values);
  const slot = W / values.length;
  const bw = Math.max(3, slot - 2);
  const shown = sel ?? values.length - 1;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return (
    <div className="spark">
      <div className="spark-head">
        <span className="spark-val">{values[shown]}</span>
        <span className="hint small">
          {sel == null ? "latest" : `game ${sel + 1} of ${values.length}`} · average {avg.toFixed(1)}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="spark-svg" role="img" aria-label={label} onMouseLeave={() => setSel(null)}>
        {values.map((v, i) => {
          const h = v ? Math.max(3, (v / max) * (H - 4)) : 1;
          return (
            <rect
              key={i}
              x={i * slot + (slot - bw) / 2}
              y={H - h}
              width={bw}
              height={h}
              rx={Math.min(2, bw / 2)}
              className={"spark-bar" + (i === shown ? " sel" : "")}
              onMouseEnter={() => setSel(i)}
              onClick={() => setSel(i)}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function Stats({ store, nav }) {
  const data = useMemo(() => {
    const mine = store.games.filter((g) => g.playerColor && (g.mode === "bot" || g.mode === "import"));
    const tally = { w: 0, d: 0, l: 0 };
    for (const g of mine) {
      const o = outcome(g);
      if (o) tally[o]++;
    }
    const byMode = {};
    for (const g of store.games) byMode[g.mode] = (byMode[g.mode] || 0) + 1;

    const reviewed = mine
      .filter((g) => g.review?.accuracy)
      .sort((a, b) => when(a) - when(b))
      .slice(-20);
    const acc = reviewed.map((g) => g.review.accuracy[g.playerColor]).filter((v) => typeof v === "number");
    const blunders = reviewed.map((g) => g.review.counts?.[g.playerColor]?.blunder || 0);

    const botGames = store.games
      .filter((g) => g.mode === "bot" && outcome(g))
      .sort((a, b) => when(a) - when(b))
      .slice(-20);
    let perf = null;
    if (botGames.length) {
      let score = 0;
      let opp = 0;
      let wins = 0;
      let losses = 0;
      for (const g of botGames) {
        const o = outcome(g);
        opp += getPersona(g.personaId)?.elo || 0;
        if (o === "w") {
          wins++;
          score += 1;
        } else if (o === "d") score += 0.5;
        else losses++;
      }
      const n = botGames.length;
      perf = {
        n,
        score,
        avgOpp: Math.round(opp / n),
        rating: Math.round(opp / n + (400 * (wins - losses)) / n),
      };
    }
    const lessonsDone = Object.values(store.lessonProgress || {}).filter((p) => p?.completed).length;
    return { tally, byMode, acc, blunders, perf, lessonsDone, total: mine.length };
  }, [store.games, store.lessonProgress]);

  const rating = getRating(store);
  const bests = store.puzzleBests || {};
  const hist = store.puzzleRating?.history || [];
  const { tally } = data;
  const decided = tally.w + tally.d + tally.l;
  const pct = (n) => (decided ? Math.round((n / decided) * 100) : 0);
  const modeLabels = { bot: "vs bots", import: "imported", pass: "pass & play", engine: "engine matches", analysis: "analysis" };

  return (
    <div className="page">
      <TopBar title="Stats" sub={`${store.games.length} games in the archive`} onBack={() => nav("home")} />

      <div className="card">
        <h3>Results</h3>
        {decided ? (
          <>
            <div className="resultbar" role="img" aria-label={`${tally.w} won, ${tally.d} drawn, ${tally.l} lost`}>
              {tally.w > 0 && <span className="rb-w" style={{ flex: tally.w }} />}
              {tally.d > 0 && <span className="rb-d" style={{ flex: tally.d }} />}
              {tally.l > 0 && <span className="rb-l" style={{ flex: tally.l }} />}
            </div>
            <div className="statrow">
              <span><i className="key rb-w" />Won {tally.w} ({pct(tally.w)}%)</span>
              <span><i className="key rb-d" />Drawn {tally.d} ({pct(tally.d)}%)</span>
              <span><i className="key rb-l" />Lost {tally.l} ({pct(tally.l)}%)</span>
            </div>
          </>
        ) : (
          <p className="hint small">Finish a game against a bot, or import your games, to see results.</p>
        )}
        <p className="hint small">
          {Object.entries(data.byMode)
            .map(([m, n]) => `${n} ${modeLabels[m] || m}`)
            .join(" · ") || "No games yet"}
        </p>
      </div>

      <div className="card">
        <h3>Performance rating</h3>
        {data.perf ? (
          <>
            <div className="bignum">{data.perf.rating}</div>
            <p className="hint small">
              Last {data.perf.n} bot {data.perf.n === 1 ? "game" : "games"}: {data.perf.score}/{data.perf.n} against an average
              bot rating of {data.perf.avgOpp}.
            </p>
          </>
        ) : (
          <p className="hint small">Play some bot games to get an estimate.</p>
        )}
      </div>

      <div className="card">
        <h3>Accuracy, last {data.acc.length || 20} reviewed games</h3>
        <Sparkline values={data.acc} label="Accuracy trend" fmt={(v) => `${Math.round(v)}%`} />
      </div>

      <div className="card">
        <h3>Blunders per game</h3>
        <Bars values={data.blunders} label="Blunders per reviewed game" />
      </div>

      <div className="card">
        <h3>Puzzles</h3>
        <div className="statgrid">
          <div>
            <div className="bignum">{rating.r}</div>
            <div className="hint small">rating · {rating.n} rated</div>
          </div>
          <div>
            <div className="bignum">{bests.rush || 0}</div>
            <div className="hint small">Rush best</div>
          </div>
          <div>
            <div className="bignum">{bests.streak || 0}</div>
            <div className="hint small">Streak best</div>
          </div>
        </div>
        {hist.length >= 2 && (
          <Sparkline values={hist.slice(-30)} label="Puzzle rating trend" fmt={(v) => String(Math.round(v))} />
        )}
      </div>

      <div className="card">
        <h3>Lessons</h3>
        <div className="bignum">
          {data.lessonsDone}
          <span className="bignum-of"> / {LESSONS.length}</span>
        </div>
        <div className="lessonbar">
          <div className="lessonfill" style={{ width: `${Math.round((data.lessonsDone / Math.max(1, LESSONS.length)) * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
