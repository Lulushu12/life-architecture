export const GETREADY_MS = 3000;
export const RESUME_WINDOW_MS = 30 * 60 * 1000;
export const LATE_CUE_MS = 5000;
const HEARTBEAT_KEY = "breathe:heartbeat";

export const cycleMs = (entry) => entry.secondsPerBreath * 1000;
export const breathingMs = (entry) => entry.breathsPerRound * cycleMs(entry);

export function phaseEnd(active, entry) {
  if (active.phase === "getready") return active.phaseStartedAt + GETREADY_MS;
  if (active.mode === "breathing") {
    if (active.phase === "breathing") return active.phaseStartedAt + breathingMs(entry);
    if (active.phase === "recovery") return active.phaseStartedAt + entry.recoverySeconds * 1000;
    return null;
  }
  if (active.phase === "sitting") return active.phaseStartedAt + entry.targetSeconds * 1000;
  return null;
}

export const clockAt = (active, now) => (active.pausedAt != null ? active.pausedAt : now);
export const phaseElapsed = (active, now) => Math.max(0, clockAt(active, now) - active.phaseStartedAt);
export const isHalted = (active) => active.pausedAt != null || active.phase === "held";

export function stateKey(a) {
  return `${a.phase}|${a.round}|${a.phaseStartedAt}|${a.pausedAt}|${a.bellsRung}`;
}

export function advanceBreathing(active, entry, now) {
  if (isHalted(active)) return null;
  let a = active;
  const events = [];
  for (let i = 0; i < 64; i++) {
    const end = phaseEnd(a, entry);
    if (end == null || now < end) break;
    if (a.phase === "getready") {
      a = { ...a, phase: "breathing", phaseStartedAt: end };
      events.push({ type: "breathing", at: end });
    } else if (a.phase === "breathing") {
      a = { ...a, phase: "retention", phaseStartedAt: end };
      events.push({ type: "retention", at: end });
    } else if (a.phase === "recovery") {
      if (a.round + 1 >= entry.plannedRounds) {
        events.push({ type: "finish", at: end });
        return { active: a, events, finished: true, endAt: end };
      }
      a = { ...a, phase: "getready", round: a.round + 1, phaseStartedAt: end };
      events.push({ type: "recoveryEnd", at: end });
    } else break;
  }
  return events.length ? { active: a, events, finished: false } : null;
}

export function advanceMeditation(active, entry, now) {
  if (isHalted(active)) return null;
  let a = active;
  const events = [];
  if (a.phase === "getready") {
    const end = a.phaseStartedAt + GETREADY_MS;
    if (now < end) return null;
    a = { ...a, phase: "sitting", phaseStartedAt: end, bellsRung: 0 };
    events.push({ type: "sitting", at: end });
  }
  const targetMs = entry.targetSeconds * 1000;
  const bellMs = (entry.bellIntervalMinutes || 0) * 60000;
  const elapsed = now - a.phaseStartedAt;
  if (bellMs > 0) {
    const due = Math.floor(Math.min(elapsed, targetMs - 1) / bellMs);
    if (due > a.bellsRung) {
      events.push({ type: "bell", at: a.phaseStartedAt + due * bellMs });
      a = { ...a, bellsRung: due };
    }
  }
  if (elapsed >= targetMs) {
    events.push({ type: "finish", at: a.phaseStartedAt + targetMs });
    return { active: a, events, finished: true, activeMs: targetMs };
  }
  return events.length ? { active: a, events, finished: false } : null;
}

export const advance = (active, entry, now) =>
  active.mode === "breathing" ? advanceBreathing(active, entry, now) : advanceMeditation(active, entry, now);

export function pauseAt(active, at) {
  if (isHalted(active)) return active;
  return { ...active, pausedAt: Math.max(at, active.phaseStartedAt) };
}

export function resumeAt(active, now) {
  if (active.pausedAt == null) return active;
  const shift = Math.max(0, now - active.pausedAt);
  return { ...active, pausedAt: null, phaseStartedAt: active.phaseStartedAt + shift, pausedMs: active.pausedMs + shift };
}

export function meditationActiveMs(active, entry, now) {
  if (active.phase !== "sitting") return 0;
  return Math.min(entry.targetSeconds * 1000, phaseElapsed(active, now));
}

export function writeHeartbeat(id, at = Date.now()) {
  try {
    localStorage.setItem(HEARTBEAT_KEY, JSON.stringify({ id, at }));
  } catch {
    return;
  }
}

export function lastSeen(active) {
  let hb = null;
  try {
    hb = JSON.parse(localStorage.getItem(HEARTBEAT_KEY));
  } catch {
    hb = null;
  }
  const beat = hb && hb.id === active.id && Number.isFinite(hb.at) ? hb.at : 0;
  return Math.max(active.updatedAt || 0, beat);
}

export function revive(active, entry, now) {
  const seen = lastSeen(active);
  if (isHalted(active)) return { active, fresh: now - seen < RESUME_WINDOW_MS, seen };
  if (active.mode === "meditation" && active.phase === "sitting" && !active.autoPause) {
    const endAt = active.phaseStartedAt + entry.targetSeconds * 1000;
    const ref = Math.max(seen, Math.min(now, endAt));
    return { active, fresh: now - ref < RESUME_WINDOW_MS, seen: ref };
  }
  const fresh = now - seen < RESUME_WINDOW_MS;
  if (active.mode === "breathing" && active.phase === "retention") {
    return { active: { ...active, phase: "held", lastHold: null, phaseStartedAt: seen }, fresh, seen };
  }
  return { active: pauseAt(active, seen), fresh, seen };
}
