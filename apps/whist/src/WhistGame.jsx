import { Fragment, useEffect, useRef, useState } from "react";
import { computeWhist } from "./rules.js";
import { NumberGrid, Standings } from "./ui.jsx";

const entryOrder = (firstDealer, roundIdx, n) =>
  Array.from({ length: n }, (_, k) => (firstDealer + roundIdx + 1 + k) % n);

const isFull = (arr, n) =>
  Array.isArray(arr) && arr.length === n && arr.every((x) => x != null);

export default function WhistGame({ game, onChange, onHome }) {
  const n = game.players.length;
  const c = computeWhist(game);
  const [editIdx, setEditIdx] = useState(null);

  const finished = c.done;
  const roundIdx = c.completeRounds;
  const cards = finished ? 0 : c.seq[roundIdx];
  const dealer = finished ? 0 : (game.firstDealer + roundIdx) % n;
  const order = finished ? [] : entryOrder(game.firstDealer, roundIdx, n);
  const round = game.rounds[roundIdx] || null;
  const bids = round?.bids || Array(n).fill(null);
  const taken = round?.taken || Array(n).fill(null);
  const stage = isFull(bids, n) ? "taken" : "bids";
  const values = stage === "bids" ? bids : taken;
  const cursor = order.find((p) => values[p] == null);
  const hasAnyEntry = game.rounds.some(
    (r) => r.bids?.some((x) => x != null) || r.taken?.some((x) => x != null)
  );

  // Which numbers the current player may not pick.
  let disabled = [];
  if (!finished && cursor != null) {
    if (stage === "bids") {
      const others = order.filter((p) => p !== cursor);
      const isLast = others.every((p) => bids[p] != null);
      if (isLast && game.config.forbidEqualSum) {
        const f = cards - others.reduce((s, p) => s + bids[p], 0);
        if (f >= 0 && f <= cards) disabled = [f];
      }
    } else {
      const sumSoFar = taken.reduce((s, x) => s + (x || 0), 0);
      const remaining = cards - sumSoFar;
      const isLast = order.filter((p) => p !== cursor).every((p) => taken[p] != null);
      for (let v = 0; v <= cards; v++) {
        if (v > remaining || (isLast && v !== remaining)) disabled.push(v);
      }
    }
  }

  const enter = (val) =>
    onChange((g) => {
      const rounds = [...g.rounds];
      const r = rounds[roundIdx]
        ? {
            bids: [...rounds[roundIdx].bids],
            taken: rounds[roundIdx].taken ? [...rounds[roundIdx].taken] : null,
          }
        : { bids: Array(n).fill(null), taken: null };
      if (!isFull(r.bids, n)) {
        r.bids[cursor] = val;
      } else {
        if (!r.taken) r.taken = Array(n).fill(null);
        r.taken[cursor] = val;
      }
      rounds[roundIdx] = r;
      return { ...g, rounds };
    });

  // Removes the single most recent entry, whatever stage or round it was in.
  const undo = () =>
    onChange((g) => {
      const rounds = g.rounds.map((r) => ({
        bids: r.bids ? [...r.bids] : null,
        taken: r.taken ? [...r.taken] : null,
      }));
      const gg = { ...g, rounds };
      while (rounds.length) {
        const i = rounds.length - 1;
        const r = rounds[i];
        const ord = entryOrder(g.firstDealer, i, n);
        for (const key of ["taken", "bids"]) {
          const arr = r[key];
          if (!arr) continue;
          for (let k = ord.length - 1; k >= 0; k--) {
            if (arr[ord[k]] != null) {
              arr[ord[k]] = null;
              if (arr.every((x) => x == null)) r[key] = null;
              if (!r.bids && !r.taken) rounds.pop();
              return gg;
            }
          }
          r[key] = null;
        }
        rounds.pop();
      }
      return gg;
    });

  return (
    <div className="page">
      <div className="topbar">
        <button className="iconbtn" onClick={onHome}>
          ‹
        </button>
        <div>
          <div className="tb-title">Whist</div>
          <div className="tb-sub">
            {finished
              ? "Finished"
              : `Round ${roundIdx + 1}/${c.seq.length} · ${cards} card${cards > 1 ? "s" : ""} · dealer ${game.players[dealer]}`}
          </div>
        </div>
        {!finished && hasAnyEntry && (
          <button className="linkbtn" onClick={undo}>
            Undo
          </button>
        )}
      </div>

      {finished ? (
        <Standings players={game.players} totals={c.totals} />
      ) : (
        <div className="entry card">
          <div className="entry-label">{stage === "bids" ? "Bids" : "Tricks taken"}</div>
          <div className="playerchips">
            {order.map((p) => (
              <div
                key={p}
                className={
                  "pchip" + (p === cursor ? " active" : "") + (p === dealer ? " dealer" : "")
                }
              >
                <span className="pname">{game.players[p]}</span>
                <span className="pval">
                  {stage === "taken" ? `${bids[p]} → ${taken[p] ?? "·"}` : (bids[p] ?? "·")}
                </span>
              </div>
            ))}
          </div>
          {cursor != null && (
            <>
              <div className="entry-hint">
                {game.players[cursor]}, {stage === "bids" ? "your bid:" : "tricks taken:"}
              </div>
              <NumberGrid max={cards} disabled={disabled} onPick={enter} />
            </>
          )}
        </div>
      )}

      <ScoreTable game={game} c={c} onEdit={setEditIdx} activeRow={finished ? -1 : roundIdx} />
      <p className="hint small">Tap a completed row to correct it — later rounds recompute automatically.</p>

      {editIdx != null && (
        <RoundEditor
          game={game}
          idx={editIdx}
          onClose={() => setEditIdx(null)}
          onSave={(bids2, taken2) => {
            onChange((g) => {
              const rounds = [...g.rounds];
              rounds[editIdx] = { bids: bids2, taken: taken2 };
              return { ...g, rounds };
            });
            setEditIdx(null);
          }}
        />
      )}
    </div>
  );
}

function ScoreTable({ game, c, onEdit, activeRow }) {
  const n = game.players.length;
  const activeRef = useRef(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeRow]);
  return (
    <div className="tablewrap">
      <table className="scoretable">
        <thead>
          <tr>
            <th className="rdcol">#</th>
            {game.players.map((p, i) => (
              <th key={i}>
                <div className="thname">{p}</div>
                <div className="dots">
                  {c.okStreak[i] > 0 &&
                    Array.from({ length: Math.min(c.okStreak[i], game.config.streakLen) }).map(
                      (_, k) => <span key={k} className="dot ok" />
                    )}
                  {c.badStreak[i] > 0 &&
                    Array.from({ length: Math.min(c.badStreak[i], game.config.streakLen) }).map(
                      (_, k) => <span key={k} className="dot bad" />
                    )}
                </div>
              </th>
            ))}
          </tr>
          <tr className="totalsrow">
            <th className="rdcol">Σ</th>
            {c.totals.map((t, i) => (
              <th key={i} className="total">
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {c.seq.map((cards, i) => {
            const row = c.rows[i];
            const rowDealer = (game.firstDealer + i) % n;
            return (
              <tr
                key={i}
                ref={i === activeRow ? activeRef : null}
                className={(i === activeRow ? "active " : "") + (row?.cum ? "done" : "")}
                onClick={() => row?.cum && onEdit(i)}
              >
                <td className="rdcol">{cards}</td>
                {game.players.map((_, p) => (
                  <td
                    key={p}
                    className={
                      (row?.ok?.[p] === true ? "okcell" : row?.ok?.[p] === false ? "badcell" : "") +
                      (p === rowDealer ? " dealercell" : "")
                    }
                  >
                    {row?.bids?.[p] != null && <span className="bid">{row.bids[p]}</span>}
                    {row?.cum ? (
                      <span className="cum">{row.cum[p]}</span>
                    ) : row?.taken?.[p] != null ? (
                      <span className="cum dim">{row.taken[p]}</span>
                    ) : null}
                    {row?.bonus?.[p] ? (
                      <span className={"star" + (row.bonus[p] < 0 ? " neg" : "")}>
                        {row.bonus[p] > 0 ? "★" : "▼"}
                      </span>
                    ) : null}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RoundEditor({ game, idx, onSave, onClose }) {
  const c = computeWhist(game);
  const cards = c.seq[idx];
  const r = game.rounds[idx];
  const [bids, setBids] = useState([...r.bids]);
  const [taken, setTaken] = useState([...r.taken]);
  const sumT = taken.reduce((s, x) => s + x, 0);
  const valid = sumT === cards;
  const opts = Array.from({ length: cards + 1 }, (_, i) => i);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h3>
          Edit round {idx + 1} ({cards} card{cards > 1 ? "s" : ""})
        </h3>
        <div className="editgrid">
          <div className="eg-head" />
          <div className="eg-head">Bid</div>
          <div className="eg-head">Taken</div>
          {game.players.map((p, i) => (
            <Fragment key={i}>
              <div className="eg-name">{p}</div>
              <select
                value={bids[i]}
                onChange={(e) => setBids((b) => b.map((x, j) => (j === i ? +e.target.value : x)))}
              >
                {opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <select
                value={taken[i]}
                onChange={(e) => setTaken((t) => t.map((x, j) => (j === i ? +e.target.value : x)))}
              >
                {opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Fragment>
          ))}
        </div>
        {!valid && (
          <p className="warn">
            Tricks must add up to {cards} (currently {sumT}).
          </p>
        )}
        <div className="btnrow">
          <button className="linkbtn" onClick={onClose}>
            Cancel
          </button>
          <button className="bigbtn" disabled={!valid} onClick={() => onSave(bids, taken)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
