import { useState } from "react";
import { RENTZ_GAME_DEFS, resizePositions } from "./rules.js";
import { newId } from "@shared/store.js";
import { IconButton, NumInput, SettingRow, Toggle } from "@shared/ui.jsx";
import { PlayersEditor, displayNames, duplicateName } from "./ui.jsx";

export default function RentzSetup({ onCancel, onCreate, recent }) {
  const [players, setPlayers] = useState(["", "", "", ""]);
  const [firstChooser, setFirstChooser] = useState(0);
  const [defs, setDefs] = useState(RENTZ_GAME_DEFS(4));

  const onCountChange = (k) => {
    setPlayers((ps) => {
      const q = [...ps];
      while (q.length < k) q.push("");
      return q.slice(0, k);
    });
    setFirstChooser((d) => Math.min(d, k - 1));
    setDefs((ds) =>
      ds.map((d) =>
        d.id === "diamonds"
          ? { ...d, units: 2 * k }
          : d.id === "rentz"
            ? { ...d, values: resizePositions(d.values, k) }
            : d
      )
    );
  };
  const setDef = (id, patch) =>
    setDefs((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const names = displayNames(players);
  const dup = duplicateName(names);
  const enabledCount = defs.filter((d) => d.enabled).length;

  return (
    <div className="page">
      <div className="topbar">
        <IconButton label="Back" onClick={onCancel}>
          ‹
        </IconButton>
        <div>
          <div className="tb-title">New Rentz game</div>
          <div className="tb-sub">
            {players.length} players × {enabledCount} games = {players.length * enabledCount} hands
          </div>
        </div>
      </div>

      <PlayersEditor players={players} setPlayers={setPlayers} onCountChange={onCountChange} recent={recent} />

      <div className="field">
        <div className="flabel">First to choose a game</div>
        <div className="chips">
          {names.map((p, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={firstChooser === i}
              className={"chip" + (firstChooser === i ? " sel" : "")}
              onClick={() => setFirstChooser(i)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flabel">Mini-games & points</div>
      {defs.map((d) => (
        <div key={d.id} className={"card gamedef" + (d.enabled ? "" : " off")}>
          <div className="gd-head">
            <Toggle label={d.name} checked={d.enabled} onChange={(v) => setDef(d.id, { enabled: v })} />
            <span className="gd-name">{d.name}</span>
          </div>
          {d.enabled && d.type === "single" && (
            <SettingRow label="Points">
              <NumInput value={d.value} min={-500} max={500} step={5} onChange={(v) => setDef(d.id, { value: v })} />
            </SettingRow>
          )}
          {d.enabled && d.type === "units" && (
            <SettingRow label={`Points each (${d.units} in play)`}>
              <NumInput value={d.value} min={-500} max={500} step={5} onChange={(v) => setDef(d.id, { value: v })} />
            </SettingRow>
          )}
          {d.enabled &&
            d.type === "positions" &&
            d.values.map((v, i) => (
              <SettingRow key={i} label={`Place ${i + 1}`}>
                <NumInput
                  value={v}
                  min={-500}
                  max={500}
                  step={5}
                  onChange={(nv) => setDef(d.id, { values: d.values.map((x, j) => (j === i ? nv : x)) })}
                />
              </SettingRow>
            ))}
          {d.enabled && d.type === "totale" && (
            <p className="hint small">All negative games combined in a single hand.</p>
          )}
        </div>
      ))}

      {dup && <p className="warn">Every player needs a different name to start.</p>}
      <button
        type="button"
        className="bigbtn start"
        disabled={!!dup}
        onClick={() =>
          onCreate({
            id: newId(),
            type: "rentz",
            players: names,
            firstChooser,
            config: { games: defs },
            hands: [],
            pending: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        }
      >
        Start game
      </button>
    </div>
  );
}
