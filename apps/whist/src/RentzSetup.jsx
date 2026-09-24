import { useState } from "react";
import { DEALER_OPTIONS, RENTZ_GAME_DEFS, TOTALE_CANDIDATES, resizePositions } from "./rules.js";
import { newId } from "@shared/store.js";
import { IconButton, NumInput, SettingRow, Toggle } from "@shared/ui.jsx";
import { PlayersEditor, displayNames, duplicateName } from "./ui.jsx";
import { defaultColors, resizeColors } from "./players.js";

export default function RentzSetup({ onCancel, onCreate, recent }) {
  const [players, setPlayers] = useState(["", "", "", ""]);
  const [colors, setColors] = useState(defaultColors(4));
  const [firstChooser, setFirstChooser] = useState(0);
  const [defs, setDefs] = useState(RENTZ_GAME_DEFS(4));
  const [dealer, setDealer] = useState(null);

  const onCountChange = (k) => {
    setPlayers((ps) => {
      const q = [...ps];
      while (q.length < k) q.push("");
      return q.slice(0, k);
    });
    setColors((cs) => resizeColors(cs, k));
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
  const setDef = (id, patch) => setDefs((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const names = displayNames(players);
  const dup = duplicateName(names);
  const enabledCount = defs.filter((d) => d.enabled).length;
  const totale = defs.find((d) => d.type === "totale");
  const members = totale?.enabled ? totale.members || [] : [];
  const emptyTotale = !!totale?.enabled && members.length === 0;
  const toggleMember = (id, on) =>
    setDef("totale", {
      members: on ? TOTALE_CANDIDATES.filter((x) => x === id || members.includes(x)) : members.filter((x) => x !== id),
    });
  const lastNeg = (d) => d.values.length > 1 && d.values[d.values.length - 1] < 0;
  const setLastNeg = (d, on) =>
    setDef(d.id, { values: d.values.map((x, j) => (j === d.values.length - 1 ? (on ? -100 : 0) : x)) });

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

      <PlayersEditor
        players={players}
        setPlayers={setPlayers}
        colors={colors}
        setColors={setColors}
        onCountChange={onCountChange}
        recent={recent}
      />

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

      <div className="field">
        <SettingRow label="Show the dealer" hint="Named in the top bar each hand">
          <Toggle
            label="Show the dealer"
            checked={dealer != null}
            onChange={(v) => setDealer(v ? DEALER_OPTIONS[0][0] : null)}
          />
        </SettingRow>
        {dealer != null && (
          <div className="chips" role="group" aria-label="Who deals">
            {DEALER_OPTIONS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={dealer === id}
                className={"chip" + (dealer === id ? " sel" : "")}
                onClick={() => setDealer(id)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flabel">Mini-games & points</div>
      {defs.map((d) => (
        <div key={d.id} className={"card gamedef" + (d.enabled ? "" : " off")}>
          <div className="gd-head">
            <Toggle label={d.name} checked={d.enabled} onChange={(v) => setDef(d.id, { enabled: v })} />
            <span className="gd-name">{d.name}</span>
          </div>
          {!d.enabled && members.includes(d.id) && <p className="hint small">Played only inside Totale.</p>}
          {(d.enabled || members.includes(d.id)) && d.type === "single" && (
            <SettingRow label="Points">
              <NumInput value={d.value} min={-500} max={500} step={5} onChange={(v) => setDef(d.id, { value: v })} />
            </SettingRow>
          )}
          {(d.enabled || members.includes(d.id)) && d.type === "units" && (
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
          {d.enabled && d.type === "positions" && (
            <SettingRow label="Last place loses points">
              <Toggle label="Last place loses points" checked={lastNeg(d)} onChange={(v) => setLastNeg(d, v)} />
            </SettingRow>
          )}
          {d.enabled && d.type === "totale" && (
            <>
              <p className="hint small">These games are played together in a single hand:</p>
              <div className="checklist">
                {TOTALE_CANDIDATES.map((id) => defs.find((x) => x.id === id))
                  .filter(Boolean)
                  .map((m) => (
                    <label key={m.id} className="checkrow">
                      <input
                        type="checkbox"
                        checked={members.includes(m.id)}
                        onChange={(e) => toggleMember(m.id, e.target.checked)}
                      />
                      <span>{m.name}</span>
                    </label>
                  ))}
              </div>
              {emptyTotale && <p className="warn">Pick at least one game for Totale, or turn Totale off.</p>}
            </>
          )}
        </div>
      ))}

      {dup && <p className="warn">Every player needs a different name to start.</p>}
      <button
        type="button"
        className="bigbtn start"
        disabled={!!dup || emptyTotale || enabledCount === 0}
        onClick={() =>
          onCreate({
            id: newId(),
            type: "rentz",
            players: names,
            colors,
            firstChooser,
            config: dealer ? { games: defs, dealer } : { games: defs },
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
