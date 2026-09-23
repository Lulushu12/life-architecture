# Focus app design audit (apps/focus)

## 1. What it does
Single-page app, four bottom tabs (src/App.jsx:18-23), no router. Sticky banner strip (src/Banners.jsx) above content.

Pomodoro tab (PomodoroTab.jsx): conic-gradient ProgressRing (ui.jsx:40-50), mm:ss, phase label, "N today" counter, Start/Pause/Resume, Skip/Reset. Inline Settings card includes a "Debug unit" min/sec chip (PomodoroTab.jsx:77-90), durations, cadence, auto-start, sound. Notifications card (131-150). Pure transitions in logic.js: startPomodoro(32), pausePomodoro(39), resetPomodoro(46), skipPomodoro(53, no completion logged), advancePomodoroIfDue(67, loops elapsed phases).

Tasks tab: add by name, per-task stopwatch (starting one stops others, logic.js:96-99), archive, tap-to-rename. No delete, estimates, notes, ordering.

Reminders tab: two default interval reminders seeded (storage.js:28-41: Posture 30m, Stand 60m). Due -> pushed to reminders.banners (logic.js:139-151); Done reschedules from now (153-166).

Stats tab: today's pomodoro count + total focus (pomodoro + task minutes, double-counts if both run), per-task-today list, last 7 days bars.

## 2. Architecture
- One useState(loadStore) in App.jsx:32, prop drilled. Store shape storage.js:6-49. All transitions pure (store, now) => store. Good.
- Persistence: key focus-v1, write-through (App.jsx:38-40). loadStore (storage.js:51-61) has no version, no migration, no default-merge (breathe's storage.js:21-35 does merge).
- Timer: absolute timestamps (phaseEndsAt / pausedRemainingMs / startedAt). setInterval 250ms running, 1000ms if reminders, else off (App.jsx:69-73). On mount reconciles (App.jsx:51-60). No visibilitychange handler. No scheduled/local notification: kill/close => no alert at phase end. Task stopwatch splits by local day (storage.js:112-130), reconcileTasksOnLoad (logic.js:112-117) solid.
- Notifications: notify.js:16-30 uses registration.showNotification, relative icon "icon-192.png" (should use BASE_URL). No tag/vibrate/actions/notificationclick. Audio: audio.js synthesized chime, playChime bails if ctx.state !== running (17-18). No navigator.vibrate. No wake lock (breathe has useWakeLock.js).
- SW: public/sw.js cache-first + revalidate, hardcoded /life-architecture/focus/ paths (9-15), fixed cache name focus-v1. Skipped in android mode.
- No routing; tab resets on reload. Notification permission read once into local state (PomodoroTab.jsx:30).
- Android: only INTERNET, no POST_NOTIFICATIONS, no local-notifications plugin; Notification.permission reads denied in WebView.

## 3. UX / visual
560px column, .card 14px radius, bottom tab bar w/ safe-area. system-ui 16px, timer 44px tabular. Shared dark navy palette + orange accent #f97316. Dark only. Ring transition on conic-gradient can't interpolate => steps. No press states, no completion animation, no haptics, no toasts. Empty states OK. No confirm on Reset/Delete/Archive. No onboarding; reminders enabled silently => unrequested posture banner 30min after first open. A11y: Toggle no role/aria; NumInput unlabeled; no aria-current; 29-38px targets; 11px tab labels; no reduced-motion; rename div not focusable.

## 4. Bugs / smells
1. Reset/Skip mid-work loses whole session, no partial credit, no confirm.
2. Chime after background may never play (audio.js:17-18, AudioContext suspended, no resume from tick/visibilitychange).
3. Reminder side-effect race via storeRef (App.jsx:95-100, 43-45) can double-chime.
4. Stale notification permission state (PomodoroTab.jsx:30), permanently "denied" on APK with bad advice.
5. Notification icon relative path (notify.js:22).
6. No store migration; `banners || []` in six places is symptom.
7. Debug toggle in prod UI; sec mode pollutes stats with fractional minutes (logic.js:20).
8. Dead CSS .topbar, h3 (styles.css:53-58, 88-91); sticky banner overlaps title.
9. Rename onBlur UX conflicts with scrolling/other taps.
10. Reminders fire mid-focus; reschedule from dismiss time => drift.
11. last7DayKeys (storage.js:132-136) DST bug.
13. base path hardcoded in vite.config.js:11, sw.js, manifest.
14. No task delete; StatsTab "(deleted task)" unreachable.

## 5. Proposals
### Must-do
- Scheduled local notifications on Android (L): @capacitor/local-notifications, POST_NOTIFICATIONS, schedule at phaseEndsAt/nextDueAt, cancel on pause/reset; web: notificationclick in sw.js.
- visibilitychange catch-up + AudioContext.resume + navigator.vibrate fallback (S). App.jsx, audio.js.
- Wake lock while running (S), copy breathe/useWakeLock.js, settings toggle.
- Store versioning + default-merge (S). storage.js, logic.js.
- Hide Debug unit behind DEV/long-press (S).
- Backup/restore panel (S): reuse whist backup.js + BackupPanel.jsx.
### High-value
- Link task to pomodoro (M): run.taskId, task picker chip, attribute completed phases to task; fixes double count.
- Task estimates/done state/reorder/delete (M).
- Session log logs.sessions[] (M) enabling timeline, interrupted vs completed, export to Life Architecture.
- Weekly + 12-week heatmap insights, hour-of-day histogram (M).
- Streaks + daily goal ring (S).
- Break quality card (20-20-20, stretch, water) + pause reminders during breaks + reschedule from due time (M).
- Reminder quiet rules + snooze (S).
- Phase-end takeover card with Start break / Skip / +5 min, persisted (S).
- Presets 25/5, 50/10, 90/20 (S).
- Settings tab (sound picker, vibration, keep-screen-on, goal, quiet hours, backup) (S).
- Android app shortcuts + manifest shortcuts with ?action= (M).
- Persist last tab; running-timer pill visible on all tabs (S).
### Nice-to-have
Ambience noise (M); distraction log (S); DND deep link (S); light theme + reduced motion (S); a11y pass (S); SVG ring (S); undo toasts (S); SW update prompt w/ build hash (S); tick 1000ms + memo (S); CSV export (S).

## 6. Cross-app
- Design tokens copy-pasted across focus/breathe/calories/games/whist/ortho (same --bg/--surface/... only --accent differs); chess and life-architecture differ. Shared tokens.css + shared .card/.bigbtn/.linkbtn/.stepper/.toggle/.tabbar/.hint.
- storage.js boilerplate duplicated (focus, breathe); shared createStore(key, defaults, migrate).
- Backup UI in whist/calories/chess/life-architecture, not focus/breathe.
- useWakeLock only in breathe.
- Life Architecture quests.js has manual quests (d13 trading deep work, d18 learning block, d9 CME) and AUTO quests from logs (AUTO_QUEST_IDS, hf_gym). Focus session log w/ tag could auto-complete. Same origin on Pages => shared localStorage possible (la3_local_focus_<date> key, scanDates pattern data/logs.js:44-54). On Android separate APKs => separate storage; needs backup/paste or share intent.
