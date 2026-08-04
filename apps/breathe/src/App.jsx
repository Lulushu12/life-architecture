import { useEffect, useRef, useState } from "react";
import { loadStore, saveStore, newId } from "./storage.js";
import Home from "./Home.jsx";
import BreathingSetup from "./BreathingSetup.jsx";
import BreathingSession from "./BreathingSession.jsx";
import BreathingEnd from "./BreathingEnd.jsx";
import MeditationSetup from "./MeditationSetup.jsx";
import MeditationSession from "./MeditationSession.jsx";

export default function App() {
  const [store, setStore] = useState(loadStore);
  const [view, setView] = useState({ screen: "home" });
  const audioCtxRef = useRef(null);

  // Write-through persistence: every state change hits localStorage
  // immediately, so closing or killing the app never loses a session.
  useEffect(() => {
    saveStore(store);
  }, [store]);

  // Must only ever be *created* inside a user gesture (a start-button click
  // handler) — never at module load — or mobile browsers block audio. Once
  // created, calling this again later (e.g. from a timer tick) just resumes
  // it if needed and is safe outside a gesture.
  function getAudioCtx() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new AC();
      } catch {
        return null;
      }
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }

  const updateSettings = (fn) => setStore((s) => ({ ...s, settings: fn(s.settings) }));
  const updateMeditationSettings = (fn) =>
    setStore((s) => ({ ...s, meditationSettings: fn(s.meditationSettings) }));

  const deleteHistoryEntry = (id) =>
    setStore((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) }));

  // ---- breathing ----
  const startBreathing = (settings) => {
    const id = newId();
    const entry = {
      id,
      type: "breathing",
      startedAt: Date.now(),
      endedAt: null,
      complete: false,
      plannedRounds: settings.rounds,
      breathsPerRound: settings.breathsPerRound,
      secondsPerBreath: settings.secondsPerBreath,
      recoverySeconds: settings.recoverySeconds,
      rounds: [],
    };
    setStore((s) => ({ ...s, history: [entry, ...s.history] }));
    setView({ screen: "breathing-session", id });
  };

  const appendBreathingRound = (id, retentionSeconds) =>
    setStore((s) => ({
      ...s,
      history: s.history.map((h) =>
        h.id === id ? { ...h, rounds: [...h.rounds, { retentionSeconds }] } : h
      ),
    }));

  const finishBreathing = (id) => {
    setStore((s) => ({
      ...s,
      history: s.history.map((h) => (h.id === id ? { ...h, complete: true, endedAt: Date.now() } : h)),
    }));
    setView({ screen: "breathing-end", id });
  };

  const abortBreathing = (id) => {
    setStore((s) => ({
      ...s,
      history: s.history.map((h) => (h.id === id ? { ...h, endedAt: Date.now() } : h)),
    }));
    setView({ screen: "home" });
  };

  // ---- meditation ----
  const startMeditation = (settings) => {
    const id = newId();
    const entry = {
      id,
      type: "meditation",
      startedAt: Date.now(),
      endedAt: null,
      complete: false,
      targetSeconds: settings.durationMinutes * 60,
      bellIntervalMinutes: settings.bellIntervalMinutes,
      actualSeconds: null,
    };
    setStore((s) => ({ ...s, history: [entry, ...s.history] }));
    setView({ screen: "meditation-session", id });
  };

  const finishMeditation = (id, actualSeconds) => {
    setStore((s) => ({
      ...s,
      history: s.history.map((h) =>
        h.id === id ? { ...h, complete: true, endedAt: Date.now(), actualSeconds } : h
      ),
    }));
    setView({ screen: "home" });
  };

  const goHome = () => setView({ screen: "home" });

  if (view.screen === "breathing-setup")
    return (
      <BreathingSetup
        settings={store.settings}
        onChange={updateSettings}
        onCancel={goHome}
        onStart={(settings) => {
          getAudioCtx();
          startBreathing(settings);
        }}
      />
    );

  if (view.screen === "breathing-session") {
    const entry = store.history.find((h) => h.id === view.id);
    if (entry) {
      return (
        <BreathingSession
          entry={entry}
          soundOn={store.settings.soundOn}
          getAudioCtx={getAudioCtx}
          onRoundComplete={(secs) => appendBreathingRound(entry.id, secs)}
          onFinish={() => finishBreathing(entry.id)}
          onAbort={() => abortBreathing(entry.id)}
        />
      );
    }
  }

  if (view.screen === "breathing-end") {
    const entry = store.history.find((h) => h.id === view.id);
    if (entry) return <BreathingEnd entry={entry} onDone={goHome} />;
  }

  if (view.screen === "meditation-setup")
    return (
      <MeditationSetup
        settings={store.meditationSettings}
        soundOn={store.settings.soundOn}
        onSoundChange={(v) => updateSettings((s) => ({ ...s, soundOn: v }))}
        onChange={updateMeditationSettings}
        onCancel={goHome}
        onStart={(settings) => {
          getAudioCtx();
          startMeditation(settings);
        }}
      />
    );

  if (view.screen === "meditation-session") {
    const entry = store.history.find((h) => h.id === view.id);
    if (entry) {
      return (
        <MeditationSession
          entry={entry}
          soundOn={store.settings.soundOn}
          getAudioCtx={getAudioCtx}
          onFinish={(actualSeconds) => finishMeditation(entry.id, actualSeconds)}
        />
      );
    }
  }

  return (
    <Home
      store={store}
      onDelete={deleteHistoryEntry}
      onNewBreathing={() => setView({ screen: "breathing-setup" })}
      onNewMeditation={() => setView({ screen: "meditation-setup" })}
    />
  );
}
