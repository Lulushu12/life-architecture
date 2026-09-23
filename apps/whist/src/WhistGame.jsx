import { Fragment, useEffect, useRef, useState } from "react";
import { IconButton, useToast } from "@shared/ui.jsx";
import { vibrate, haptics } from "@shared/haptics.js";
import { computeWhist, ranks, signed } from "./rules.js";
import { NumberGrid, Standings, TotalHead } from "./ui.jsx";
import { useFlash, useEscape } from "./hooks.js";

const entryOrder = (firstDealer, roundIdx, n) =>
  Array.from({ length: n }, (_, k) => (firstDealer + roundIdx + 1 + k) % n);

const isFull = (arr, n) => Array.isArray(arr) && arr.length === n && arr.every((x) => x != null);

const copyRound = (r) => ({ bids: r.bids ? [...r.bids] : null, taken: r.taken ? [...r.taken] : null });

function applyEntry(g, roundIdx, player, val) {
  const n = g.players.length;
  const rounds = [...g.rounds];
  const prev = rounds[roundIdx];
  const r = prev ? copyRound(prev) : { bids: null, taken: null };
  if (!r.bids) r.bids = Array(n).fill(null);
  if (!isFull(r.bids, n)) r.bids[player] = val;
  else {
    if (!r.taken) r.taken = Array(n).fill(null);
    r.taken[player] = val;
  }
  rounds[roundIdx] = r;
  return { ...g, rounds };
}

function lastEntry(g) {
  const n = g.players.length;
  for (let i = g.rounds.length - 1; i >= 0; i--) {
    const r = g.rounds[i];
    const ord = entryOrder(g.firstDealer, i, n);
    for (const key of ["taken", "bids"]) {
      const arr = r[key];
      if (!arr) continue;
      for (let k = ord.length - 1; k >= 0; k--) {
        if (arr[ord[k]] != null) return { round: i, key, player: ord[k], value: arr[ord[k]] };
      }
    }
  }
  return null;
}

function removeEntry(g, e) {
  const rounds = g.rounds.slice(0, e.round + 1).map(copyRound);
  const r = rounds[e.round];
  r[e.key][e.player] = null;
  for (const key of ["taken", "bids"]) {
    if (r[key] && r[key].every((x) => x == null)) r[key] = null;
  }
  if (!r.bids) rounds.pop();
  return { ...g, rounds };
}

export default function WhistGame({ game, onChange, onHome, onPlayAgain }) {
  const toast = useToast();
  const n = game.players.length;
  const c = computeWhist(game);
  const [editIdx, setEditIdx] = useState(null);
  const [flash, triggerFlash] = useFlash();

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
  const undoable = lastEntry(game);
  const name = (p) => game.players[p];

  let disabled = [];
  let explain = null;
  if (!finished && cursor != null) {
    if (stage === "bids") {
      const others = order.filter((p) => p !== cursor);
      const isLast = others.every((p) => bids[p] != null);
      if (isLast && game.config.forbidEqualSum) {
        const f = cards - others.reduce((s, p) => s + bids[p], 0);
        if (f >= 0 && f <= cards) {
          disabled = [f];
          explain = `${name(cursor)} (dealer) can't bid ${f}: bids would equal tricks.`;
        }
      }
    } else {
      const remaining = cards - taken.reduce((s, x) => s + (x || 0), 0);
      const isLast = order.filter((p) => p !== cursor).every((p) => taken[p] != null);
      for (let v = 0; v <= cards; v++) {
        if (v > remaining || (isLast && v !== remaining)) disabled.push(v);
      }
      if (remaining < cards) {
        explain = `${remaining} trick${remaining === 1 ? "" : "s"} left to hand out.`;
      }
    }
  }
  const legal = Array.from({ length: cards + 1 }, (_, v) => v).filter((v) => !disabled.includes(v));
  const forced = stage === "taken" && cursor != null && legal.length === 1 ? legal[0] : null;
  const bidSum = bids.reduce((s, x) => s + (x || 0), 0);

  const enter = (val) => {
    const next = applyEntry(game, roundIdx, cursor, val);
    onChange((g) => applyEntry(g, roundIdx, cursor, val));
    const row = computeWhist(next).rows[roundIdx];
    if (row?.cum) {
      vibrate(haptics.tap);
      triggerFlash(roundIdx);
      toast(`Round ${roundIdx + 1}: ${game.players.map((p, i) => `${p} ${signed(row.pts[i])}`).join(", ")}`);
    }
  };

  const undo = () => {
    const e = lastEntry(game);
    if (!e) return;
    const before = game.rounds;
    const after = removeEntry(game, e).rounds;
    onChange((g) => {
      const cur = lastEntry(g);
      return cur && cur.round === e.round && cur.key === e.key && cur.player === e.player ? removeEntry(g, cur) : g;
    });
    const verb = e.key === "bids" ? "bid" : "took";
    toast(`Undone: ${name(e.player)} ${verb} ${e.value}`, {
      action: {
        label: "Redo",
        onClick: () =>
          onChange((g) => (JSON.stringify(g.rounds) === JSON.stringify(after) ? { ...g, rounds: before } : g)),
      },
      duration: 5000,
    });
  };

  const nextDealer = game.players[(game.firstDealer + 1) % n];

  return (
    <div className="page">
      <div className="topbar">
        <IconButton label="Back to games" onClick={onHome}>
          ‹
        </IconButton>
        <div>
          <div className="tb-title">Whist</div>
          <div className="tb-sub">
            {finished
              ? "Finished"
              : `Round ${roundIdx + 1}/${c.seq.length} · ${cards} card${cards > 1 ? "s" : ""} · dealer ${name(dealer)}`}
          </div>
        </div>
        {!finished && undoable && (
          <button type="button" className="linkbtn" onClick={undo}>
            Undo
          </button>
        )}
      </div>

      {finished ? (
        <Standings
          players={game.players}
          totals={c.totals}
          onPlayAgain={onPlayAgain}
          againHint={`Same rules; ${nextDealer} deals first.`}
        />
      ) : (
        <div className="entry card">
          <div className="entry-label">
            {stage === "bids" ? "Bids" : "Tricks taken"}
            {stage === "bids" && (
              <span className="entry-sum">
                {bidSum} bid of {cards}
              </span>
            )}
          </div>
          <div className="playerchips">
            {order.map((p) => (
              <div
                key={p}
                className={"pchip" + (p === cursor ? " active" : "") + (p === dealer ? " dealer" : "")}
              >
                <span className="pname">{name(p)}</span>
                <span className="pval">
                  {stage === "taken" ? `${bids[p]} → ${taken[p] ?? "·"}` : (bids[p] ?? "·")}
                </span>
              </div>
            ))}
          </div>
          {cursor != null &&
            (forced != null ? (
              <button type="button" className="bigbtn forced" onClick={() => enter(forced)}>
                {name(cursor)} takes {forced}
              </button>
            ) : (
              <>
                <div className="entry-hint">
                  {name(cursor)}, {stage === "bids" ? "your bid:" : "tricks taken:"}
                </div>
                <NumberGrid
                  max={cards}
                  disabled={disabled}
                  onPick={enter}
                  label={stage === "bids" ? `Bid for ${name(cursor)}` : `Tricks taken by ${name(cursor)}`}
                />
                {explain && <p className="numexplain">{explain}</p>}
              </>
            ))}
        </div>
      )}

      <ScoreTable game={game} c={c} onEdit={setEditIdx} activeRow={finished ? -1 : roundIdx} flashRow={flash} />
      <p className="hint small">Tap a completed row to correct it. Later rounds recompute automatically.</p>

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

function ScoreTable({ game, c, onEdit, activeRow, flashRow }) {
  const n = game.players.length;
  const activeRef = useRef(null);
  const place = ranks(c.totals);
  const best = Math.max(...c.totals);
  const scored = c.completeRounds > 0;
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeRow]);
  return (
    <div className="tablewrap">
      <table className="scoretable">
        <thead>
          <tr>
            <th className="rdcol" scope="col">
              Cards
            </th>
            {game.players.map((p, i) => (
              <TotalHead key={i} name={p} total={c.totals[i]} rank={place[i]} delta={c.totals[i] - best} scored={scored}>
                <div className="dots" aria-hidden="true">
                  {c.okStreak[i] > 0 &&
                    Array.from({ length: Math.min(c.okStreak[i], game.config.streakLen) }).map((_, k) => (
                      <span key={k} className="dot ok" />
                    ))}
                  {c.badStreak[i] > 0 &&
                    Array.from({ length: Math.min(c.badStreak[i], game.config.streakLen) }).map((_, k) => (
                      <span key={k} className="dot bad" />
                    ))}
                </div>
              </TotalHead>
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
                className={
                  (i === activeRow ? "active " : "") + (row?.cum ? "done " : "") + (flashRow === i ? "flash" : "")
                }
                onClick={() => row?.cum && onEdit(i)}
              >
                <th className="rdcol" scope="row">
                  {cards}
                </th>
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
  const n = game.players.length;
  const c = computeWhist(game);
  const cards = c.seq[idx];
  const r = game.rounds[idx];
  const dealer = (game.firstDealer + idx) % n;
  const [bids, setBids] = useState([...r.bids]);
  const [taken, setTaken] = useState([...r.taken]);
  useEscape(onClose);
  const sumT = taken.reduce((s, x) => s + x, 0);
  const sumB = bids.reduce((s, x) => s + x, 0);
  const bidsEqual = !!game.config.forbidEqualSum && sumB === cards;
  const valid = sumT === cards && !bidsEqual;
  const opts = Array.from({ length: cards + 1 }, (_, i) => i);
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit round ${idx + 1}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>
          Edit round {idx + 1} ({cards} card{cards > 1 ? "s" : ""})
        </h3>
        <div className="editgrid">
          <div className="eg-head" />
          <div className="eg-head">Bid</div>
          <div className="eg-head">Taken</div>
          {game.players.map((p, i) => (
            <Fragment key={i}>
              <div className="eg-name">
                {p}
                {i === dealer && <span className="eg-dealer"> ♦</span>}
              </div>
              <select
                aria-label={`${p} bid`}
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
                aria-label={`${p} tricks taken`}
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
        {sumT !== cards && (
          <p className="warn">
            Tricks must add up to {cards} (currently {sumT}).
          </p>
        )}
        {bidsEqual && (
          <p className="warn">
            Bids can't add up to {cards}: {game.players[dealer]} bids last as dealer and must bid something else.
          </p>
        )}
        <div className="btnrow">
          <button type="button" className="linkbtn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="bigbtn" disabled={!valid} onClick={() => onSave(bids, taken)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
