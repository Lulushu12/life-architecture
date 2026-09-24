import { useEffect, useRef, useState } from "react";
import { audio } from "@shared/audio.js";
import { SettingRow, Toggle } from "@shared/ui.jsx";
import { TEST_SEQUENCE, gainFor, playSound } from "./sounds.js";
import { cancelVoice, speak, voiceAvailable, voiceSupported } from "./voice.js";

export function TestSoundsButton({ volume }) {
  const [playing, setPlaying] = useState(null);
  const timers = useRef([]);

  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => stop, []);

  const run = () => {
    audio.ensure();
    stop();
    for (const s of TEST_SEQUENCE) {
      timers.current.push(
        setTimeout(() => {
          setPlaying(s);
          playSound(s.name, volume);
        }, s.at)
      );
    }
    const last = TEST_SEQUENCE[TEST_SEQUENCE.length - 1];
    timers.current.push(setTimeout(() => setPlaying(null), last.at + 2400));
  };

  return (
    <div className="testsounds">
      <button type="button" className="bigbtn secondary" onClick={run} disabled={!!playing}>
        {playing ? `${playing.label}: ${playing.note}` : "Test sounds"}
      </button>
      {volume === 0 && <p className="hint small">Volume is at 0, so nothing will play.</p>}
    </div>
  );
}

export function VolumeRow({ value, onChange }) {
  const preview = () => {
    audio.ensure();
    playSound("chime", value);
  };
  return (
    <div className="volrow">
      <label className="setlabel" htmlFor="breathe-volume">
        Volume <span className="volval">{value}%</span>
      </label>
      <input
        id="breathe-volume"
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={preview}
        onKeyUp={preview}
      />
    </div>
  );
}

export function VoiceRow({ settings, onChange }) {
  if (!voiceSupported()) {
    return (
      <SettingRow label="Voice guidance" hint="Not available on this device">
        <span className="hint small">Off</span>
      </SettingRow>
    );
  }
  const toggle = (v) => {
    onChange(v);
    if (v) speak("Breathe in", { volume: Math.sqrt(gainFor(settings.volume)) });
    else cancelVoice();
  };
  return (
    <SettingRow
      label="Voice guidance"
      hint={voiceAvailable() ? "Spoken cues for each phase" : "No voice installed, sounds are used instead"}
    >
      <Toggle checked={!!settings.voiceOn} onChange={toggle} label="Voice guidance" />
    </SettingRow>
  );
}
