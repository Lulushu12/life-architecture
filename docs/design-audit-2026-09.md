# Life Architecture suite: design audit and implementation plan

Date: 2026-09-23. Scope: all eight apps under `apps/`, every source file read (about 35k lines plus sampled content). Per-app detail reports live next to this file in `audits/` (breathe, calories, chess, focus, games, life-architecture, ortho, whist). Nothing has been built; this is a proposal for approval.

Every claim below marked "verified" I checked in the code myself after the per-app audits came back. Everything else is from the audits and cites file:line so you or another model can verify.

---

## 0. The short version

The suite is in better shape than most personal-app collections: pure state transitions, timestamp-based timers, config snapshots, write-through persistence, and a consistent visual language. The problems are not "the code is bad." They are:

1. **Eight copies of the same infrastructure, and one of those copies has a bug that hurts all eight.** Every service worker deletes every other app's cache on activate (verified). Backup panel, tokens, storage boilerplate, and SW are copy-pasted 5 to 8 times with drift.
2. **Seven of eight apps exit on Android hardware back.** Only Chess handles it. On the APKs this means pressing Back mid-breathing-session, mid-whist-round, or mid-oral-drill kills the app.
3. **Several correctness bugs that silently corrupt data**: Calories logs 4.18x calories on some products (verified), Life Architecture resets a streak to 1 if you un-check and re-check a quest (verified), Chess never grades opening moves (verified), Ortho renders lists as run-on paragraphs in 268 of 538 articles (verified), Whist bricks permanently on a bad import.
4. **Secrets in the wrong place**: GitHub PAT and AI keys in plaintext localStorage on an origin shared by apps that talk to third parties, and the Chess backup export includes the AI key (verified).
5. **Nothing feeds Life Architecture.** It is supposed to be the hub (PLAN.md), but Focus sessions, Breathe sessions, Calories logs and training never reach it. The README even claims Firebase sync that does not exist in the shipped code.

My recommendation on sequencing, and this is where I push back on "improve every app": **do not start with features.** Do a shared-foundation pass first (one week of work, touches every app), fix the verified data-corrupting bugs, then pick features per app. Feature work on top of eight divergent copies of the same boilerplate will make the drift worse.

---

## 1. Urgent, out of band: Ortho and the exam

`apps/ortho/src/tematica.js:7-29` has probe dates 2026-09-24, 2026-09-28, 2026-09-30. Today is 2026-09-23. If those dates are real, the oral drill you'd be using tonight has two problems that matter in the next 24 hours:

- The screen will dim and lock mid-presentation (no wake lock in `PresentDrill.jsx`).
- Tapping any tab in `ConcursTopic.jsx:66-71` bumps `drillKey` and discards a running drill, no confirmation.

Both are S-effort fixes (under an hour each). Also the list-parser bug means every "Fraze-cheie" and indications list in the Concurs topics renders as one paragraph with literal dashes, which is exactly the content you'd be reading tonight.

**Decision for you**: do you want these three fixes now, ahead of the rest of the plan? I'd say yes, and I'd leave everything else in Ortho until after the 30th.

---

## 2. Suite-wide findings (apply to all or most apps)

### 2.1 Critical: service worker cache purge (verified)

Every `apps/*/public/sw.js` does on activate:

```js
caches.keys().then(keys => keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
```

CacheStorage is per origin, and all eight apps share `lulushu12.github.io`. So opening Focus after a Focus deploy wipes the offline caches of the other seven apps, including Chess's 40MB NNUE net. Fix: filter on a per-app prefix (`k.startsWith('focus-') && k !== CACHE_NAME`). S effort, eight files, or one file if the SW becomes shared.

Related in the same files: `CACHE_NAME` is a hand-bumped constant in every app, hashed bundles are cached forever and never pruned, the precache list is shell-only so a stale `index.html` can point at an uncached bundle (Games audit shows this can break the app offline on the second load after a deploy), and Chess's fetch handler starts a network fetch before checking the cache, so it re-downloads the 40MB net on every online engine start.

### 2.2 Android hardware back

Only Chess (`apps/chess/src/App.jsx:40-59`) registers `@capacitor/app` `backButton` and mirrors navigation into `history`. Every other app: hardware back closes the activity from any screen. Same root cause makes browser Back leave the PWA and makes deep links impossible. Fix: a shared `useAndroidBack(nav)` hook plus `pushState` per view. S per app once the hook exists.

### 2.3 Duplicated infrastructure (drift already visible)

| Thing | Copies | Drift observed |
|---|---|---|
| `backup.js` | 5 (whist, calories, ortho, chess, LA) | identical md5; BackupPanel diverged in LA |
| `public/sw.js` | 8 | differ only by name/path, plus Chess's precache list |
| CSS tokens | 6 identical navy + Chess warm + LA cooler w/ different var names | LA has the only light theme |
| `ui.jsx` primitives (Toggle, SettingRow, NumInput/Stepper) | every app | Toggle byte-identical whist/breathe; NumInput vs Stepper are two implementations of the same control |
| `storage.js` load/save | every app | Breathe merges defaults, Focus does not; only Calories has `updatedAt` merge; no app has a schema version |
| `useWakeLock` | Breathe only | needed by Focus, Games clock, Whist, Ortho drill |
| audio synth | Focus, Breathe, Chess | three implementations |
| `todayKey`/`dayKey` | LA, Focus, Calories | three different local-date implementations |

Proposal: `packages/shared/` with `tokens.css`, `sw.js` template (generated from Vite `base`), `backup.js` + `BackupPanel.jsx`, `createStore(key, defaults, migrate)`, `useAndroidBack`, `useWakeLock`, `audio.js` + `haptics.js`, `ConfirmSheet`, `Toast`, `dayKey`. Root `package.json` with `"workspaces": ["apps/*", "packages/*"]`; each app imports via Vite alias. The deploy workflow already builds everything in one job so no CI change beyond `npm ci` at root. Effort: M for the package, then S per app to adopt.

### 2.4 No store versioning or migration anywhere

Every app writes the whole store to one localStorage key and reads it back with at most a top-level shape check. Adding a config field later yields `undefined` on existing installs (Focus already shows the symptom: `banners || []` in six places). A bad import or a corrupted blob either bricks the app (Whist, Breathe) or silently wipes data (Calories, LA). Fix lives in the shared `createStore`: `version` field, default-merge, per-entry normalization, keep the corrupt blob under a recovery key, error boundary with "export then reset".

### 2.5 Secrets

- LA: GitHub fine-grained PAT (`la3_sync`) and coach API key (`la3_coach`) plaintext in localStorage; Setup rehydrates the PAT into the form; the PAT covers Contents R/W on `main` and the deploy workflow; the default target repo is this public repo, so health logs would be committed in the clear (Setup only warns).
- Chess: `settings.ai.apiKey` is serialized into the backup export (`backup.js:13`, verified) and Settings suggests emailing the backup.
- Both share an origin with Games (quote API) and Chess (LLM endpoint).

Fixes: don't rehydrate the PAT; strip keys from exports behind an explicit toggle; scope the PAT to a separate private data repo (e.g. `la-data`) and default `DEFAULT_REPO` to it. S/M.

### 2.6 Interaction quality gaps common to all apps

- Native `confirm()`/`alert()` everywhere (foreign inside a themed WebView). Replace with a shared ConfirmSheet and 5s undo toasts.
- Tap feedback: `-webkit-tap-highlight-color: transparent` set globally but almost no `:active` states, so taps give zero feedback in Breathe, Games, Whist, Calories.
- No `prefers-reduced-motion`, no `:focus-visible`, touch targets 29 to 38px on most icon buttons and steppers (guideline 44px), clickable `div`s without roles, unlabeled icon buttons. One pass in the shared primitives fixes most of it.
- No haptics anywhere except Chess. `navigator.vibrate` works in the Capacitor WebView; it is the only cue that works with eyes closed (Breathe) or sound off.
- No app persists which tab/view was open; every relaunch lands on a default screen.
- `100vh` instead of `100dvh` (Breathe, others); `viewport-fit=cover` missing in LA so safe-area insets resolve to 0.

### 2.7 Notifications

No app schedules a notification that fires when the app is closed. Focus (phase end), Breathe (meditation bell), LA (evening protocol reminders) all need `@capacitor/local-notifications` on the APK. On the web PWA the honest answer is "only while open." This is the single biggest functional gap for Focus and for LA as a habit app.

---

## 3. Verified data-corrupting bugs (fix before any feature work)

| App | Bug | Where | Effort |
|---|---|---|---|
| All | SW deletes other apps' caches | every `public/sw.js` activate handler | S |
| Calories | `energy_100g` (kJ) used as kcal fallback, 4.18x overcount | `src/offc.js:16` | S |
| Calories | Duplicate food record on every OFF pick (no dedupe by barcode) | `src/FoodPicker.jsx:32` | S |
| Calories | "Today" never rolls over after midnight | `src/App.jsx:15-16`, `WeightView.jsx:46` | S |
| LA | Un-check then re-check resets streak to 1; hf_kcal auto path does this whenever kcal leaves the window | `src/App.jsx:165-173, 190-199` | S |
| LA | Re-saving a session runs the overload gate twice (double XP, double cleanStreak) | `Train.jsx:71-74,102`, `overloadGate.js:77-84` | S |
| LA | Restore is undone by sync on next launch (old `savedAt`, no push) | `App.jsx:240-243` | S |
| LA | `b64encode` spreads whole array; will throw on large snapshots; >1MB store.json makes pull return null and local overwrites remote | `branchSync.js:37`, `App.jsx:138-139` | S |
| Chess | Every ply < 20 classified "book" because `findOpening` is longest-prefix and any first move matches | `review.js:90-100` | S |
| Chess | AI key in backup export | `backup.js:13` | S |
| Chess | SW refetches 40MB net every online session, cache grows unbounded | `public/sw.js:48-61` | M |
| Chess | Full-store write-through can exceed localStorage quota with 200 reviewed games; failure swallowed | `storage.js:57-63` | L (IndexedDB) |
| Ortho | Lists glued to a preceding line become paragraphs (268 files); ordered lists restart after nested bullets (49 files) | `markdown.jsx:116-144` | S/M |
| Ortho | Templates (`_`-prefixed) ship as articles | `content.js:63-87` | S |
| Ortho | Positional SRS keys: editing a question reassigns review history | `concurs.js:162` | S/M |
| Whist | Bad import bricks app permanently (no validation, no error boundary) | `Home.jsx:88`, `rules.js:157` | S |
| Breathe | Wake lock never re-acquires after screen off | `useWakeLock.js:40` | S |
| Breathe | Backgrounded retention keeps counting; phone call becomes "best hold" | `BreathingSession.jsx`, `Home.jsx:41-45` | M |
| Breathe | Malformed history entry crashes Home permanently | `Home.jsx:67-72` | S |
| Games | Cancelled sudoku generation still overwrites the kept puzzle | `Sudoku.jsx:40-50, 147-150` | S |
| Focus | Chime never plays after backgrounding (AudioContext suspended, never resumed) | `audio.js:17-18` | S |

---

## 4. Per-app plan

Effort key: S under half a day, M one to three days, L a week or more. Full reasoning and the long tail of ideas are in `audits/<app>.md`.

### 4.1 Life Architecture (hub)

**State**: Habit RPG with 23 daily + 23 long quests, PPL training log with a deterministic overload gate, macro logger, static schedule, OpenAI-compatible coach, GitHub branch sync. No Firebase despite README and PLAN.md. Daily loop costs 2 taps plus scrolling before the first check; lands on Train every launch; no feedback on completion beyond opacity.

**Must-do**
- Today view as home (M): planned session, macro remaining, today's applicable quests as full-row 44px targets grouped by time of day from `SCHEDULE_V2`. Remember last tab.
- Streak model with scheduled days (M): per-quest day mask (hf_gym Mon-Sat, d17 Sunday, OR quests Thu/Fri); one freeze per 7-day streak or "never miss twice". Currently hf_gym can never reach a 7-day streak because Sunday is REST. Fix the toggle-twice bug.
- Sync merge instead of whole-snapshot last-writer-wins (M): `updatedAt` per record + tombstones, pull on `visibilitychange`/`online`, push retry with backoff, chunked base64.
- Token hygiene (S/M): see 2.5.
- Gate idempotence per day (S).

**High-value**
- Completion feedback: XP toast, level-up moment, vibrate, optional chime (S/M).
- Progression curve (S): 23 dailies can yield ~1,475 XP/day at 1x; "Legendary Figure" at 22,000 arrives within a month then the ring says "max" forever. Geometric curve with 30+ tiers, or per-category levels mapped to the Four Pillars.
- Long-quest milestones + due dates (M): l5 is "end of September" and there is no countdown anywhere.
- Weekly review flow (M): Sunday checklist replacing the static Review Cadence page, ticks d17.
- Stats (M): per-quest 12-week heatmap, lift sparklines, macro adherence, waist trend.
- Reminders via local notifications from `SCHEDULE_V2` times (M/L, APK).
- Coach: inject schedule blocks + clock time, rolling directive memory, call caps (M).
- **Cross-app ledger + launcher (M)**: see section 5.

**Nice-to-have**: avatar tiers, "skip today (n/a)" action, time-block timeline with a now marker, settings page for targets/baseXp, light-mode token cleanup (many literal greys fail in light mode).

### 4.2 Focus

**State**: Pomodoro + task stopwatches + interval reminders + 7-day stats. Timer logic is correct (timestamp-based, pure transitions). The APK cannot alert you when a phase ends unless the screen is on and the app is foregrounded.

**Must-do**: scheduled local notifications on Android (L, the one that matters); `visibilitychange` catch-up + AudioContext resume + vibrate fallback (S); wake lock (S); store versioning (S); move the "Debug unit" toggle out of user-facing Settings (S, it pollutes stats with fractional minutes); backup panel (S).

**High-value**: link a task to the pomodoro (M, currently two disconnected systems and Stats double-counts); task estimates/done/reorder/delete (M); session log instead of day aggregates (M, prerequisite for insights and for feeding LA); 12-week heatmap + hour-of-day histogram (M); daily goal + streak (S); break-quality card and pause reminders during breaks (M); phase-end takeover card with "+5 min" (S); presets 25/5, 50/10, 90/20 (S); Settings tab (S); running-timer pill on all tabs (S).

**Nice-to-have**: ambience noise, distraction log, DND deep link, SVG ring, undo toasts, CSV export.

### 4.3 Breathe

**State**: WHM rounds + meditation timer, history, synthesized cues, wake lock. No safety guidance at all. No interrupt handling.

**Must-do**: safety gate on first launch + persistent line (S, this is a legal/ethical baseline every app in the category ships); interrupt handling on `visibilitychange` (M); crash-safe session resume (M); fix wake lock (S); Android back (S); backup (S); 3-2-1 lead-in, distinct last-three-breaths tick, chime at recovery end and finish (S); haptics (S); error boundary + entry normalization (S); `100dvh`, safe-area-top, reduced-motion, 44px targets (S); meditation completion screen (S); make "ended early" summary reachable (S).

**High-value**: presets Beginner/Standard/Advanced + duration estimate (S); inhale/exhale labels with asymmetric ratio (S/M); retention coaching (last/best under timer, target chime) (M); voice guidance via `speechSynthesis` (M); best-hold trend + 12-week minutes chart (M); stepper press-and-hold (S); gong audible on phone speakers (S, current 196Hz fundamental is below phone speaker rolloff); screen-off reliability for meditation bells via local notifications (M-L); undo snackbar + month grouping (S); post-session mood (S-M).

**Nice-to-have**: pattern table (box, 4-7-8, physiological sigh), ambient noise, share image.

### 4.4 Calories

**State**: OFF-backed food log, custom foods, training log, weight trend, targets, backup. Overlaps with LA's Fuel/Train views with no shared schema.

**Must-do**: kJ fix, barcode dedupe, midnight rollover, piece-food stepper, text-mode NumInput (you cannot clear the weight field; typing "7" becomes 20 then "205"), Android back, hide camera where it cannot work (APK has no CAMERA permission), surface storage failures, focus styles + semantic buttons. All S except back (M).

**High-value**: remember last portion per food (S); unified search box, local instant + OFF after debounce (M); frequent/favourites (S); copy yesterday / copy meal (S); quick-add macros (S); meal templates seeded from LA `meals.js` OPTIONS (M); richer OFF fields + `cc=ro&lc=ro` + P/C/F on result rows + "macros incomplete" flag (M); weight EMA trend (S); adaptive TDEE from intake + EMA weight change, MacroFactor-style (M); weekly dashboard (M); training ergonomics: set checkmarks, RPE, prefill from last session, rest timer, e1RM + PR badge (M); undo toasts (S).

**Nice-to-have**: fiber/sugar/salt, water counter, CSV export, storage compaction + IndexedDB later, CAMERA permission trade-off, voice entry.

**Decision for you** (section 6): Calories vs LA Fuel/Train is a real fork.

### 4.5 Games

**State**: chess clock, sudoku, cryptograms. Clock timing model is correct. Sudoku generator runs on the main thread and "Hard" rarely reaches its advertised clue count.

**Must-do**: wake lock (S, a chess clock that lets the screen lock is unusable); precache bundle + cache versioning (S/M); cancelled-generation race (S); Android back + URL nav + persist view (M); low-time warnings + sound/haptics (M, copy Chess `audio.js`); move corner buttons out of the clock tap zones, 44px, `onPointerDown` (S).

**High-value**: clock presets memory, Bronstein/US delay, asymmetric time, move counter, landscape layout (M); sudoku notes ergonomics: auto-remove peer marks, auto-candidates, peer highlight, digit counts, undo, pause, keyboard, mistakes vs conflicts (M); sudoku generation in a Web Worker with retry + technique grading + pre-generation (M/L); **daily puzzles with a seeded RNG for both sudoku and cryptogram + streaks + calendar** (M, the biggest retention lever, cheap once RNG is injectable); cryptogram auto-advance, keys always enabled, bigger cells, frequency strip, undo (M); fetch timeout + `source:"web"` + offline shuffle + bigger bundled corpus (S/M); stats/history per game (M); pressed/focus states + roles (S).

**Nice-to-have**: settings screen, SVG icons on Home, more games (Wordle-style daily word, Nonogram, Killer Sudoku all reuse existing infrastructure; avoid anything needing a server).

**Do not** merge Games into Chess: Games is tiny and offline-first; Chess ships 80MB. Extract a shared clock module and cross-link instead.

### 4.6 Whist

**State**: the reference pattern app. Scoring rules verified against standard Romanian Whist/Rentz: nothing arithmetically wrong. Scoreboard numbers are too small to read across a table (bid 10.5px, cumulative 14px).

**Must-do**: schema-validate imports + error boundary (S); Android back + persist view (S); recent players + "play again" with rotated dealer (S/M); explain constrained numbers and auto-commit the forced last tricks value (S); legible scoreboard: 17-18px cumulative, 20px totals with rank badges, sticky-left column (S); 44px targets + aria (S); versioned SW (S).

**High-value**: round-complete toast + vibrate (S); landscape/table mode with big totals (M); fast Rentz units entry with tap-to-increment chips and "rest to X" (M); stats screen (M); share results via `navigator.share` + canvas PNG (M); rule variants: `streakSkipOnes`, Totale membership, negative last place, enforce `forbidEqualSum` in the editor (S each); in-game rename, duplicate-name guard (S); undo toast with redo (S); history grouping (S).

**Nice-to-have**: per-player colours, wake lock, RO/EN toggle, 7-8 player double deck, custom confirm sheet.

### 4.7 Ortho

**State**: 538 Markdown files (7.8MB) inlined into the entry chunk, hand-rolled Markdown renderer with the list bug, substring search that re-scans the whole corpus per keystroke, SM-2 SRS with positional keys, timed oral drill. The exam-prep UX is the strongest part of the suite.

**Must-do**: fix the block parser (S/M, fixes 300+ files at once, add a parser test); skip `_` templates (S); history + back + scroll restore + deep links (M); prebuilt search index with diacritic folding + debounce + include Concurs topics (S/M); stable SRS keys by question hash + migration (S/M); wake lock in the drill (S); editor dirty guard + autosave (S).

**High-value**: monograph reading mode: TOC sheet, sticky current-H2 header, collapsible sections, remembered scroll (M); font-size setting + table "cards" toggle for 5+ columns + sticky first column (M); real cross-links from the "Full context" trailer and backlinks (M); keep and show `updated:` so the monthly evidence sweep is visible (S); daily review queue + retention stats + 7-day forecast (M); 83-cell coverage heatmap + weak-area drill (S/M); oral drill: vibrate over target, pause, optional audio recording to IndexedDB, rubric from Fraze-cheie (M/L); exam-day mode (S); authoring export as `.md` with frontmatter (S/M); lazy-load reference categories so the entry chunk drops from ~8MB (M/L).

**Do not** bother with FSRS now; with the 7-day interval cap and the exam this week it changes nothing. Revisit after the 30th if the app becomes a long-term quiz.

### 4.8 Chess

**State**: the most complete app. Engine wrapper, bot model, review, analysis, puzzles, lessons, pro games, openings. Board is tap-tap only; no drag, no premove, no PGN export.

**Must-do**: book classification fix (S); SW rewrite for large assets with progress ("12 of 40MB") and cache-only for `/engine/*` (M); IndexedDB for games/reviews with per-record writes + persistent warning on failure (L, but it is the difference between keeping data and not); stop engine on `visibilitychange` and screen leave, debounce scrub searches (S); strip API key from exports (S); pass the chosen banter event to the LLM and send last 10 plies instead of full PGN (S).

**High-value**: drag-to-move + premove (M, the largest gap vs chess.com/lichess mobile); PGN/FEN copy + share (S); lichess/chess.com import by username + batch review (M); review upgrades: great/miss/forced, phase-split accuracy, key moments, "retry the move" (M); adaptive puzzle serving + puzzle rating + Puzzle Rush/Streak (M); SRS for missed puzzles + accept engine-equivalent moves in the blunder trainer (M); opening repertoire drill from explorer data (M); persona style weights via multipv re-weighting + rating drift (M); banter timing (queue until move lands, one per 2 plies, mute) (S); clocks in bot games reusing the Games clock module (M); landscape/tablet (S); sheets instead of `alert/confirm` + draw offers (S); stats screen with performance-rating estimate (M).

**Nice-to-have**: code splitting (Lessons, GamesDB, Openings, persona packs, piece sets), hash routing, exclude `games/ev` from the APK to halve it, onboarding, endgame trainer, lesson progression, accessibility pass, settings tabs + battery saver, batch review.

---

## 5. Cross-app data: making Life Architecture the hub

Mechanism (verified feasible): on GitHub Pages all eight apps share one origin, so localStorage is already shared. Not true across the eight separate APKs.

- Define `la_events_v1`: an append-only array of `{ id, app, type, at, dayKey, value }` capped at ~2,000 entries, written by a tiny shared `@la/bridge` module.
- Writers: Focus on `addPomodoroCompletion` (`logic.js:75`), Breathe on history push (`App.jsx:63,104`), Calories on food/training/weight writes (`App.jsx:30,94,128`), Games/Chess optionally on game complete.
- Reader: LA on load, on `storage` events (fires cross-tab, so an open LA tab updates live), and via `BroadcastChannel("la-events")`.
- Mapping: `focus.pomodoro × N` → d13 "Trading deep work" / d18 "Learning block"; `breathe.session` → new "Breathwork" daily; `calories.food` totals → hf_protein/hf_kcal; `calories.training` → hf_gym. Consumed ids tracked in `la3_local_user`.
- APK fallback: the existing JSON backup import, or a share intent later.
- Launcher: an "Apps" row on LA's Today/More linking `./focus/` etc. with last-used timestamps read from each app's store key. This is the "page with all my apps" that does not exist today.

Prerequisite: Focus needs a session log (not just day aggregates) for the mapping to carry a task/category.

---

## 6. Decisions I need from you (and where I disagree with the current direction)

1. **Ortho first, this week?** See section 1. I'd do the three drill fixes now and freeze the rest of Ortho until after the 30th.

2. **Calories vs Life Architecture Fuel/Train.** Right now the same day can be logged in two apps with no reconciliation, and LA's auto quests can only be driven by LA's own thin logger. Pick one: (a) Calories becomes the food/weight source of truth and LA's Fuel becomes a protocol layer reading Calories totals (my recommendation; Calories has the better data model), or (b) drop Calories' training tab and keep LA as the home of the overload gate. Doing neither means both keep growing apart.

3. **The GitHub PAT sync design.** No, storing a repo-wide write token in a browser on a shared origin and pushing health logs to a public repo is not acceptable as the default. Either a separate private data repo with a token scoped to it, or drop GitHub sync in favour of the backup/import path until a proper backend exists. PLAN.md's Firebase + Cloud Function design was never built; the README says it was. Decide whether that plan is still alive or should be deleted.

4. **Shared package or keep copying?** The README's convention is "copy `apps/whist`". Eight copies have already drifted and one shared bug (SW purge) exists in all of them. I recommend `packages/shared` with workspaces. Cost: one M task plus S per app. If you say no, the SW fix still has to land in eight files.

5. **Chess storage migration (L).** It is the one genuinely large item. Worth it only if you actually keep 100+ reviewed games. If you play a few games a week and review them, a cap of 50 games + a visible warning is a cheaper S alternative. Tell me which.

6. **CAMERA permission for Calories.** The README's zero-permission stance means barcode scanning is manual entry only on the APK. Adding CAMERA makes the existing scanner code work. Your call on the trade-off.

7. **Notifications on the APK** need `@capacitor/local-notifications` + `POST_NOTIFICATIONS`, which changes the "INTERNET only" claim in the README for Focus, Breathe and LA. Say yes or no; without it Focus stays a foreground-only timer.

Things I would cut from the audits' long lists if you asked me to trim: light themes (dark-only is fine for personal apps, LA already has one), avatar art, more Games titles, FSRS, share-as-image, voice guidance in Breathe (nice, but `speechSynthesis` voices on Android are inconsistent), Firebase sync for Ortho.

---

## 7. Proposed build order (waves), pending your approval

**Wave 0: Ortho exam fixes** (same day). Wake lock in drill, drill-discard guard, list parser. Deploy.

**Wave 1: Shared foundation** (about a week). `packages/shared` with tokens, SW template with prefixed cache names + versioning + precache + update toast, backup panel, `createStore` with versioning and error boundary, `useAndroidBack`, `useWakeLock`, audio/haptics, ConfirmSheet, Toast, `dayKey`. Adopt in all eight apps. Deploy.

**Wave 2: Verified bug fixes** (2 to 3 days). Everything in section 3 except the Chess IndexedDB item. Deploy.

**Wave 3: Per-app must-dos** (1 to 2 weeks). Focus notifications, Breathe safety + interrupts + resume, Calories logging fixes, Games clock/sudoku fixes, Whist import/back/legibility, LA Today view + streak model + sync merge + token hygiene, Chess SW + engine background stop.

**Wave 4: Cross-app ledger + LA launcher** (3 to 5 days). Focus session log, `@la/bridge`, LA reader + quest mapping, Apps row.

**Wave 5: High-value features, one app at a time**, in whatever order you care about most. My suggested order: LA (feedback, curve, milestones, review, stats) → Focus (task link, insights) → Chess (drag/premove, PGN export, review upgrades) → Calories (unified search, templates, TDEE) → Breathe (presets, coaching, charts) → Games (daily puzzles, sudoku worker) → Whist (table mode, stats) → Ortho reading mode after the exam.

Each wave is a separate approval. Nothing starts until you say which wave, and each wave gets its own concrete task list with files before I touch code.
