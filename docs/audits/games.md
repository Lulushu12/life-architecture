# Games app audit (apps/games): Chess Clock, Sudoku, Cryptogram

## 1. What it does
Shell: App.jsx single useState(loadStore) (13), view object {screen: home|chess|sudoku|crypto-list|crypto-play, id} (14), if-chain render (74-134). Home.jsx three GameCards with derived subtitle + Resume/Play.
Chess clock: ChessSetup.jsx six presets (1+0,3+0,3+2,5+0,10+0,15+10) + Custom steppers. freshClock (12-28): timeLeft[ms,ms], started, paused, activeSide, turnStartedAt, flagged. ChessClock.jsx full-viewport fixed, top zone rotated 180, mid bar Pause/Resume/preset/Reset, two 38px corner buttons INSIDE tap zones. tap(side) 55-74 correct physical semantics; Fischer inc on release (71). Flag => danger + paused. Native confirm() for reset/new.
Sudoku: SudokuSetup (30-72) Easy 40/Medium 32/Hard 26 clues (sudokuGen.js:108-112), spinner. freshSudoku stores givens/solution/entries/pencil[81][]/selected/mode/showErrors/startedAt/solved/clueCount. Grid of divs, pencil 3x3, toolbar Pencil/Errors/Erase, digit pad. Win deep-equals solution. Elapsed Date.now()-startedAt, no pause.
Cryptogram: 40 bundled (cryptogramPuzzles.js p01-p40). List with importer (Quote | Author) and "Fetch 10 quotes" (DummyJSON, ZenQuotes fallback). randomDerangement (cryptogram.js:14-20). Play: tap cipher cell selects all instances, tap key; conflicts gold; Check marks wrong red; Hint; Clear letter.

## 2. Architecture
- Key games-v1, loadStore shallow merge, no versioning. saveStore on every change (whole store incl. 81-cell arrays); fine. view not persisted. No storage event listener. Stale comments storage.js:8-11.
- Sudoku gen: generateFullSolution backtracking (35-48); generatePuzzleAsync (82-106) single pass removal keeping unique (countSolutions MRV 51-77), MAIN THREAD, setTimeout(0) every 5 attempts => 50-150ms blocks on phone. onProgress never passed. Single pass => Hard rarely reaches 26 (floor 27-32); actual clueCount stored, never shown. Clue count not a difficulty metric. Not cancellable, Math.random => no seeded daily.
- Clock timing: correct, remainingMs pure function of persisted timeLeft + turnStartedAt (9-16); 100ms interval only re-renders + flag detection, no drift. Runs while backgrounded (like physical clock). fmtTime uses floor (21) vs chess app ceil; under 20s switches to tenths without "0:" => width jump.
- Crypto fetch: no timeout/AbortController; ZenQuotes rate-limited, CORS unverified. Fetched stored custom:true => shown as "yours", deletable, bypass attribution policy.
- PWA: sw.js cache-first, shell precache only, constant CACHE_NAME => after deploy, offline load 2 can break app (43-56). No update prompt. Manifest portrait-primary locks landscape. No apple-touch-icon/id/shortcuts.
- Android: no @capacitor/app => hardware back exits. No haptics/keepawake. 
- No routing/pushState/deep links.

## 3. UX / visual
Dark only, purple accent #a855f7. Clock digits clamp(52px,17vw,130px) tabular, good. Cipher letters 9.5px (styles.css:537), pencil marks 7px (431): primary info too small. Only .numbtn:active has pressed state; no focus-visible, no reduced-motion, no sound/haptics. No low-time warning beyond tenths. A11y: clickable divs everywhere (Home.jsx:7, CryptogramList.jsx:150, Sudoku.jsx:209, ChessClock.jsx:126,140) no role/tabIndex/keys. Targets 38px, crypto cells 26px. Corner buttons inside tap zones => accidental confirm mid-bullet. No landscape; mid bar not mirrored for top player. No wake lock. Native confirm() everywhere. No overscroll-behavior => pull-to-refresh on top zone.

## 4. Bugs
1. Cancelled generation still replaces puzzle (Sudoku.jsx:40-41, 47-50, 147-150).
2. Offline breakage after deploy (sw.js:7, 43-56).
3. "N letters" is char count (CryptogramList.jsx:153; letterCount unused).
4. Home vs list counts disagree (Home.jsx:33-38 vs CryptogramList.jsx:69).
5. Fetched quotes labelled "yours" (App.jsx:48-58).
6. Hard rarely 26 clues, count hidden.
7. Timer never pauses; huge elapsed after a day.
8. Android back exits.
9. Given cells turn red on conflict (sudokuGen.js:138).
10. Dead conditional select (Sudoku.jsx:88-94); entries map = slice (10).
11. fmtTime floor + width jump (ChessClock.jsx:18-25).
12. Crypto keyboard disabled until selection => 35% opacity keyboard on open (CryptogramPlay.jsx:137).
13. onProgress dead (sudokuGen.js:82).
14. Effect deps on onChange restarts interval every store write (ChessClock.jsx:50).
15. Stale comments; Home imports fmtElapsed from Sudoku component.
16. No overscroll-behavior-y: none.

## 5. Proposals
### Must-do
- Screen wake lock during clock/puzzles (S).
- vite-plugin-pwa / precache bundle + cache bump + update toast (S/M).
- Fix cancelled-generation race + cancellable token (S).
- Android back + URL-backed nav + persist view + deep links for shortcuts (M).
- Low-time warnings + sound/haptics (amber <20s, beep <10s, buzz on flag, tap click); copy apps/chess/src/audio.js (M).
- Move corner buttons out of tap zones, 44px, onPointerDown on zones (S).
### High-value
- Chess: last-used/favourite presets, Bronstein/US delay, per-side asymmetric time, move counter, landscape ±90 layout + orientation any, themed confirm sheet (M).
- Sudoku notes ergonomics: auto-remove peer pencil marks, auto-candidates, peer highlighting, per-digit remaining count/dimming, pencil ≥9-10px, undo stack, pause, hardware keyboard, "mistakes" vs "conflicts" modes (M).
- Sudoku real difficulty + Web Worker + retry carve/symmetric removal + technique grading + pre-generate next puzzle + show clue count (M/L).
- Daily puzzles with seeded RNG (mulberry32) for sudoku + cryptogram, streaks, completion calendar (M).
- Cryptogram flow: auto-advance to next unsolved letter, keys always enabled + auto-select first, cipher 12px/cells ≥30px, frequency strip, undo, hint counter, time on list (M).
- Cryptogram fetch: AbortController timeout, source:"web", attribution caveat, offline shuffle, grow bundle to 150-300 (S/M).
- Stats + history per game (M).
- Pressed/focus states, roles, labels, aria-pressed, reduced-motion, overscroll (S).
### Nice-to-have
Settings screen (M); shared themed confirm (S); manifest polish (S); Home redesign w/ SVG icons + Daily row (M); cross-tab storage sync (S); more games: Wordle-style daily word, Nonogram, Kakuro/Killer Sudoku (reuse gen). Avoid server-needing games.

## 6. Cross-app
apps/chess PassPlay.jsx (19-40, 100-128, 155-163) has own Fischer clock: same model, chips presets, Math.ceil, sound/haptics via apps/chess/src/audio.js. Neither links to other; life-architecture has no /games/ reference. Recommend: keep standalone clock (OTB use, tiny bundle vs 60MB+ chess), extract shared chessClock.js + audio.js, cross-link both setups. Do not merge.
