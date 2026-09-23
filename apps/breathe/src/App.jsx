import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dayKey, newId, usePersistentStore, useVisibleDate } from "@shared/store.js";
import { useHistoryNav } from "@shared/useHistoryNav.js";
import { useToast } from "@shared/ui.jsx";
import { registerSw } from "@shared/swRegister.js";
import { audio } from "@shared/audio.js";
import { emitEvent } from "@shared/bridge.js";
import { STORE_KEY, fromBackup, round1, storeDef } from "./storage.js";
import { advance, isHalted, meditationActiveMs, pauseAt, resumeAt, revive, writeHeartbeat } from "./engine.js";
import { computeStats, holdSummary, streakFor, typicalHold } from "./stats.js";
import { askNotifyPermission, clearMeditationNotifications } from "./notifications.js";
import Home from "./Home.jsx";
import BreathingSetup from "./BreathingSetup.jsx";
import BreathingSession from "./BreathingSession.jsx";
import BreathingEnd from "./BreathingEnd.jsx";
import MeditationSetup from "./MeditationSetup.jsx";
import MeditationSession from "./MeditationSession.jsx";
import MeditationEnd from "./MeditationEnd.jsx";
import SafetyNotice from "./SafetyNotice.jsx";
import Modal from "./Modal.jsx";

function readStartParam() {
  try {
    const url = new URL(window.location.href);
    const v = url.searchParams.get("start");
    if (!v) return null;
    url.searchParams.delete("start");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    return v;
  } catch {
    return null;
  }
}

const START_PARAM = readStartParam();
const HOME = { screen: "home" };

function agoLabel(ts) {
  const min = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (min < 1) return "just now";
  return `${min} min ago`;
}

function emitSession(entry, segment) {
  if (!segment) return;
  emitEvent({
    app: "breathe",
    type: "breathe.session",
    dayKey: dayKey(new Date(entry.startedAt)),
    value: segment,
  });
}

function breathingSegment(entry, active, endAt) {
  const fresh = entry.rounds.slice(entry.emittedRounds || 0);
  if (!fresh.length) return null;
  const ms = Math.max(0, endAt - active.startedAt - active.pausedMs);
  return {
    kind: "breathing",
    minutes: round1(ms / 60000),
    rounds: fresh.length,
    bestHold: Math.max(...fresh.map((r) => r.retentionSeconds)),
  };
}

export default function App() {
  const [store, setStore, status] = usePersistentStore(storeDef);
  const { view, nav, back, replace } = useHistoryNav(HOME, { persistKey: "breathe:view" });
  const toast = useToast();
  const today = useVisibleDate();
  const [resumeOffer, setResumeOffer] = useState(null);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const endViewRef = useRef(null);
  const bootRef = useRef(false);
  const pushedRef = useRef(false);

  const active = store.activeSession;
  const activeEntry = active ? store.history.find((h) => h.id === active.id) : null;

  useEffect(() => {
    registerSw({
      onUpdate: (reload) =>
        toast("Update available", { action: { label: "Reload", onClick: reload }, duration: 0 }),
    });
  }, [toast]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") audio.ensure();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const go = useCallback(
    (v) => {
      pushedRef.current = true;
      nav(v);
    },
    [nav]
  );
  const toHome = () => (pushedRef.current ? back() : replace(HOME));

  const setSettings = (fn) => setStore((s) => ({ ...s, settings: fn(s.settings) }));
  const setMedSettings = (fn) => setStore((s) => ({ ...s, meditationSettings: fn(s.meditationSettings) }));

  const patchActive = (fn, at = Date.now()) =>
    setStore((s) => {
      const a = s.activeSession;
      if (!a) return s;
      const next = fn(a, s);
      if (next === a) return s;
      return { ...s, activeSession: { ...next, updatedAt: at } };
    });

  const mapEntry = (s, id, fn) => s.history.map((h) => (h.id === id ? fn(h) : h));

  function newActive(id, mode, now, round = 0, extra = {}) {
    return { id, mode, phase: "getready", round, phaseStartedAt: now, pausedAt: null, pausedMs: 0, bellsRung: 0, startedAt: now, updatedAt: now, ...extra };
  }

  function startBreathing() {
    audio.ensure();
    const st = store.settings;
    const now = Date.now();
    const id = newId();
    const entry = {
      id,
      type: "breathing",
      startedAt: now,
      endedAt: null,
      complete: false,
      plannedRounds: st.rounds,
      breathsPerRound: st.breathsPerRound,
      secondsPerBreath: st.secondsPerBreath,
      recoverySeconds: st.recoverySeconds,
      rounds: [],
    };
    endViewRef.current = null;
    writeHeartbeat(id, now);
    setStore((s) => ({ ...s, history: [entry, ...s.history], activeSession: newActive(id, "breathing", now) }));
    replace({ screen: "session" });
  }

  function oneMoreRound(entry) {
    audio.ensure();
    const now = Date.now();
    endViewRef.current = null;
    writeHeartbeat(entry.id, now);
    setStore((s) => ({
      ...s,
      history: mapEntry(s, entry.id, (h) => ({ ...h, plannedRounds: h.rounds.length + 1, complete: false, endedAt: null })),
      activeSession: newActive(entry.id, "breathing", now, entry.rounds.length),
    }));
    replace({ screen: "session" });
  }

  function startMeditation(ms, fromHome = false) {
    audio.ensure();
    askNotifyPermission();
    const now = Date.now();
    const id = newId();
    const entry = {
      id,
      type: "meditation",
      startedAt: now,
      endedAt: null,
      complete: false,
      targetSeconds: ms.durationMinutes * 60,
      bellIntervalMinutes: ms.bellIntervalMinutes,
      actualSeconds: null,
      bells: 0,
      rounds: [],
    };
    endViewRef.current = null;
    writeHeartbeat(id, now);
    setStore((s) => ({
      ...s,
      history: [entry, ...s.history],
      activeSession: newActive(id, "meditation", now, 0, { autoPause: !!ms.autoPause }),
    }));
    if (fromHome) go({ screen: "session" });
    else replace({ screen: "session" });
  }

  function finishBreathing(endAt) {
    if (!active || !activeEntry) return;
    const segment = breathingSegment(activeEntry, active, endAt);
    endViewRef.current = { screen: "breathing-end", id: active.id };
    setStore((s) => ({
      ...s,
      activeSession: null,
      history: mapEntry(s, active.id, (h) => ({ ...h, complete: true, endedAt: endAt, emittedRounds: h.rounds.length })),
    }));
    emitSession(activeEntry, segment);
  }

  function finishMeditation(activeMs, bells) {
    if (!active || !activeEntry) return;
    clearMeditationNotifications();
    const actualSeconds = Math.round(activeMs / 1000);
    const endAt = Date.now();
    endViewRef.current = { screen: "meditation-end", id: active.id };
    setStore((s) => ({
      ...s,
      activeSession: null,
      history: mapEntry(s, active.id, (h) => ({ ...h, complete: true, endedAt: endAt, actualSeconds, bells })),
    }));
    emitSession(activeEntry, { kind: "meditation", minutes: round1(actualSeconds / 60), rounds: 0, bestHold: null });
  }

  function endSession({ discard = false, at = Date.now() } = {}) {
    const a = store.activeSession;
    if (!a) return;
    const entry = store.history.find((h) => h.id === a.id);
    if (!entry) {
      setStore((s) => ({ ...s, activeSession: null }));
      return;
    }
    if (a.mode === "breathing") {
      const segment = discard ? null : breathingSegment(entry, a, at);
      endViewRef.current = !discard && entry.rounds.length > 0 ? { screen: "breathing-end", id: a.id } : HOME;
      setStore((s) => ({
        ...s,
        activeSession: null,
        history: mapEntry(s, a.id, (h) => ({ ...h, endedAt: at, emittedRounds: h.rounds.length })),
      }));
      emitSession(entry, segment);
      return;
    }
    clearMeditationNotifications();
    const actualSeconds = Math.round(meditationActiveMs(a, entry, at) / 1000);
    if (actualSeconds < 1) {
      endViewRef.current = HOME;
      setStore((s) => ({ ...s, activeSession: null, history: s.history.filter((h) => h.id !== a.id) }));
      return;
    }
    endViewRef.current = discard ? HOME : { screen: "meditation-end", id: a.id };
    setStore((s) => ({
      ...s,
      activeSession: null,
      history: mapEntry(s, a.id, (h) => ({ ...h, endedAt: at, actualSeconds, bells: a.bellsRung })),
    }));
    if (!discard) {
      emitSession(entry, { kind: "meditation", minutes: round1(actualSeconds / 60), rounds: 0, bestHold: null });
    }
  }

  const sessionActions = {
    advance: (now) =>
      patchActive((a, s) => {
        const e = s.history.find((h) => h.id === a.id);
        const r = e && advance(a, e, now);
        return r && !r.finished ? r.active : a;
      }, now),
    hidden: (at) =>
      setStore((s) => {
        const a = s.activeSession;
        if (!a || isHalted(a)) return s;
        if (a.mode === "meditation") {
          const next = a.autoPause ? pauseAt(a, at) : a;
          return { ...s, activeSession: { ...next, updatedAt: at } };
        }
        if (a.phase === "retention") {
          const secs = round1(Math.max(0, at - a.phaseStartedAt) / 1000);
          return {
            ...s,
            history: mapEntry(s, a.id, (h) => ({ ...h, rounds: [...h.rounds, { retentionSeconds: secs, interrupted: true }] })),
            activeSession: { ...a, phase: "held", lastHold: secs, phaseStartedAt: at, updatedAt: at },
          };
        }
        return { ...s, activeSession: { ...pauseAt(a, at), updatedAt: at } };
      }),
    endRetention: (at) =>
      setStore((s) => {
        const a = s.activeSession;
        if (!a || a.phase !== "retention" || a.pausedAt != null) return s;
        const secs = round1(Math.max(0, at - a.phaseStartedAt) / 1000);
        return {
          ...s,
          history: mapEntry(s, a.id, (h) => ({ ...h, rounds: [...h.rounds, { retentionSeconds: secs }] })),
          activeSession: { ...a, phase: "recovery", phaseStartedAt: at, updatedAt: at },
        };
      }),
    skipToHold: () => {
      const now = Date.now();
      patchActive((a) => (a.phase === "breathing" && !isHalted(a) ? { ...a, phase: "retention", phaseStartedAt: now } : a), now);
    },
    continueHeld: () => {
      const now = Date.now();
      patchActive((a) => {
        if (a.phase !== "held") return a;
        const { lastHold, ...rest } = a;
        return { ...rest, phase: "recovery", phaseStartedAt: now, pausedMs: a.pausedMs + Math.max(0, now - a.phaseStartedAt) };
      }, now);
    },
    pause: () => patchActive((a) => pauseAt(a, Date.now())),
    resume: () => patchActive((a) => resumeAt(a, Date.now())),
    abort: () => endSession(),
  };

  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    const a = store.activeSession;
    if (a) {
      const entry = store.history.find((h) => h.id === a.id);
      const r = revive(a, entry, Date.now());
      if (view.screen === "session") replace(HOME);
      if (!r.fresh) {
        endSession({ discard: true, at: r.seen });
        return;
      }
      if (r.active !== a) setStore((s) => ({ ...s, activeSession: r.active }));
      setResumeOffer({ mode: a.mode, seen: r.seen });
      return;
    }
    if (START_PARAM === "breathing") go({ screen: "breathing-setup" });
    else if (START_PARAM === "meditation10") startMeditation({ ...store.meditationSettings, durationMinutes: 10 }, true);
  }, []);

  useEffect(() => {
    if (view.screen === "session" && !active && !resumeOffer) replace(endViewRef.current || HOME);
  }, [view, active, resumeOffer, replace]);

  const stats = useMemo(() => computeStats(store.history, today), [store.history, today]);
  const holds = useMemo(() => holdSummary(store.history), [store.history]);
  const typical = useMemo(() => Math.round(typicalHold(store.history)), [store.history]);

  const deleteEntry = (id) => {
    const entry = store.history.find((h) => h.id === id);
    if (!entry) return;
    setStore((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) }));
    toast.undo(`${entry.type === "breathing" ? "Breathing" : "Meditation"} session deleted`, () =>
      setStore((s) => (s.history.some((h) => h.id === id) ? s : { ...s, history: [...s.history, entry] }))
    );
  };

  const acknowledgeSafety = () => {
    setSettings((s) => ({ ...s, safetyAcknowledged: true }));
    setSafetyOpen(false);
  };

  const banner = !status.ok
    ? "Storage full: changes are not being saved"
    : store._recovered
      ? `Saved data was unreadable and has been reset; the raw copy is under ${STORE_KEY}.corrupt`
      : null;

  let screen = null;
  if (view.screen === "session") {
    if (active && activeEntry && !resumeOffer) {
      screen =
        active.mode === "breathing" ? (
          <BreathingSession
            active={active}
            entry={activeEntry}
            settings={store.settings}
            holds={holds}
            actions={{ ...sessionActions, finish: finishBreathing }}
          />
        ) : (
          <MeditationSession
            active={active}
            entry={activeEntry}
            settings={store.settings}
            actions={{ ...sessionActions, finish: finishMeditation }}
          />
        );
    }
  } else if (view.screen === "breathing-setup") {
    screen = (
      <BreathingSetup
        settings={store.settings}
        onChange={setSettings}
        onBack={toHome}
        onStart={startBreathing}
        onReadSafety={() => setSafetyOpen(true)}
        typicalHold={typical}
      />
    );
  } else if (view.screen === "meditation-setup") {
    screen = (
      <MeditationSetup
        settings={store.meditationSettings}
        cueSettings={store.settings}
        onCueChange={(key, v) => setSettings((s) => ({ ...s, [key]: v }))}
        onChange={setMedSettings}
        onBack={toHome}
        onStart={() => startMeditation(store.meditationSettings)}
      />
    );
  } else if (view.screen === "breathing-end" || view.screen === "meditation-end") {
    const entry = store.history.find((h) => h.id === view.id);
    if (entry && entry.type === "breathing" && view.screen === "breathing-end") {
      screen = <BreathingEnd entry={entry} onDone={() => replace(HOME)} onOneMore={() => oneMoreRound(entry)} />;
    } else if (entry && entry.type === "meditation" && view.screen === "meditation-end") {
      screen = <MeditationEnd entry={entry} streak={streakFor(store.history, today)} onDone={() => replace(HOME)} />;
    }
  }
  if (!screen && view.screen !== "session") {
    screen = (
      <Home
        store={store}
        stats={stats}
        hiddenId={active?.id}
        onDelete={deleteEntry}
        onNewBreathing={() => go({ screen: "breathing-setup" })}
        onNewMeditation={() => go({ screen: "meditation-setup" })}
        onRestore={(obj) => setStore((s) => fromBackup(obj, s))}
        onSafety={() => setSafetyOpen(true)}
      />
    );
  }

  const safetyVisible =
    safetyOpen || (!store.settings.safetyAcknowledged && view.screen !== "session" && !resumeOffer);

  return (
    <>
      {banner && (
        <div className="storage-banner warn" role="alert">
          {banner}
        </div>
      )}
      {screen}
      <SafetyNotice open={safetyVisible} onAcknowledge={acknowledgeSafety} />
      <Modal
        open={!!resumeOffer}
        title="Resume your session?"
        actions={
          <>
            <button
              type="button"
              className="bigbtn"
              onClick={() => {
                audio.ensure();
                setResumeOffer(null);
                go({ screen: "session" });
              }}
            >
              Resume
            </button>
            <button
              type="button"
              className="bigbtn secondary"
              onClick={() => {
                const seen = resumeOffer.seen;
                setResumeOffer(null);
                endSession({ discard: true, at: seen });
              }}
            >
              Discard
            </button>
          </>
        }
      >
        {resumeOffer && (
          <p>
            A {resumeOffer.mode} session was interrupted {agoLabel(resumeOffer.seen)}. Resume where you left off,
            or discard it. Anything already recorded stays in your history.
          </p>
        )}
      </Modal>
    </>
  );
}
