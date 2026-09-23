import { useState } from "react";
import { IconButton, NumInput, useConfirm, useToast } from "@shared/ui.jsx";
import { vibrate, haptics } from "@shared/haptics.js";
import { computeRentz, handPoints, ranks, signed } from "./rules.js";
import { Standings, TotalHead } from "./ui.jsx";
import { useFlash, useEscape } from "./hooks.js";

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
      return (
        data.king != null &&
        (!byId.last || data.last != null) &&
        ["queens", "tricks", "diamonds"].every((id) => !byId[id] || sum(data[id]) === byId[id].units)
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
  const byId = Object.fromEntries(game.config.games.map((d) => [d.id, d]));
  const chooser = c.nextChooser;
  const pending = game.pending || null;
  const pendingDef = pending && byId[pending.gameId];

  const pick = (id) => onChange((g) => ({ ...g, pending: { gameId: id, data: {} } }));
  const setData = (fn) =>
    onChange((g) => ({ ...g, pending: { ...g.pending, data: fn(g.pending.data) } }));
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

  return (
    <div className="page">
      <div className="topbar">
        <IconButton label="Back to games" onClick={onHome}>
          ‹
        </IconButton>
        <div>
          <div className="tb-title">Rentz</div>
          <div className="tb-sub">
            {c.done
              ? "Finished"
              : `Hand ${c.handsPlayed + 1}/${c.totalHands} · ${game.players[chooser]} chooses`}
          </div>
        </div>
        {!c.done && (pending || game.hands.length > 0) && (
          <button type="button" className="linkbtn" onClick={undo}>
            Undo
          </button>
        )}
      </div>

      {c.done ? (
        <Standings
          players={game.players}
          totals={c.totals}
          onPlayAgain={onPlayAgain}
          againHint={`Same games and points; ${game.players[(game.firstChooser + 1) % n]} chooses first.`}
        />
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

      <RentzTable game={game} c={c} onEdit={setEditIdx} flashRow={flash} />
      {c.rows.length > 0 && (
        <p className="hint small">Tap a row to correct it. Totals recompute automatically.</p>
      )}
      {confirmSheet}

      {editIdx != null && (
        <HandEditor
          game={game}
          idx={editIdx}
          byId={byId}
          onClose={() => setEditIdx(null)}
          onSave={(data) => {
            onChange((g) => ({
              ...g,
              hands: g.hands.map((h, i) => (i === editIdx ? { ...h, data } : h)),
            }));
            setEditIdx(null);
          }}
        />
      )}
    </div>
  );
}

function HandEntry({ def, byId, players, data, setData }) {
  switch (def.type) {
    case "single":
      return (
        <PlayerPick
          players={players}
          value={data.playerIdx}
          onPick={(i) => setData((d) => ({ ...d, playerIdx: i }))}
          label={`Who took ${def.name}?`}
        />
      );
    case "units":
      return (
        <UnitsEntry
          players={players}
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
          value={data.order || []}
          onChange={(o) => setData((d) => ({ ...d, order: o }))}
        />
      );
    case "totale":
      return (
        <>
          <PlayerPick
            players={players}
            value={data.king}
            onPick={(i) => setData((d) => ({ ...d, king: i }))}
            label="Popa de roșu taken by"
          />
          {byId.last && (
            <PlayerPick
              players={players}
              value={data.last}
              onPick={(i) => setData((d) => ({ ...d, last: i }))}
              label="Ultima levată taken by"
            />
          )}
          {byId.queens && (
            <UnitsEntry
              players={players}
              label="Dame"
              units={byId.queens.units}
              value={data.queens}
              onChange={(u) => setData((d) => ({ ...d, queens: u }))}
            />
          )}
          {byId.tricks && (
            <UnitsEntry
              players={players}
              label="Levate"
              units={byId.tricks.units}
              value={data.tricks}
              onChange={(u) => setData((d) => ({ ...d, tricks: u }))}
            />
          )}
          {byId.diamonds && (
            <UnitsEntry
              players={players}
              label="Caro"
              units={byId.diamonds.units}
              value={data.diamonds}
              onChange={(u) => setData((d) => ({ ...d, diamonds: u }))}
            />
          )}
        </>
      );
    default:
      return null;
  }
}

function PlayerPick({ players, value, onPick, label }) {
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
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function UnitsEntry({ players, label, units, value, onChange }) {
  const vals = value && value.length === players.length ? value : Array(players.length).fill(0);
  const total = sum(vals);
  return (
    <div className="fentry">
      <div className="entry-hint">
        {label} · {total}/{units} assigned
      </div>
      {players.map((p, i) => (
        <div key={i} className="unitrow">
          <span className="pname">{p}</span>
          <NumInput
            label={`${label} for ${p}`}
            value={vals[i]}
            min={0}
            max={vals[i] + units - total}
            onChange={(v) => {
              const nv = [...vals];
              nv[i] = v;
              onChange(nv);
            }}
          />
        </div>
      ))}
    </div>
  );
}

function OrderEntry({ players, value, onChange }) {
  const remaining = players.map((_, i) => i).filter((i) => !value.includes(i));
  return (
    <div className="fentry">
      <div className="entry-hint">Tap players in finishing order (first out first)</div>
      {value.length > 0 && (
        <div className="orderlist">
          {value.map((p, pos) => (
            <div key={p} className="orderrow">
              {pos + 1}. {players[p]}
            </div>
          ))}
        </div>
      )}
      <div className="playerchips">
        {remaining.map((i) => (
          <button key={i} type="button" className="pchip btn" onClick={() => onChange([...value, i])}>
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
              <TotalHead key={i} name={p} total={c.totals[i]} rank={place[i]} delta={c.totals[i] - best} scored={scored} />
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
  const def = byId[h.gameId];
  const n = game.players.length;
  const [data, setDataState] = useState(h.data);
  const setData = (fn) => setDataState((d) => fn(d));
  useEscape(onClose);
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${def.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>
          Edit: {def.name} ({game.players[h.chooserIdx]})
        </h3>
        <HandEntry def={def} byId={byId} players={game.players} data={data} setData={setData} />
        <div className="btnrow">
          <button type="button" className="linkbtn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bigbtn"
            disabled={!entryComplete(def, data, n, byId)}
            onClick={() => onSave(data)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
