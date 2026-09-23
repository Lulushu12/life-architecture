# Life Architecture audit (apps/life-architecture)

CORRECTION: no Firebase. package.json = react, react-dom, Capacitor. Shipped: localStorage + optional GitHub branch sync (data/branchSync.js) + browser-side OpenAI-compatible coach (coach/client.js). PLAN.md/README describe unbuilt Firestore/Cloud Function design. Stray Firestore comments quests.js:56, macros.js:1.

## 1. What it does
Shell: App.jsx single component, page useState("train") (71), no router, refresh lands on Train, Android back exits. Desktop >900px sidebar; mobile topbar Lv/XP chip + 5 tabs Train/Fuel/Coach/Quests/More (54-60). More = Schedule, 5 static Library pages, theme toggle, Sync, BackupPanel. XP card on every page (291-307).
First run: Setup.jsx gates app until sync mode chosen (App.jsx:245-247); default "github" w/ repo Lulushu12/life-architecture, PAT, test connection; collapsible AI Coach (endpoint/model/key). ?demo => local.
Quests (system/quests.js, constants.js): daily {id,title,category,baseXp,streak,lastDone,auto?} 23 defaults (HF 9, Med 5, Trading 5, Hobbies 5); 3 auto (hf_gym, hf_protein, hf_kcal). Long {id,title,category,xp,status,notes} 23 defaults, CRUD via QModal.
XP = sum(completed long xp) + cumulative daily (App.jsx:219-220). Daily award round(baseXp*STREAK_MULT(newStreak)), mult 1/1.5/2/3 at 1/7/14/30. Streak: lastDone===yesterday ? +1 : 1 (169-173), never decays on its own. Uncheck subtracts, sets lastDone="", streak-1 (165-168). Gate advance +50 XP hardcoded (Train.jsx:74, Coach.jsx:71). Levels 7 tiers 0/1000/3000/6000/10000/15000/22000.
Auto quests (180-208): hf_gym on session, hf_protein >=160, hf_kcal 1900-2150; called only from Nutrition persist + coach confirm.
Schedule: SCHEDULE_V2 static 7-day map, blocks w/ 11 types; opens Monday not today (App.jsx:78). PPL rotation + pplOffset on missed.
Train: session/call-day/show-up modes, gym select, 3 set rows MARK/reps/kg/CLEAN/PAIN-FREE; evaluateSession (overloadGate.js:92-105): advance when >=3 sets >=10 clean reps at >= current weight in 2 consecutive sessions; pain on shoulderWork => hard stop drop one increment. Saves wo_{date}, auto hf_gym.
Fuel (Nutrition.jsx): remaining ring, 3 macro rings, 5 slots (meals.js:7-13) w/ quick options + custom; waist/weight w/ "flat across 3" callout.
Coach: any OpenAI-compatible /chat/completions from browser (client.js:136-170), default llama3.1, config plaintext la3_coach. parseLog (kind/confidence/flags, <0.7 refuses) + askCoach (type/protocol_id/action). Context: date, weekday, planned session, macros, lifts, last 10 workouts, PROTOCOLS (10 rules), meal options. No memory, no schedule blocks, no clock time. Coach never writes; confirmProposal merges.
Sync: keys la3_local_user, la3_local_wo_{date}, la3_local_meal_{date}, la3_local_bm_{date}, la3_local_savedAt. buildSnapshot -> PUT base64 data/store.json via Contents API, debounced 2.5s. 409/422 refetch sha retry once, LWW. Pull only at load + after Setup save; remote savedAt newer => wholesale apply.
Backup: textarea/clipboard/download (hidden Android)/restore.
Library (StaticPages.jsx): Identity, Atomic Habits, 6-Month Outputs (mirrors l14/l5/l8/l7), Review Cadence, Principles.

## 2. Architecture
~10 useStates in App. Write-through lsGet/merge/lsSet/schedulePush (146-150). Day-keyed logs, snapshot via full localStorage scan. migrateUserData v8->v2 gated schemaVersion 3.
PWA: sw.js precache 5 root URLs, SWR on all same-origin GET, cache life-architecture-v3.5 bumped by hand. Scope /life-architecture/ encloses all sub-apps. All 8 apps share origin/localStorage/CacheStorage. Capacitor zero plugins.
Failure modes: two devices => stale sha retry overwrites B's day wholesale; applySnapshot never deletes keys (store.js:55-62) => deletions resurrected; no online/visibilitychange pull; failed push no retry. Secrets: PAT (la3_sync) + coach key (la3_coach) plaintext on shared origin where Chess/Games make third-party calls; fine-grained PAT w/ Contents R/W covers main + deploy workflow; Setup.jsx:13 rehydrates token into form. Repo public => health logs committed in clear.

## 3. UX / visual
780px column, 16px radius cards. DM Sans / Space Grotesk / JetBrains Mono self-hosted but loaded via JS-inserted link (App.jsx:17-23) => FOUT. Token set shared.jsx:7-26 w/ light theme, accent #4f8ef7, CAT_COLORS; but many literals (#94a3b8, #334155, #22c55e in Train.jsx:135,173,197; StaticPages; Quests.jsx:89) fail in light. theme-color index.html #12151a vs manifest #060c18, static.
Feedback: 0.2s page fade + ring transitions only. Quest complete = opacity 0.5 + strike. No XP toast, level-up, haptics, sound. Daily loop: open (Train) -> Quests -> Daily chip -> scroll 4 sections -> tap 24px circle; filter not remembered (79); only circle tappable (shared.jsx:328-333). XP card + topbar chip duplicate. Schedule opens Monday.
A11y: div onClick everywhere; outline:none; no reduced-motion; 10.5px tab labels; 2 aria-labels total; viewport lacks viewport-fit=cover => safe-area 0.
No notifications/vibrate/audio.

## 4. Bugs
1. Toggle-twice destroys streak (lastDone="" at 167 => newStreak 1 at 171). hf_kcal auto path (190-199) does this whenever kcal leaves window.
2. XP preview lies (shared.jsx:322-323 uses q.streak, award uses newStreak).
3. hf_gym can never reach 7-day streak (Sunday REST resets); same OR quests d10-d12, Sunday-only d17.
4. Re-saving session double-runs gate (Train.jsx:102 clears todayLog not entries; cleanStreak ++ twice, XP twice; overloadGate.js:77-84, Train.jsx:71-74).
5. Restore silently undone by sync (App.jsx:240-243 keeps old savedAt, no push).
6. lsSet calls touch() even when setItem threw (store.js:19-22).
7. b64encode spreads whole array into String.fromCharCode (branchSync.js:37) => stack overflow at hundreds of KB; >1MB store.json => pullSnapshot null => local overwrites remote (App.jsx:138-139).
8. Every SW deletes every other app's cache (sw.js:27-37, identical in all 8): caches per origin => opening any updated app wipes other 7 offline caches. Root SW scope encloses sub-apps and caches their assets.
9. CLEAN/PAIN-FREE render green before MARK but not toggleable (Train.jsx:156-157); unmarked sets dropped silently (55).
10. Long quest delete one tap no confirm/undo, synced in 2.5s (Quests.jsx:36).
11. Dead code: src/storage.js, weightsRegressing, catalogEntry, AUTO_QUEST_IDS, XP_AWARDS, NON_NEGOTIABLES; XP_AWARDS.liftAdvance unused, 50 hardcoded.
12. index.html:5 PNG favicon typed svg; no apple-touch-icon.
13. Train initial session computed once (Train.jsx:14) ignores pplOffset change.
14. Coach prompt promises schedule slot but context lacks SCHEDULE_V2 blocks + current time.
15. POutputs hardcodes quest ids (StaticPages.jsx:101-106).

## 5. Proposals
### Must-do
- Today view as home (M): planned session one-tap, macro remaining, day's applicable quests as full-row 44px targets grouped by time of day from SCHEDULE_V2; remember last tab + Daily filter.
- Streak model w/ scheduled days + grace (M): per-quest days mask/frequency (Loop model); skipped non-scheduled day preserves; one freeze per 7-day streak or "never miss twice"; fix toggle-twice by restoring previous lastDone; preview uses nextStreak.
- Sync merge instead of snapshot LWW (M): updatedAt per record + tombstones (Calories mergeById best existing); merge per key on pull; pull on visibilitychange + online; push retry w/ backoff; chunked base64; conflict sheet only when same day-key differs.
- Token hygiene (S/M): don't rehydrate PAT; "token saved" + replace; PAT scoped to separate private data repo (e.g. Lulushu12/la-data); default DEFAULT_REPO to that.
- Fix SW cache purge suite-wide (S): filter by per-app prefix; "update available" toast.
- Gate idempotence per day (S): seed entries from todayLog; skip lifts w/ history event dated today or gateAppliedFor.
### High-value
- Completion feedback (S/M): XP toast above tab bar, level-up modal + ring animation, vibrate(10), optional chime, reduced-motion.
- Progression curve (S): ~1,475 XP/day possible at 1x => "Legendary" 22,000 within a month. Geometric 500*1.35^n w/ 30+ tiers or open-ended; per-category levels (Four Pillars: Surgeon/Trader/Builder/Partner) => identity page as live stat sheet.
- Long-quest milestones (M): sub-milestones w/ partial XP + progress bar; due dates (l5 "end of September", today 2026-09-23, no countdown); Pending->Active prompt in weekly review.
- Weekly review flow (M): Sunday checklist: 7-day heatmap, sessions vs planned, gate advances, pain flags, macro hit rate, waist delta, 3 priorities (la3_local_review_{week}); ticks d17.
- Stats/insights (M): per-quest 12-week heatmap, lift sparklines from liftProgress.history, macro adherence bars, waist trend.
- Reminders (M/L): @capacitor/local-notifications from SCHEDULE_V2 times (21:00 phone dock, 21:45 mobility, Tue car keys, Wed 13:20 cap, Sun waist). APK is real target.
- Coach quality (M): inject SCHEDULE_V2 blocks + HH:MM; rolling la3_local_coach_log as memory; cap calls/day + cost counters; auto deload check first open after 21:00; Anthropic path via tiny worker/Cloudflare function so no key in browser; keep Ollama path.
- Backup UX (S): last backup date + 14-day nag; Web Share; fix restore to bump savedAt + push.
- Cross-app ledger (M): shared origin => localStorage shared. Key la_events_v1 array {id, app, type, at, dayKey, value} capped ~2000, appended by Focus (logic.js:75 addPomodoroCompletion), Breathe (App.jsx:63,104), Calories (App.jsx:30,94,128). LA reads on load + storage event + BroadcastChannel("la-events"). Map: focus.pomodoro×N -> trading deep work / learning block; breathe.session -> new Breathwork daily; calories.food totals -> hf_protein/hf_kcal; calories.training -> hf_gym. consumedEvents in la3_local_user. APK: separate origins => ledger web-only; fallback JSON import. Make LA the launcher: "Apps" row linking ./focus/ etc. w/ last-used from each store key.
### Nice-to-have
Avatar tier art + badges (M); quest templates + "skip today" (S); time-blocking timeline w/ now marker + ICS export (S/M); pushState routing (S); Settings page (targets, baseXp, theme, haptics) (M); polish: preload fonts, viewport-fit, dynamic theme-color, 100dvh, tokens for literals, button focus-visible, delete confirm+undo (S each); Android: back, status bar, haptics, androidScheme note for LAN http Ollama mixed content (S).

## 6. Cross-app
LA tokens --bg/--card/--bd/--tx/--mut/--acc (cooler #12151a, only app w/ light theme); siblings --bg/--surface/... navy; Chess warm charcoal; public/downloads.html third palette. Shared packages/ui-tokens w/ light block; LA aliases during migration.
backup.js/BackupPanel near-copies in 5 apps. Ring, MacroBar, callout, chip, tab-bar candidates for packages/ui alongside dayKey/todayKey (LA, Focus, Calories each differ), newId, storage wrapper w/ updatedAt merge. No root package.json/workspaces; add "workspaces": ["apps/*","packages/*"], Vite alias @la/ui, @la/bridge typed ledger writer.
