# Chess audit (apps/chess)

## 1. What it does
Nav: App.jsx:20-92 switch over view; nav() pushes history (55-59); Android back via @capacitor/app (44-53). Screens: Home (11 tiles + resume), PlayBot, PassPlay, Analysis, Review (+PGN import), Archive, Openings explorer (openingdb.js), Pro games (GamesDB: 87k games in 982 per-event JSON, famous shelf, lichess broadcast relay), PositionEditor, EngineMatch (NNUE vs HCE), Puzzles hub + tier trainer + blunder trainer, Lessons (74 lessons, 10 files), Settings.
Engine (engine.js:10-107): single-threaded SF16 NNUE (575KB wasm, 40.1MB net). One Worker; go calls serialized via promise chain. Options movetime|depth|nodes, multipv, elo, skill. No Threads/Hash. Singleton never destroyed. winPct lichess logistic (148-151).
Strength (bot.js): >=3000 full 900ms; 1320-2999 UCI_Elo 300/500ms; <1320 node-starved multipv-8, nodesForElo=600*2^((elo-800)/125), blunder roll, softmax over cp loss w/ temperature. Persona aggression multiplies capture/check weights only sub-1320. chattiness only banter.
Personas: 150 bots (ro/en × 25 levels × 3), 12 archetypes/lang. chat.js detectEvents (10-36), pickLine priority + cooldowns + chattiness roll. Last two bubbles render. aiReact POST /chat/completions, 6s abort, max_tokens 60, full PGN; only when canned line already chosen; key in store.settings.ai.
PlayBot: picker (lang, colour, serious, 25 blocks × 3 w/ W-D-L). 400ms search after each move feeds eval bar/graph/chat/hint; hint arrow, takeback, resign confirm(), preview/branch (8 stashed), archive, botRecords, review handoff. Start-from-FEN.
Review (review.js): multipv-2 per position at 200/400/1000ms. Classification (99-114) on win-prob drop: book (in book && ply<20), brilliant (best && 2nd >=50cp worse && sacrifice && after>42% && before<92%), best, excellent<2, good<5, inaccuracy<10, mistake<20, blunder. No great/miss/forced. Accuracy = plain mean of lichess curve (reads high vs lichess harmonic blend). Blunders => puzzles. Screen: accuracy cards, scrub graph, verdicts, threat arrows, live top-5, variation play + grading, Retry from here, Flip.
Analysis: multipv-5 600ms + 350ms threat on every change; grading; paste FEN/PGN; branches.
Puzzles: puzzles.json 1.05MB, 6 tiers × 1200 lichess puzzles quality-filtered, rating-sorted; nextPuzzle first unsolved in rating order (puzzledb.js:89-92). Two-stage hint, reveal, skip. No rating/timer/streak/SRS. Blunder trainer exact bestUci only (Puzzles.jsx:49).
Lessons: 74 (30 openings, 33 concepts, 11 endgames), steps play/text/arrows/circles/quiz; runner Lessons.jsx:223-459; validate-lessons.mjs.
Openings: 3704-line inline array; findOpening longest-prefix linear scan per move.
PassPlay: auto-flip, clock 3/5/10/15 + inc, timestamp model 200ms tick, flag, undo, review.
PGN: import only. No export/share/copy FEN.
Board: tap-tap only, no drag, no premove. Promotion overlay, highlights, dots, shapes via right-click/long-press, SVG arrows, animated pieces, 34 themes, 33 piece sets inlined, custom colours. Sounds synthesized; haptics vibrate.

## 2. Architecture
One store, full stringify on every change (App.jsx:26-28, storage.js:57-63). Up to 200 games w/ full reviews (30-50KB each => ~8MB > 5MB quota) + 300 puzzles; saveStore swallows QuotaExceeded. Every cp push stringifies.
Worker: raw UCI strings, no request ids; stopCurrent only in review/EngineMatch; Analysis/Review effects only set cancelled flag => queued searches still run (scrub 10 plies => ~10s work). No visibilitychange => CPU pinned when backgrounded.
Bundle: all screens static imports; one chunk w/ openings table, ~2000 lines personas, 33×12 raw SVGs eager. Only puzzles/opening-meta/games lazy.
SW: precaches 40MB net via cache.addAll at install (all-or-nothing); fetch handler starts fetch(request) unconditionally before cache check => re-downloads bundle + 40MB net every online session; CACHE_NAME chess-v1 fixed; put every 200 => unbounded. No progress UI. Emscripten IDB persistence path may double-store net.
Android: base ./, no SW; public/ ships 40MB net + 39MB games/ev + 1MB puzzles (~80MB). "Download everything" button + first-visit copy still shown in APK.
Routing: no URL; replaceState resets to home on mount (App.jsx:34); GamesDB internal stack invisible to hardware back.

## 3. UX / visual
.page 560px, board ~355px on 390px phone (44px squares) minus 18px eval bar. Sticky TopBar, engine banner, 58px chat area shifts board. Movelist 30vh. No landscape (portrait-primary; 2-col only >=900px). system-ui 16/17px. Warm dark tokens (--bg #161512, accent #81b64c); literals in .openrow/.pathmove/.mh-side/.palpiece/.groupshare. Piece glide slider; no reduced-motion. Sounds move/capture/check/chat/win/lose (no low-time/illegal/puzzle-correct). "X is thinking..." no progress. alert()/confirm() native. A11y: squares divs no role/labels; pieces dangerouslySetInnerHTML no titles; no keyboard entry; no focus-visible; 9px coords; arrows red vs green not colourblind-safe.

## 4. Bugs
1. Opening moves never graded: review.js:90-92 marks book whenever findOpening returns anything (longest prefix) => every ply <20 "book". Fix: require op.plies === sanSeq.length.
2. SW re-downloads 40MB net every online engine start; unbounded cache (sw.js:48-61); addAll all-or-nothing.
3. Silent data loss on quota (storage.js:61).
4. Wrong event passed to LLM (PlayBot.jsx:392 events[0] vs pickLine's choice).
5. API key leaks into backups (backup.js:13 serializes settings.ai.apiKey); Settings says paste into email.
6. Engine queue not drained leaving Analysis / scrubbing.
7. Promotion detection wrong FEN when branching (PlayBot.jsx:531-534 liveFen vs shownFen).
8. Eval bar vs graph different logistic constants (Board.jsx:565 0.004 vs engine.js:150 0.00368).
9. hints counter dead (PlayBot.jsx:470-472); W-L ignores hints/takebacks.
10. Restored branches zero cps history (PlayBot.jsx:296).
11. Blunder trainer rejects equally good moves (Puzzles.jsx:49).
12. Tier puzzles always easiest-first (puzzledb.js:89-92).
13. Lesson alt answers jump board to main answer (Lessons.jsx:326-330).
14. PassPlay flag effect no deps (115-128); undo after flag restores playing w/o clock.
15. findOpening O(3704×plies) per call.
16. GamesDB stack invisible to back.
17. APK copy wrong (Home.jsx:63-66, PlayBot.jsx:512, GamesDB.jsx:124-131).
18. .sq.check drops texture (styles.css:357-359).

## 5. Proposals
### Must-do
- Fix book classification (S, review.js).
- SW rewrite for large assets: cache-only for /engine/* and /games/ev/*, versioned CACHE_NAME + evict, net precache separate from install w/ ReadableStream progress ("12 of 40MB"). M.
- Storage: IndexedDB for games/reviews/puzzles, localStorage for settings/current, write changed record only, persistent warning on failure. L.
- Stop engine on visibilitychange + screen leave; debounce position-change searches ~120ms. S.
- Strip API key from exports, mask in UI, explicit include toggle. S.
- Pass chosen event to aiReact; send last 10 plies + eval delta not full PGN. S.
### High-value
- Drag-to-move + premove (lichess semantics). M. Largest gap vs chess.com/lichess.
- PGN/FEN export + share (Web Share / Capacitor Share); pgn.js headers. S.
- Lichess/chess.com import by username + batch review. M.
- Review quality: great/miss/forced; accuracy split opening/middle/endgame; key moments chips; "Retry the move" hidden-verdict mode. M.
- Adaptive puzzle serving + Glicko-lite puzzle rating; Puzzle Rush + Streak. M.
- SRS for missed puzzles (1/3/7/21d) + "Due today"; blunder trainer accepts within 30cp via 200ms multipv-3. M.
- Opening repertoire drill from explorer continuations, mastery counts. M.
- Human-like bots: persona style weights (trades, kingSafety, pawnGrabber) via multipv re-weighting below 2000; rating drift ±50 on last 5 results. M. Maia not feasible.
- Banter timing: queue until move lands, max one per 2 plies, scrollable sheet, mute, no equal lines first 10 plies. S.
- Clocks in bot games + proper clock UI (low-time sound/colour, tenths, pause); reuse games ChessClock logic. M.
- Landscape/tablet: drop portrait-primary, min-aspect-ratio query, 600-899 breakpoint. S.
- Replace alert/confirm w/ sheets; draw offers w/ bot response. S.
- Stats screen: results, accuracy trend, blunders/game, performance-rating Elo estimate, puzzle rating, lessons. M.
### Nice-to-have
Code splitting (React.lazy, lazy persona packs + piece sets) M; hash routing/deep links M; Android bundle diet (exclude games/ev, fetch on demand) M; onboarding sheet S; endgame trainer M; lesson progression + SRS M; a11y pass (grid roles, SAN entry, aria-live, reduced-motion, colourblind arrows) M; board polish S; Settings tabs + battery saver S; batch review S.

## 6. Cross-app
games ChessClock is stronger than PassPlay's clock (pause, tenths, flag, pure remainingMs). Extract shared clock module; games' zone UI could be "clock only" mode in chess. Chess warm palette vs navy elsewhere, same token names + component vocabulary (.topbar/.chip/.toggle/.setrow/.bigbtn/.linkbtn/.card/.menugrid) => shared tokens.css, keep chess values, purge literals (styles.css:1216-1338). backup.js + OpenAI-compatible endpoint config duplicated w/ LA coach => shared ai-config helper.
