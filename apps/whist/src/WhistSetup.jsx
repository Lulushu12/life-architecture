import { useState } from "react";
import { WHIST_DEFAULT_CONFIG, whistSequence } from "./rules.js";
import { newId } from "./storage.js";
import { NumInput, Toggle, SettingRow, PlayersEditor } from "./ui.jsx";

export default function WhistSetup({ onCancel, onCreate }) {
  const [players, setPlayers] = useState(["", "", "", ""]);
  const [firstDealer, setFirstDealer] = useState(0);
  const [cfg, setCfg] = useState(WHIST_DEFAULT_CONFIG(4));
  const [countsTouched, setCountsTouched] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const onCountChange = (k) => {
    setPlayers((ps) => {
      const q = [...ps];
      while (q.length < k) q.push("");
      return q.slice(0, k);
    });
    setFirstDealer((d) => Math.min(d, k - 1));
    if (!countsTouched) setCfg((c) => ({ ...c, onesCount: k, eightsCount: k }));
  };
  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));
  const setBlockCount = (k, v) => {
    setCountsTouched(true);
    set(k, v);
  };

  const names = players.map((p, i) => p.trim() || `Player ${i + 1}`);
  const seqLen = whistSequence(cfg).length;

  return (
    <div className="page">
      <div className="topbar">
        <button className="iconbtn" onClick={onCancel}>
          ‹
        </button>
        <div>
          <div className="tb-title">New Whist game</div>
          <div className="tb-sub">{seqLen} rounds</div>
        </div>
      </div>

      <PlayersEditor players={players} setPlayers={setPlayers} onCountChange={onCountChange} />

      <div className="field">
        <div className="flabel">First dealer</div>
        <div className="chips">
          {names.map((p, i) => (
            <button
              key={i}
              className={"chip" + (firstDealer === i ? " sel" : "")}
              onClick={() => setFirstDealer(i)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <button className="linkbtn" onClick={() => setShowRules((s) => !s)}>
        {showRules ? "▾ Hide rules" : "▸ Rules (standard — tap to customize)"}
      </button>
      {showRules && (
        <div className="card rules">
          <div className="flabel">Round order</div>
          <div className="chips">
            <button
              className={"chip" + (cfg.order === "ones" ? " sel" : "")}
              onClick={() => set("order", "ones")}
            >
              1 → 8 → 1
            </button>
            <button
              className={"chip" + (cfg.order === "eights" ? " sel" : "")}
              onClick={() => set("order", "eights")}
            >
              8 → 1 → 8
            </button>
          </div>
          <SettingRow label="Rounds of 1 (per block)">
            <NumInput value={cfg.onesCount} min={0} max={12} onChange={(v) => setBlockCount("onesCount", v)} />
          </SettingRow>
          <SettingRow label="Rounds of 8 (per block)">
            <NumInput value={cfg.eightsCount} min={0} max={12} onChange={(v) => setBlockCount("eightsCount", v)} />
          </SettingRow>
          <SettingRow label="Exact bid: base points">
            <NumInput value={cfg.successBase} min={0} onChange={(v) => set("successBase", v)} />
          </SettingRow>
          <SettingRow label="Exact bid: points per trick">
            <NumInput value={cfg.successPerTrick} min={0} onChange={(v) => set("successPerTrick", v)} />
          </SettingRow>
          <SettingRow label="Missed bid: base penalty">
            <NumInput value={cfg.failBase} min={0} onChange={(v) => set("failBase", v)} />
          </SettingRow>
          <SettingRow label="Missed bid: penalty per trick off">
            <NumInput value={cfg.failPerTrick} min={0} onChange={(v) => set("failPerTrick", v)} />
          </SettingRow>
          <SettingRow label="Streak bonuses">
            <Toggle checked={cfg.streaksEnabled} onChange={(v) => set("streaksEnabled", v)} />
          </SettingRow>
          {cfg.streaksEnabled && (
            <>
              <SettingRow label="Streak length">
                <NumInput value={cfg.streakLen} min={2} max={10} onChange={(v) => set("streakLen", v)} />
              </SettingRow>
              <SettingRow label="Streak bonus (+)">
                <NumInput value={cfg.streakBonus} min={0} step={5} onChange={(v) => set("streakBonus", v)} />
              </SettingRow>
              <SettingRow label="Streak penalty (−)">
                <NumInput value={cfg.streakMalus} min={0} step={5} onChange={(v) => set("streakMalus", v)} />
              </SettingRow>
            </>
          )}
          <SettingRow label="Dealer can't equalize bid sum">
            <Toggle checked={cfg.forbidEqualSum} onChange={(v) => set("forbidEqualSum", v)} />
          </SettingRow>
        </div>
      )}

      <button
        className="bigbtn start"
        onClick={() =>
          onCreate({
            id: newId(),
            type: "whist",
            players: names,
            firstDealer,
            config: cfg,
            rounds: [],
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
