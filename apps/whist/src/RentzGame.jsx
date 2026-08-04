import { useState } from "react";
import { computeRentz } from "./rules.js";
import { NumInput, Standings } from "./ui.jsx";

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
        data.last != null &&
        sum(data.queens) === byId.queens.units &&
        sum(data.tricks) === byId.tricks.units &&
        sum(data.diamonds) === byId.diamonds.units
      );
    default:
      return false;
  }
}

export default function RentzGame({ game, onChange, onHome }) {
  const n = game.players.length;
  const c = computeRentz(game);
  const [editIdx, setEditIdx] = useState(null);
  const byId = Object.fromEntries(game.config.games.map((d) => [d.id, d]));
  const chooser = c.nextChooser;
  const pending = game.pending || null;
  const pendingDef = pending && byId[pending.gameId];

  const pick = (id) => onChange((g) => ({ ...g, pending: { gameId: id, data: {} } }));
  const setData = (fn) =>
    onChange((g) => ({ ...g, pending: { ...g.pending, data: fn(g.pending.data) } }));
  const cancelPending = () => onChange((g) => ({ ...g, pending: null }));
  const commit = () =>
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
  const undo = () =>
    onChange((g) => (g.pending ? { ...g, pending: null } : { ...g, hands: g.hands.slice(0, -1) }));

  return (
    <div className="page">
      <div className="topbar">
        <button className="iconbtn" onClick={onHome}>
          ‹
        </button>
        <div>
          <div className="tb-title">Rentz</div>
          <div className="tb-sub">
            {c.done
              ? "Finished"
              : `Hand ${c.handsPlayed + 1}/${c.totalHands} · ${game.players[chooser]} chooses`}
          </div>
        </div>
        {!c.done && (pending || game.hands.length > 0) && (
          <button
            className="linkbtn"
            onClick={() => {
              if (pending || confirm("Undo the last hand?")) undo();
            }}
          >
            Undo
          </button>
        )}
      </div>

      {c.done ? (
        <Standings players={game.players} totals={c.totals} />
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
                <button className="linkbtn" onClick={cancelPending}>
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

      <RentzTable game={game} c={c} onEdit={setEditIdx} />
      {c.rows.length > 0 && (
        <p className="hint small">Tap a row to correct it — totals recompute automatically.</p>
      )}

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
            label="Regele de cupă taken by"
          />
          <PlayerPick
            players={players}
            value={data.last}
            onPick={(i) => setData((d) => ({ ...d, last: i }))}
            label="Ultima levată taken by"
          />
          <UnitsEntry
            players={players}
            label="Dame"
            units={byId.queens.units}
            value={data.queens}
            onChange={(u) => setData((d) => ({ ...d, queens: u }))}
          />
          <UnitsEntry
            players={players}
            label="Levate"
            units={byId.tricks.units}
            value={data.tricks}
            onChange={(u) => setData((d) => ({ ...d, tricks: u }))}
          />
          <UnitsEntry
            players={players}
            label="Carouri"
            units={byId.diamonds.units}
            value={data.diamonds}
            onChange={(u) => setData((d) => ({ ...d, diamonds: u }))}
          />
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
          <button key={i} className="pchip btn" onClick={() => onChange([...value, i])}>
            {players[i]}
          </button>
        ))}
      </div>
      {value.length > 0 && (
        <button className="linkbtn" onClick={() => onChange(value.slice(0, -1))}>
          Remove last
        </button>
      )}
    </div>
  );
}

function RentzTable({ game, c, onEdit }) {
  return (
    <div className="tablewrap">
      <table className="scoretable">
        <thead>
          <tr>
            <th className="rdcol">Game</th>
            {game.players.map((p, i) => (
              <th key={i}>
                <div className="thname">{p}</div>
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
          {c.rows.map((r, i) => (
            <tr key={i} className="done" onClick={() => onEdit(i)}>
              <td className="rdcol gname">
                <span className="bid">{game.players[r.chooser]}</span>
                {r.def.name}
              </td>
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
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h3>
          Edit: {def.name} ({game.players[h.chooserIdx]})
        </h3>
        <HandEntry def={def} byId={byId} players={game.players} data={data} setData={setData} />
        <div className="btnrow">
          <button className="linkbtn" onClick={onClose}>
            Cancel
          </button>
          <button
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
