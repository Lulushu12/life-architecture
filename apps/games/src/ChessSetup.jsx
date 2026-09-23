import { useState } from "react";
import { IconButton, NumInput, SettingRow, Toggle, useToast } from "@shared/ui.jsx";
import { audio } from "@shared/audio.js";
import { BONUS_LABELS, DELAY_MODES, PRESETS, controlLabel, normalizeControl, sameControl } from "./chessClock.js";

const BONUS_HINTS = {
  none: "No time added.",
  fischer: "Seconds added after every move.",
  bronstein: "Time used is refunded after each move, up to the delay.",
  simple: "The clock waits this long before counting down each move.",
};

export default function ChessSetup({ prefs, native, onPrefs, onStart, onCancel, isFavourite }) {
  const toast = useToast();
  const [custom, setCustom] = useState(
    () =>
      !!prefs.last &&
      sameControl(prefs.last, prefs.lastCustom) &&
      !PRESETS.some((p) => sameControl(p, prefs.last)) &&
      !prefs.favourites.some((f) => sameControl(f, prefs.last))
  );
  const [draft, setDraft] = useState(() => normalizeControl(prefs.lastCustom));
  const [picked, setPicked] = useState(() => normalizeControl(prefs.last || PRESETS[3]));
  const [editFav, setEditFav] = useState(false);

  const selected = custom ? normalizeControl(draft) : picked;

  const choose = (c) => {
    setCustom(false);
    setPicked(normalizeControl(c));
  };

  const editDraft = (patch) => {
    setCustom(true);
    setDraft((d) => {
      const n = { ...d, ...patch };
      if (n.bonus !== "none" && !n.bonusSec) n.bonusSec = 2;
      return n;
    });
  };

  const saveFavourite = () => {
    if (isFavourite(selected)) return;
    onPrefs((p) => ({ ...p, favourites: [...p.favourites, selected] }));
    toast(`${controlLabel(selected)} saved to favourites`);
  };

  const removeFavourite = (c, index) => {
    onPrefs((p) => ({ ...p, favourites: p.favourites.filter((f) => !sameControl(f, c)) }));
    toast.undo(`${controlLabel(c)} removed`, () =>
      onPrefs((p) => {
        if (p.favourites.some((f) => sameControl(f, c))) return p;
        const favourites = [...p.favourites];
        favourites.splice(Math.min(index, favourites.length), 0, c);
        return { ...p, favourites };
      })
    );
  };

  const start = () => {
    audio.ensure();
    onStart(selected, { custom });
  };

  const draftBonus = draft.bonus;

  return (
    <div className="page">
      <div className="topbar">
        <IconButton label="Back" onClick={onCancel}>
          ←
        </IconButton>
        <div>
          <div className="tb-title">Chess Clock</div>
          <div className="tb-sub">Choose a time control</div>
        </div>
      </div>

      {prefs.favourites.length > 0 && (
        <div className="field">
          <div className="flabel-row">
            <div className="flabel">Favourites</div>
            <button type="button" className="linkbtn" onClick={() => setEditFav((v) => !v)}>
              {editFav ? "Done" : "Edit"}
            </button>
          </div>
          <div className="chips">
            {prefs.favourites.map((f, i) =>
              editFav ? (
                <button
                  type="button"
                  key={controlLabel(f)}
                  className="chip fav-remove"
                  onClick={() => removeFavourite(f, i)}
                  aria-label={`Remove ${controlLabel(f)} from favourites`}
                >
                  ✕ {controlLabel(f)}
                </button>
              ) : (
                <button
                  type="button"
                  key={controlLabel(f)}
                  className={`chip ${!custom && sameControl(picked, f) ? "sel" : ""}`}
                  onClick={() => choose(f)}
                  aria-pressed={!custom && sameControl(picked, f)}
                >
                  ★ {controlLabel(f)}
                </button>
              )
            )}
          </div>
        </div>
      )}

      <div className="field">
        <div className="flabel">Presets</div>
        <div className="chips">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={controlLabel(p)}
              className={`chip ${!custom && sameControl(picked, p) ? "sel" : ""}`}
              onClick={() => choose(p)}
              aria-pressed={!custom && sameControl(picked, p)}
            >
              {controlLabel(p)}
            </button>
          ))}
          <button
            type="button"
            className={`chip ${custom ? "sel" : ""}`}
            onClick={() => setCustom(true)}
            aria-pressed={custom}
          >
            Custom {controlLabel(draft)}
          </button>
        </div>
      </div>

      {custom && (
        <div className="card">
          <SettingRow label="Minutes per side">
            <NumInput
              value={draft.minutes}
              min={1}
              max={180}
              step={1}
              label="Minutes per side"
              onChange={(v) => editDraft({ minutes: v })}
            />
          </SettingRow>
          <div className="flabel">Bonus</div>
          <div className="chips">
            {DELAY_MODES.map((m) => (
              <button
                type="button"
                key={m}
                className={`chip ${draftBonus === m ? "sel" : ""}`}
                onClick={() => editDraft({ bonus: m })}
                aria-pressed={draftBonus === m}
              >
                {BONUS_LABELS[m]}
              </button>
            ))}
          </div>
          <p className="hint small">{BONUS_HINTS[draftBonus]}</p>
          {draftBonus !== "none" && (
            <SettingRow label="Seconds">
              <NumInput
                value={draft.bonusSec}
                min={1}
                max={120}
                step={1}
                label="Bonus seconds"
                onChange={(v) => editDraft({ bonusSec: v })}
              />
            </SettingRow>
          )}
        </div>
      )}

      <div className="card">
        <SettingRow label="Sounds" hint="Tap clicks, low-time beeps, flag alarm">
          <Toggle label="Sounds" checked={prefs.sound} onChange={(v) => onPrefs((p) => ({ ...p, sound: v }))} />
        </SettingRow>
        <SettingRow label="Vibration">
          <Toggle label="Vibration" checked={prefs.vibrate} onChange={(v) => onPrefs((p) => ({ ...p, vibrate: v }))} />
        </SettingRow>
      </div>

      <div className="setup-actions">
        <button type="button" className="linkbtn" onClick={saveFavourite} disabled={isFavourite(selected)}>
          {isFavourite(selected) ? `★ ${controlLabel(selected)} is a favourite` : `☆ Save ${controlLabel(selected)} as favourite`}
        </button>
      </div>

      <button type="button" className="bigbtn start" onClick={start}>
        Start {controlLabel(selected)}
      </button>

      {!native && (
        <p className="hint small center">
          <a className="linkbtn" href="../chess/">
            Open full Chess app
          </a>
        </p>
      )}
    </div>
  );
}
