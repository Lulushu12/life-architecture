# Breathe app design audit (apps/breathe)

## 1. What it does
Five screens via `view` state (App.jsx:12), no router.
- Home (Home.jsx): stat tiles (computeStats 22-48: sessions this week, day streak, best hold), two mode buttons, full history list of HistoryCards (50-93), delete via native confirm(), empty state (139-141).
- BreathingSetup: steppers rounds 1-10, breaths 3-60, sec/breath 2-6 by 0.5, recovery 5-60s, sound toggle. Saved live (App.jsx:41).
- BreathingSession: state machine breathing -> retention -> recovery -> next (29-56). Pulsing BreathingCircle (155-172), tick per breath, Skip to hold. Retention counts up until "I need to breathe" (endRetention 64-70). Recovery countdown. End session overlay (133-150).
- BreathingEnd: per-round table + best/avg.
- MeditationSetup/Session: presets 5/10/15/20 + stepper 1-120, interval bell 0-30. Countdown w/ pause (pause excluded), bell, gong, end-early overlay. Finishing goes straight Home (App.jsx:108-116), no summary.
Every start creates history entry immediately (App.jsx:49-65, 92-106), complete:false if interrupted.

## 2. Architecture
- One useState(loadStore), write-through (App.jsx:17-19). Store {settings, meditationSettings, history[]} key breathe-v1 (storage.js:6-19). No schema version; load only checks Array.isArray(history) (24-29). soundOn shared across modes.
- Timers: Date.now() polled every 100ms (BreathingSession.jsx:24-27, MeditationSession.jsx:22-25), timestamps in refs, transitions in useEffect on [now, phase]. Robust for elapsed time, not events: hidden tab throttled to 1/s then 1/min => ticks skipped, retention start taken at observation time (line 38 uses Date.now() not computed phase end), bells late by up to a minute, no in-progress state survives reload (view resets).
- Audio (audio.js): Web Audio oscillators; ctx created in start gesture (App.jsx:25-39). tick 880Hz, chime, bell, gong 196+294Hz.
- Wake lock (useWakeLock.js) during breathing and un-paused meditation.
- PWA: sw.js cache-first + revalidate, shell precache only, no update prompt, no pruning. main.jsx:8-14 skips SW in android mode. manifest: purpose "any maskable" combined, no id/shortcuts. index.html viewport-fit=cover but no apple meta.
- Android: Capacitor 6 core only. No @capacitor/app => hardware back closes activity from any screen (chess handles it, apps/chess/src/App.jsx:40-53). No pushState.
- No settings screen.

## 3. UX / visual
560px column, .session-page min-height 100vh (styles.css:385), safe-area bottom only. system-ui, 10.5px stat labels (196), timers up to 58px tabular. Dark only, teal accent #14b8a6. Circle scales via cosine, symmetric, 120ms transition over 100ms poll (steppy). 6s CSS pulse in meditation. No reduced-motion. No toasts/undo/press states (tap highlight transparent => zero tap feedback). No onboarding, no safety info (only hint BreathingSetup.jsx:61-64). A11y: no aria-labels on ← ✕, Toggle no role (ui.jsx:21-27), overlays no role=dialog/focus trap, emoji icons, 38-40px targets, no focus style. No haptics, no notifications.

## 4. Bugs
1. Wake lock never re-acquires after screen off/on: useWakeLock.js:40 guards !lockRef.current but released sentinel remains in ref.
2. Dead "Ended early" summary: abortBreathing (App.jsx:83-89) always goes Home; BreathingEnd.jsx:16, 54 unreachable.
3. Crash on malformed history: HistoryCard reads entry.rounds.length unguarded (Home.jsx:67,70,72).
4. Retention start = observation time (BreathingSession.jsx:38).
5. Backgrounded retention keeps counting => phone call creates fake best hold (Home.jsx:41-45 counts incomplete).
6. Gong inaudible on phone speakers (audio.js:45-46, 196Hz).
7. formatMMSS uses Math.round (ui.jsx:39); countdowns should ceil.
8. No get-ready lead-in (BreathingSession.jsx:33-36).
9. 100vh pushes End button below fold in browser (styles.css:385) -> 100dvh.
10. Hardware back exits mid-session.
11. Dead markup/CSS: .session-top empty spans (BreathingSession.jsx:76-79); .newrow/.field/.flabel/.input/.warn/.rowpair unused (copied from whist).
12. Unbounded history list (Home.jsx:136-138).
13. 50 taps for 60 min meditation stepper (MeditationSetup.jsx:35).
14. Base path triplicated (sw.js, manifest, vite.config).
15. Mixed units in stat tiles; unrounded floats stored.

## 5. Proposals
### Must-do
- Safety gate modal on first launch + persistent one-liner (never near water, seated/lying, stop if dizzy, not a competition). S. new SafetyNotice.jsx, storage.js, BreathingSetup, App.
- Fix wake lock re-acquire. S.
- Interrupt handling: visibilitychange hidden during retention ends hold at hide time and pauses; breathing/recovery pause clock; meditation auto-pause setting. M.
- Crash-safe session resume: persist activeSession on phase change; offer Resume/Discard on load. M.
- Android back + history stack (@capacitor/app, mirror chess). S.
- Backup/restore (copy whist backup.js + BackupPanel). S.
- Get-ready 3-2-1 countdown, distinct tick pitch on last 3 breaths, chime at recovery end and finish. S.
- Haptics via navigator.vibrate (+ @capacitor/haptics). S.
- Error boundary + entry normalization + schemaVersion. S.
- Viewport polish: 100dvh, safe-area-top, reduced-motion, focus-visible, 44px targets. S.
- Meditation completion screen. S.
- Route abortBreathing to BreathingEnd when rounds > 0. S.
### High-value
- Presets Beginner/Standard/Advanced/Custom + duration estimate. S.
- Inhale/exhale coaching labels, asymmetric ratio, ring progress. S-M.
- Retention coaching: last/best under timer, target hold chime, 30s milestone chimes. M.
- Voice guidance via speechSynthesis. M.
- Progress viz: session detail, best-hold trend, 12-week minutes. M.
- Stepper press-and-hold + more presets. S.
- Audio fixes: gong partials, volume slider, audio test button. S.
- Screen-off reliability for meditation: local notifications in APK; Worker tick + silent audio keepalive on web. M-L.
- Countdown ceil. S. Undo snackbar + month grouping. S. "One more round" / Repeat. S. Post-session mood/note. S-M.
- vite-plugin-pwa or cache bump + prune + update toast. M.
- Manifest: split icons, id, shortcuts (?start=), iOS meta. S.
- A11y pass: aria-labels, role=switch, aria-live phase labels, dialog focus. S.
### Nice-to-have
Patterns table (box, 4-7-8, physiological sigh, coherent). M. Weekly goal reminders. M. Ambient noise. M. Share image. M. Light theme, landscape. S-M. Extra stat tiles. S. Round to 0.1s. S.

## 6. Cross-app
- Tokens copy-pasted (breathe/whist/games/calories/ortho/focus same, --accent differs; chess own palette). Shared tokens.css.
- ui.jsx Toggle/SettingRow byte-identical to whist ui.jsx:37-52; NumInput vs Stepper divergent. First 120 lines of styles.css identical.
- sw.js + main.jsx registration differ only by name/path (diff verified). Generate from base.
- Backup UI in whist/calories/ortho/life-architecture; not breathe/focus/games/chess.
- Android back handling only in chess; all others exit-on-back. Shared useAndroidBack hook.
- Audio synth separately in focus and breathe; shared audio.js + haptics helper (also for games chess clock).
- Shared HistoryList/StatTiles + common history entry convention {startedAt, endedAt, complete} would let life-architecture read every app's store.
