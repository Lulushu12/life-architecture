import { useEffect, useMemo, useRef, useState } from "react";
import { IconButton } from "@shared/ui.jsx";
import { computeRentz, computeWhist, ranks, signed } from "./rules.js";
import { colorIdx, colorOf } from "./players.js";
import { Avatar } from "./ui.jsx";

const TYPES = [
  ["whist", "Whist"],
  ["rentz", "Rentz"],
];

const computeOf = (g) => (g.type === "whist" ? computeWhist(g) : computeRentz(g));
const keyOf = (name) => name.trim().toLowerCase();
const fmtDate = (ts) =>
  new Date(ts || 0).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const MINUTE = 60000;

export function fmtDuration(ms) {
  const m = Math.max(1, Math.round(ms / MINUTE));
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

export const gameDuration = (g) =>
  Number.isFinite(g.finishedAt) && Number.isFinite(g.createdAt) && g.finishedAt > g.createdAt
    ? g.finishedAt - g.createdAt
    : null;

function timing(list) {
  const lengths = list.map((x) => gameDuration(x.g)).filter((d) => d != null);
  const steps = [];
  for (const { g } of list) {
    let prev = Number.isFinite(g.createdAt) ? g.createdAt : null;
    for (const item of g.type === "whist" ? g.rounds : g.hands) {
      if (!Number.isFinite(item.at)) {
        prev = null;
        continue;
      }
      if (prev != null && item.at > prev && item.at - prev < 30 * MINUTE) steps.push(item.at - prev);
      prev = item.at;
    }
  }
  const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
  return {
    games: lengths.length,
    avgGame: avg(lengths),
    longest: lengths.length ? Math.max(...lengths) : null,
    avgStep: avg(steps),
  };
}

function longestRun(g, rows, p) {
  let run = 0;
  let best = 0;
  for (const r of rows) {
    if (!r.cum) continue;
    if (g.config.streakSkipOnes && r.cards === 1) continue;
    if (r.ok[p]) best = Math.max(best, ++run);
    else run = 0;
  }
  return best;
}

export function buildStats(games, type) {
  const list = Object.values(games)
    .filter((g) => g.type === type)
    .map((g) => ({ g, c: computeOf(g) }))
    .sort((a, b) => (b.g.updatedAt || 0) - (a.g.updatedAt || 0));
  const finished = list.filter((x) => x.c.done);
  const people = new Map();
  const h2h = new Map();
  const person = (name, color) => {
    const k = keyOf(name);
    if (!people.has(k))
      people.set(k, { key: k, name, color, games: 0, wins: 0, sum: 0, best: null, worst: null, run: 0, bonuses: 0 });
    return people.get(k);
  };
  for (const { g, c } of finished) {
    const place = ranks(c.totals);
    g.players.forEach((name, p) => {
      const s = person(name, colorIdx(g, p));
      s.games++;
      if (place[p] === 1) s.wins++;
      s.sum += c.totals[p];
      for (const r of c.rows) {
        const v = r.pts?.[p];
        if (v == null) continue;
        if (s.best == null || v > s.best) s.best = v;
        if (s.worst == null || v < s.worst) s.worst = v;
      }
      if (type === "whist") {
        s.run = Math.max(s.run, longestRun(g, c.rows, p));
        s.bonuses += c.rows.filter((r) => r.bonus?.[p] > 0).length;
      }
    });
    for (let a = 0; a < g.players.length; a++) {
      for (let b = a + 1; b < g.players.length; b++) {
        let [i, j] = [a, b];
        if (keyOf(g.players[j]) < keyOf(g.players[i])) [i, j] = [j, i];
        const k = keyOf(g.players[i]) + "|" + keyOf(g.players[j]);
        if (!h2h.has(k)) h2h.set(k, { a: g.players[i], b: g.players[j], aw: 0, bw: 0, ties: 0, games: 0 });
        const h = h2h.get(k);
        h.games++;
        if (c.totals[i] > c.totals[j]) h.aw++;
        else if (c.totals[j] > c.totals[i]) h.bw++;
        else h.ties++;
      }
    }
  }
  const players = [...people.values()]
    .map((s) => ({ ...s, avg: s.games ? Math.round(s.sum / s.games) : 0 }))
    .sort((x, y) => y.wins - x.wins || y.games - x.games || y.avg - x.avg);
  const pairs = [...h2h.values()].sort((x, y) => y.games - x.games || x.a.localeCompare(y.a));
  return { list, finished, players, pairs, pace: timing(list) };
}

function niceStep(raw) {
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  const f = raw / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}

function useWidth(ref, active, fallback = 320) {
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setW(Math.max(240, Math.round(el.clientWidth)));
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, active]);
  return w;
}

function rowLabel(game, r, i) {
  if (i === 0) return "Start";
  if (game.type === "whist") return `Round ${i} · ${r.cards} card${r.cards > 1 ? "s" : ""}`;
  return `Hand ${i} · ${r.def?.name || ""}`;
}

export function ScoreChart({ game }) {
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);
  const c = useMemo(() => computeOf(game), [game]);
  const rows = c.rows.filter((r) => r.cum);
  const width = useWidth(wrapRef, rows.length > 0);
  const series = game.players.map((name, p) => ({
    name,
    color: colorOf(game, p),
    pts: [0, ...rows.map((r) => r.cum[p])],
  }));
  if (!rows.length) return <p className="hint">No scored rounds in this game yet.</p>;

  const H = 240;
  const pad = { l: 44, r: 78, t: 12, b: 28 };
  const all = series.flatMap((s) => s.pts);
  const lo0 = Math.min(0, ...all);
  const hi0 = Math.max(0, ...all);
  const step = niceStep((hi0 - lo0 || 1) / 4);
  const lo = Math.floor(lo0 / step) * step;
  const hi = Math.max(Math.ceil(hi0 / step) * step, lo + step);
  const ticks = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(v);
  const n = rows.length;
  const plotW = width - pad.l - pad.r;
  const x = (i) => pad.l + (i * plotW) / n;
  const y = (v) => pad.t + ((hi - v) / (hi - lo)) * (H - pad.t - pad.b);
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 44))));
  const xticks = [];
  for (let i = 0; i <= n; i += every) xticks.push(i);
  if (xticks[xticks.length - 1] !== n) xticks.push(n);

  const ends = series.map((s, p) => ({ p, y: y(s.pts[n]) })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < ends.length; k++) ends[k].y = Math.max(ends[k].y, ends[k - 1].y + 15);
  const overflow = ends.length ? ends[ends.length - 1].y - (H - pad.b) : 0;
  if (overflow > 0) ends.forEach((e) => (e.y -= overflow));

  const pick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    setHover(Math.min(n, Math.max(0, Math.round(((px - pad.l) / plotW) * n))));
  };

  const tip =
    hover != null
      ? series.map((s, p) => ({ p, name: s.name, color: s.color, v: s.pts[hover] })).sort((a, b) => b.v - a.v)
      : null;

  return (
    <div className="chart">
      <div className="legend">
        {series.map((s, p) => (
          <span key={p} className="legenditem">
            <span className="swatch" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <div className="chartwrap" ref={wrapRef}>
        <svg
          width={width}
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          role="img"
          aria-label={`Cumulative score by ${game.type === "whist" ? "round" : "hand"} for ${game.players.join(", ")}`}
          onPointerDown={pick}
          onPointerMove={pick}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={pad.l + plotW} y1={y(v)} y2={y(v)} className={v === 0 ? "axis0" : "grid"} />
              <text x={pad.l - 6} y={y(v)} className="tick" textAnchor="end" dominantBaseline="middle">
                {v}
              </text>
            </g>
          ))}
          {xticks.map((i) => (
            <text key={i} x={x(i)} y={H - 8} className="tick" textAnchor="middle">
              {i}
            </text>
          ))}
          {series.map((s, p) => (
            <path
              key={p}
              d={s.pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("")}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {ends.map((e) => (
            <g key={e.p}>
              <circle cx={x(n)} cy={y(series[e.p].pts[n])} r="4" fill={series[e.p].color} className="ring" />
              <text x={x(n) + 8} y={e.y} className="endlabel" dominantBaseline="middle">
                {series[e.p].name.length > 8 ? series[e.p].name.slice(0, 7) + "…" : series[e.p].name}
              </text>
            </g>
          ))}
          {hover != null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} className="crosshair" />
              {series.map((s, p) => (
                <circle key={p} cx={x(hover)} cy={y(s.pts[hover])} r="4.5" fill={s.color} className="ring" />
              ))}
            </g>
          )}
        </svg>
        {tip && (
          <div
            className="charttip"
            style={x(hover) > width / 2 ? { right: width - x(hover) + 10 } : { left: x(hover) + 10 }}
          >
            <div className="tiphead">{rowLabel(game, rows[hover - 1], hover)}</div>
            {tip.map((t) => (
              <div key={t.p} className="tiprow">
                <span className="swatch" style={{ background: t.color }} />
                <span className="tipname">{t.name}</span>
                <span className="tipval">{t.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Stats({ store, onBack, onOpen }) {
  const present = TYPES.filter(([t]) => Object.values(store.games).some((g) => g.type === t));
  const [type, setType] = useState(present[0]?.[0] || "whist");
  const s = useMemo(() => buildStats(store.games, type), [store.games, type]);
  const [gameId, setGameId] = useState(null);
  const chartGame = store.games[gameId]?.type === type ? store.games[gameId] : s.list[0]?.g;

  return (
    <div className="page statspage">
      <div className="topbar">
        <IconButton label="Back" onClick={onBack}>
          ‹
        </IconButton>
        <div>
          <div className="tb-title">Stats</div>
          <div className="tb-sub">
            {s.finished.length} finished {type === "whist" ? "Whist" : "Rentz"} game{s.finished.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {present.length > 1 && (
        <div className="chips" role="group" aria-label="Game type">
          {present.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={type === id}
              className={"chip" + (type === id ? " sel" : "")}
              onClick={() => setType(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {s.list.length === 0 && <p className="hint">Play a game and its stats show up here.</p>}

      {(s.pace.avgGame != null || s.pace.avgStep != null) && (
        <div className="card pacecard">
          {s.pace.avgGame != null && (
            <div className="pace">
              <span className="pacev">{fmtDuration(s.pace.avgGame)}</span>
              <span className="pacel">average game</span>
            </div>
          )}
          {s.pace.longest != null && s.pace.games > 1 && (
            <div className="pace">
              <span className="pacev">{fmtDuration(s.pace.longest)}</span>
              <span className="pacel">longest game</span>
            </div>
          )}
          {s.pace.avgStep != null && (
            <div className="pace">
              <span className="pacev">{fmtDuration(s.pace.avgStep)}</span>
              <span className="pacel">per {type === "whist" ? "round" : "hand"}</span>
            </div>
          )}
        </div>
      )}

      {s.players.length > 0 && (
        <>
          <h2>Players</h2>
          <div className="card statcard">
            <table className="stattable">
              <thead>
                <tr>
                  <th scope="col">Player</th>
                  <th scope="col" title="Finished games">
                    Games
                  </th>
                  <th scope="col">Wins</th>
                  <th scope="col" title="Average final score">
                    Avg
                  </th>
                  <th scope="col" title={type === "whist" ? "Best round" : "Best hand"}>
                    Best
                  </th>
                  <th scope="col" title={type === "whist" ? "Worst round" : "Worst hand"}>
                    Worst
                  </th>
                  {type === "whist" && (
                    <th scope="col" title="Longest run of exact bids, and streak bonuses earned">
                      Streak
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {s.players.map((p) => (
                  <tr key={p.key}>
                    <th scope="row" className="stname">
                      <Avatar name={p.name} color={p.color} />
                      <span>{p.name}</span>
                    </th>
                    <td>{p.games}</td>
                    <td>
                      {p.wins}
                      <span className="stsub">{Math.round((100 * p.wins) / p.games)}%</span>
                    </td>
                    <td>{p.avg}</td>
                    <td className="pos">{p.best == null ? "·" : signed(p.best)}</td>
                    <td className="neg">{p.worst == null ? "·" : signed(p.worst)}</td>
                    {type === "whist" && (
                      <td>
                        {p.run}
                        <span className="stsub">★ {p.bonuses}</span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {s.pairs.length > 0 && (
        <>
          <h2>Head to head</h2>
          <div className="card">
            {s.pairs.map((h) => (
              <div key={h.a + "|" + h.b} className="h2hrow">
                <span className={"h2hname" + (h.aw > h.bw ? " lead" : "")}>{h.a}</span>
                <span className="h2hscore">
                  {h.aw} : {h.bw}
                </span>
                <span className={"h2hname right" + (h.bw > h.aw ? " lead" : "")}>{h.b}</span>
                <span className="h2hmeta">
                  {h.games} game{h.games === 1 ? "" : "s"}
                  {h.ties ? `, ${h.ties} tied` : ""}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {chartGame && (
        <>
          <h2>Score over the game</h2>
          <div className="card">
            <select
              className="statselect"
              aria-label="Game to chart"
              value={chartGame.id}
              onChange={(e) => setGameId(e.target.value)}
            >
              {s.list.map(({ g, c }) => (
                <option key={g.id} value={g.id}>
                  {fmtDate(g.createdAt || g.updatedAt)} · {g.players.join(", ")}
                  {c.done ? "" : " (unfinished)"}
                </option>
              ))}
            </select>
            {gameDuration(chartGame) != null && (
              <p className="hint small">Played in {fmtDuration(gameDuration(chartGame))}.</p>
            )}
            <ScoreChart key={chartGame.id} game={chartGame} />
            <button type="button" className="linkbtn" onClick={() => onOpen(chartGame.id)}>
              Open this game's score table
            </button>
          </div>
        </>
      )}
    </div>
  );
}
