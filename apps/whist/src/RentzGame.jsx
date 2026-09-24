import { useEffect, useRef, useState } from "react";
import { IconButton, useConfirm, useToast } from "@shared/ui.jsx";
import { vibrate, haptics } from "@shared/haptics.js";
import { computeRentz, handPoints, ranks, rentzDealer, signed, totaleMembers } from "./rules.js";
import { Avatar, BigBoard, Standings, TableViewToggle, TotalHead } from "./ui.jsx";
import { colorIdx } from "./players.js";
import { useFlash, useEscape } from "./hooks.js";
import { ShareButtons } from "./share.jsx";

const sum = (a) => (a || []).reduce((s, x) => s + (x || 0), 0);

function entryComplete(def, data, n, byId) {
  if (!data) return false;
  switch (def.type) {
    case "single":
      return data.playerIdx != null;
    case "units":
      return sum(data.units) === def.units;
    case "positions":
      return (data.order || []).length === n;
    case "totale":
      return totaleMembers(def, byId).every((id) =>
        byId[id].type === "single" ? data[id] != null : sum(data[id]) === byId[id].units
      );
    default:
      return false;
  }
}

export default function RentzGame({ game, onChange, onHome, onPlayAgain }) {
  const toast = useToast();
  const [confirm, confirmSheet] = useConfirm();
  const n = game.players.length;
  const c = computeRentz(game);
  const [editIdx, setEditIdx] = useState(null);
  const [flash, triggerFlash] = useFlash();
  const [tableView, setTableView] = useState(false);
  const byId = Object.fromEntries(game.config.games.map((d) => [d.id, d]));
  const colors = game.players.map((_, i) => colorIdx(game, i));
  const chooser = c.nextChooser;
  const dealer = c.done ? null : rentzDealer(game.config, chooser, n);
  const pending = game.pending || null;
  const pendingDef = pending && byId[pending.gameId];

  const pick = (id) => onChange((g) => ({ ...g, pending: { gameId: id, data: {} } }));
  const setData = (fn) => onChange((g) => ({ ...g, pending: { ...g.pending, data: fn(g.pending.data) } }));
  const cancelPending = () => onChange((g) => ({ ...g, pending: null }));
  const commit = () => {
    const pts = handPoints(pendingDef, pending.data, n, game.config.games);
    const handNo = game.hands.length;
    onChange((g) => ({
      ...g,
      hands: [
        ...g.hands,
        {
          chooserIdx: (g.firstChooser + g.hands.length) % n,
          at: Date.now(),
          gameId: g.pending.gameId,
          data: g.pending.data,
        },
      ],
      pending: null,
    }));
    vibrate(haptics.tap);
    triggerFlash(handNo);
    toast(`Hand ${handNo + 1}, ${pendingDef.name}: ${game.players.map((p, i) => `${p} ${signed(pts[i])}`).join(", ")}`);
  };

  const undo = async () => {
    if (pending) {
      const saved = pending;
      onChange((g) => ({ ...g, pending: null }));
      toast.undo(`Discarded the ${pendingDef.name} entry`, () =>
        onChange((g) => (g.pending ? g : { ...g, pending: saved }))
      );
      return;
    }
    const last = game.hands[game.hands.length - 1];
    if (!last) return;
    const lastName = byId[last.gameId]?.name || "hand";
    const yes = await confirm({
      title: "Undo the last hand?",
      message: `${game.players[last.chooserIdx]}'s ${lastName} and its scores will be removed.`,
      confirmLabel: "Undo hand",
      danger: true,
    });
    if (!yes) return;
    const count = game.hands.length;
    onChange((g) => (g.hands.length === count && !g.pending ? { ...g, hands: g.hands.slice(0, -1) } : g));
    toast(`Undone: ${game.players[last.chooserIdx]}'s ${lastName}`);
  };

  const status = c.done
    ? "Finished"
    : `Hand ${c.handsPlayed + 1}/${c.totalHands} · ${game.players[chooser]} chooses` +
      (pendingDef ? ` ${pendingDef.name}` : "") +
      (dealer != null ? ` · ${game.players[dealer]} deals` : "");

  return (
    <div className={"page gamepage" + (tableView ? " tableview" : "")}>
      <div className="topbar">
        <IconButton label="Back to games" onClick={onHome}>
          ‹
        </IconButton>
        <div>
          <div className="tb-title">Rentz</div>
          <div className="tb-sub">{status}</div>
        </div>
        <TableViewToggle on={tableView} onToggle={() => setTableView((v) => !v)} />
        {!c.done && !tableView && (pending || game.hands.length > 0) && (
          <button type="button" className="linkbtn" onClick={undo}>
            Undo
          </button>
        )}
      </div>

      {tableView ? (
        <BigBoard players={game.players} colors={colors} totals={c.totals} scored={c.handsPlayed > 0} sub={status} />
      ) : (
        <div className="gamebody">
          <div className="gameleft">
            {c.done ? (
              <Standings
                players={game.players}
                colors={colors}
                totals={c.totals}
                onPlayAgain={onPlayAgain}
                againHint={`Same games and points; ${game.players[(game.firstChooser + 1) % n]} chooses first.`}
              >
                <ShareButtons game={game} />
              </Standings>
            ) : (
              <div className="entry card">
                {!pending ? (
                  <>
                    <div className="entry-hint">{game.players[chooser]} picks a game:</div>
                    <div className="gamegrid">
                      {c.enabled.map((d) => {
                        const usedIt = c.used.has(`${chooser}:${d.id}`);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            disabled={usedIt}
                            className={"gamebtn" + (usedIt ? " off" : "")}
                            onClick={() => pick(d.id)}
                          >
                            {d.name}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="entry-label">
                      {pendingDef.name}
                      <button type="button" className="linkbtn" onClick={cancelPending}>
                        change game
                      </button>
                    </div>
                    <HandEntry
                      def={pendingDef}
                      byId={byId}
                      players={game.players}
                      colors={colors}
                      data={pending.data}
                      setData={setData}
                    />
                    <button
                      type="button"
                      className="bigbtn start"
                      disabled={!entryComplete(pendingDef, pending.data, n, byId)}
                      onClick={commit}
                    >
                      Save hand
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="gameright">
            <RentzTable game={game} c={c} onEdit={setEditIdx} flashRow={flash} />
            {c.rows.length > 0 && (
              <p className="hint small">Tap a row to correct it. Totals recompute automatically.</p>
            )}
          </div>
        </div>
      )}
      {confirmSheet}

      {editIdx != null && (
        <HandEditor
          game={game}
          idx={editIdx}
          byId={byId}
          onClose={() => setEditIdx(null)}
          onSave={(patch) => {
            onChange((g) => ({
              ...g,
              hands: g.hands.map((h, i) => (i === editIdx ? { ...h, ...patch } : h)),
            }));
            setEditIdx(null);
          }}
        />
      )}
    </div>
  );
}

function HandEntry({ def, byId, players, colors, data, setData }) {
  switch (def.type) {
    case "single":
      return (
        <PlayerPick
          players={players}
          colors={colors}
          value={data.playerIdx}
          onPick={(i) => setData((d) => ({ ...d, playerIdx: i }))}
          label={`Who took ${def.name}?`}
        />
      );
    case "units":
      return (
        <UnitsEntry
          players={players}
          colors={colors}
          label={def.name}
          units={def.units}
          value={data.units}
          onChange={(u) => setData((d) => ({ ...d, units: u }))}
        />
      );
    case "positions":
      return (
        <OrderEntry
          players={players}
          colors={colors}
          value={data.order || []}
          onChange={(o) => setData((d) => ({ ...d, order: o }))}
        />
      );
    case "totale":
      return (
        <div className="totalestack">
          {totaleMembers(def, byId).map((id) =>
            byId[id].type === "single" ? (
              <PlayerPick
                key={id}
                players={players}
                colors={colors}
                value={data[id]}
                onPick={(i) => setData((d) => ({ ...d, [id]: i }))}
                label={`${byId[id].name} taken by`}
              />
            ) : (
              <UnitsEntry
                key={id}
                players={players}
                colors={colors}
                label={byId[id].name}
                units={byId[id].units}
                value={data[id]}
                onChange={(u) => setData((d) => ({ ...d, [id]: u }))}
              />
            )
          )}
        </div>
      );
    default:
      return null;
  }
}

function PlayerPick({ players, colors, value, onPick, label }) {
  return (
    <div className="fentry">
      <div className="entry-hint">{label}</div>
      <div className="playerchips">
        {players.map((p, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={value === i}
            className={"pchip btn" + (value === i ? " active" : "")}
            onClick={() => onPick(i)}
          >
            <Avatar name={p} color={colors[i]} />
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

const LONG_PRESS = 450;

function UnitChip({ name, color, count, auto, focus, onTap, onLong }) {
  const timer = useRef(0);
  const fired = useRef(false);
  const tapRef = useRef(onTap);
  const longRef = useRef(onLong);
  tapRef.current = onTap;
  longRef.current = onLong;
  const stop = () => clearTimeout(timer.current);
  useEffect(() => stop, []);
  return (
    <button
      type="button"
      className={"unitchip" + (count > 0 ? " has" : "") + (auto ? " auto" : "") + (focus ? " focus" : "")}
      aria-label={`${name}: ${count}${auto ? ", filled in automatically" : ""}. Tap to add one, hold to remove one.`}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        fired.current = false;
        stop();
        timer.current = setTimeout(() => {
          fired.current = true;
          longRef.current();
        }, LONG_PRESS);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === "Backspace" || e.key === "Delete" || e.key === "-") {
          e.preventDefault();
          longRef.current();
        }
      }}
      onClick={() => {
        if (fired.current) {
          fired.current = false;
          return;
        }
        tapRef.current();
      }}
    >
      <span className="uc-name">
        <Avatar name={name} color={color} />
        <span>{name}</span>
      </span>
      <span className="uc-count">{count}</span>
    </button>
  );
}

function UnitsEntry({ players, colors, label, units, value, onChange }) {
  const n = players.length;
  const vals = value && value.length === n ? value : Array(n).fill(0);
  const total = sum(vals);
  const left = units - total;
  const [touched, setTouched] = useState(() => new Set(vals.flatMap((v, i) => (v > 0 ? [i] : []))));
  const [focus, setFocus] = useState(null);
  const [auto, setAuto] = useState(null);
  const rootRef = useRef(null);

  const commit = (nv) => {
    onChange(nv);
    if (sum(nv) === units && total !== units) {
      const next = rootRef.current?.nextElementSibling;
      if (next) requestAnimationFrame(() => next.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    }
  };

  const tap = (i) => {
    const nv = [...vals];
    let a = auto === i ? null : auto;
    if (left > 0) nv[i]++;
    else if (auto != null && auto !== i && nv[auto] > 0) {
      nv[auto]--;
      nv[i]++;
    } else {
      vibrate(haptics.warn);
      return;
    }
    const t = new Set(touched).add(i);
    const rest = units - sum(nv);
    const open = players.map((_, k) => k).filter((k) => !t.has(k));
    if (rest > 0 && open.length === 1) {
      nv[open[0]] += rest;
      a = open[0];
    }
    vibrate(haptics.tap);
    setTouched(t);
    setFocus(i);
    setAuto(a);
    commit(nv);
  };

  const drop = (i) => {
    if (!vals[i]) return;
    const nv = [...vals];
    nv[i]--;
    vibrate(haptics.success);
    setTouched((t) => new Set(t).add(i));
    setFocus(i);
    onChange(nv);
  };

  const giveRest = () => {
    if (focus == null || left <= 0) return;
    const nv = [...vals];
    nv[focus] += left;
    setAuto(null);
    commit(nv);
  };

  const clear = () => {
    setTouched(new Set());
    setFocus(null);
    setAuto(null);
    onChange(Array(n).fill(0));
  };

  return (
    <div ref={rootRef} className={"fentry units" + (left === 0 ? " full" : "")}>
      <div className="entry-hint unithead">
        <span>{label}</span>
        <span className={"unitcount" + (left === 0 ? " ok" : "")}>
          {total}/{units}
        </span>
      </div>
      <div className="unitchips">
        {players.map((p, i) => (
          <UnitChip
            key={i}
            name={p}
            color={colors[i]}
            count={vals[i]}
            auto={auto === i}
            focus={focus === i}
            onTap={() => tap(i)}
            onLong={() => drop(i)}
          />
        ))}
      </div>
      <div className="unitactions">
        {left > 0 && focus != null ? (
          <button type="button" className="restbtn" onClick={giveRest}>
            Rest ({left}) to {players[focus]}
          </button>
        ) : (
          <span className="hint small">
            {left > 0 ? "Tap to add one, hold to remove one." : "All assigned. Hold a player to take one back."}
          </span>
        )}
        {total > 0 && (
          <button type="button" className="linkbtn" onClick={clear}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function OrderEntry({ players, colors, value, onChange }) {
  const remaining = players.map((_, i) => i).filter((i) => !value.includes(i));
  return (
    <div className="fentry">
      <div className="entry-hint">Tap players in finishing order (first out first)</div>
      {value.length > 0 && (
        <div className="orderlist">
          {value.map((p, pos) => (
            <div key={p} className="orderrow">
              {pos + 1}. <Avatar name={players[p]} color={colors[p]} /> {players[p]}
            </div>
          ))}
        </div>
      )}
      <div className="playerchips">
        {remaining.map((i) => (
          <button key={i} type="button" className="pchip btn" onClick={() => onChange([...value, i])}>
            <Avatar name={players[i]} color={colors[i]} />
            {players[i]}
          </button>
        ))}
      </div>
      {value.length > 0 && (
        <button type="button" className="linkbtn" onClick={() => onChange(value.slice(0, -1))}>
          Remove last
        </button>
      )}
    </div>
  );
}

function RentzTable({ game, c, onEdit, flashRow }) {
  const place = ranks(c.totals);
  const best = Math.max(...c.totals);
  const scored = c.rows.length > 0;
  return (
    <div className="tablewrap">
      <table className="scoretable">
        <thead>
          <tr>
            <th className="rdcol" scope="col">
              Game
            </th>
            {game.players.map((p, i) => (
              <TotalHead
                key={i}
                name={p}
                color={colorIdx(game, i)}
                total={c.totals[i]}
                rank={place[i]}
                delta={c.totals[i] - best}
                scored={scored}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {c.rows.map((r, i) => (
            <tr key={i} className={"done" + (flashRow === i ? " flash" : "")} onClick={() => onEdit(i)}>
              <th className="rdcol gname" scope="row">
                <span className="bid">{game.players[r.chooser]}</span>
                {r.def.name}
              </th>
              {r.pts.map((p, j) => (
                <td key={j} className={p < 0 ? "badcell" : p > 0 ? "okcell" : ""}>
                  <span className="bid">{p ? (p > 0 ? "+" + p : p) : ""}</span>
                  <span className="cum">{r.cum[j]}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HandEditor({ game, idx, byId, onSave, onClose }) {
  const h = game.hands[idx];
  const n = game.players.length;
  const colors = game.players.map((_, i) => colorIdx(game, i));
  const [gameId, setGameId] = useState(h.gameId);
  const [chooserIdx, setChooserIdx] = useState(h.chooserIdx);
  const [data, setDataState] = useState(h.data);
  const setData = (fn) => setDataState((d) => fn(d));
  useEscape(onClose);
  const def = byId[gameId];
  const options = game.config.games.filter((d) => d.enabled || d.id === h.gameId);
  const clashIdx = game.hands.findIndex((x, i) => i !== idx && x.chooserIdx === chooserIdx && x.gameId === gameId);
  const changeGame = (id) => {
    setGameId(id);
    setDataState(id === h.gameId ? h.data : {});
  };
  const valid = clashIdx === -1 && entryComplete(def, data, n, byId);
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit hand ${idx + 1}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Edit hand {idx + 1}</h3>
        <div className="editpick">
          <label>
            <span className="eg-head">Chosen by</span>
            <select value={chooserIdx} onChange={(e) => setChooserIdx(+e.target.value)}>
              {game.players.map((p, i) => (
                <option key={i} value={i}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="eg-head">Game</span>
            <select value={gameId} onChange={(e) => changeGame(e.target.value)}>
              {options.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {clashIdx !== -1 && (
          <p className="warn">
            {game.players[chooserIdx]} already chose {def.name} in hand {clashIdx + 1}. Each player picks every game
            once.
          </p>
        )}
        {gameId !== h.gameId && <p className="hint small">Enter the results for {def.name}.</p>}
        <HandEntry
          key={gameId}
          def={def}
          byId={byId}
          players={game.players}
          colors={colors}
          data={data}
          setData={setData}
        />
        <div className="btnrow">
          <button type="button" className="linkbtn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bigbtn"
            disabled={!valid}
            onClick={() => onSave({ gameId, chooserIdx, data })}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
