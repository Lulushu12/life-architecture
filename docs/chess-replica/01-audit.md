# Chess app audit (Phase 1, gate 1)

Date: 2026-10-09. Scope: `apps/chess` (about 22,700 lines of JS/JSX/CSS plus lesson data) and the parts of `packages/shared` it uses. Every source file in scope was read. The serious bugs below were re-checked against the code, and the app was built (`vite build` passes). Nothing in the app was changed.

This updates `docs/audits/chess.md` (2026-09-23). Since then, commits `d26f1e3` and `feadec4` fixed most of that audit's must-dos: opening moves are now graded, drag and premove work, games are capped at 50 with PGN export, the service worker was rewritten, the engine stops when the app is hidden, the API key is kept out of backups, and import by username, puzzle rating, spaced review (SRS), the opening drill and the stats screen were added.

## 0. The short version

1. **The app already does most of what your fixed decisions describe.**
   - Stockfish 16 NNUE already runs on the device as WebAssembly.
   - It already has 7,200 Lichess puzzles bundled, plus Rush, Streak, a puzzle rating and spaced review.
   - It already imports your chess.com games through the public API, and has game review with chess.com-style move labels, an analysis board, 150 bots and 72 lessons.
   - So this project is mostly about quality, a coach, and making it work for a beginner. It is not new infrastructure.
2. **For a beginner, the biggest gap is the coach, not features.**
   - Nothing in the app explains *why* a move is good or bad in words. Review gives a label and "best was Nf3", and the in-game hint is an arrow.
   - The weakest bot is rated 800.
   - The "beginner" lessons start at forks and pins, and nothing teaches how the pieces move or how to read notation.
   - If chess.com's coach and its low-rated bots are what you use most, those are what you would miss.
3. **The current structure cannot take a large puzzle set or device sync without restructuring first.** It can take an engine upgrade.
   - Everything lives in one JSON blob in localStorage (about 5 MB), shared with the other seven apps on the same GitHub Pages origin. The whole blob is rewritten on every change.
   - There are no per-record timestamps and no deletion markers, and a restore replaces the whole store.
   - This needs a data-layer restructure (L), not a rewrite. React, Vite, chess.js and the screens stay. Details in section 4.
4. **There are no tests at all.** Your rule "write tests covering current behaviour before changing anything" means step one is a test harness. That is real work (M) and it comes before everything else.

## 1. Stack and architecture

| Layer | What it is |
| --- | --- |
| UI | React 18, plain JSX, one hand-written stylesheet (`styles.css`, 1,605 lines). No TypeScript, no router, no state library. |
| Chess rules | chess.js 1.4 (`move()` throws on an illegal move). |
| Engine | Stockfish 16 NNUE, single-threaded WASM (575 KB) plus the 40 MB net, in one Web Worker. `src/engine.js` wraps it with a serialized job queue, tag-based cancel, and a pause while the page is hidden. The `Engine` class can be created more than once: EngineMatch already runs a second, classical one. |
| State | One `store` object held in `App.jsx` and passed as props to every screen. It is persisted as a single localStorage key, `chess-v1`, through `packages/shared/src/store.js`, and `JSON.stringify` runs on the whole store twice per change. |
| Navigation | `history.pushState` with a view object. The URL never changes. Android back works; `?action=` covers 3 shortcuts. |
| Offline | Generated service worker (`packages/shared/vite/swPlugin.js`). It precaches the app shell. The engine and game database use a cache-first data cache; puzzles and opening data are stale-while-revalidate. |
| Delivery | GitHub Pages at `lulushu12.github.io/life-architecture/chess/` as an installable PWA, plus a Capacitor Android APK with all data bundled (about 80 MB). |
| Build | Vite 5. Main chunk is 957 KB (222 KB gzipped): personas, the 3,704-line openings table and the lessons are all in it. Eight screens are lazy-loaded. |
| CI | `deploy.yml` builds all 8 apps on every push to main; `android-apks.yml` rebuilds all 8 APKs on any change under `apps/`. No tests, lint or lesson validation run in CI. |
| Tests | None. No test runner, no lint config. `validate-lessons.mjs` is the only check, run by hand (it passes: 72 lessons, 0 warnings). |

## 2. Every feature, and how well it works

Rating key: **solid** (works, no meaningful bugs found), **ok** (works, with gaps), **weak** (works but thin or misleading), **buggy** (a real defect a user will hit).

### Play

| Feature | Rating | Notes |
| --- | --- | --- |
| Bot games (150 bots, Romanian and English casts, 800 to 3200) | ok | Bot strength comes from three bands (`bot.js`). Below 1320, the bot plays with a small search budget plus a random-blunder roll, which reads as human enough. From 1320 to 2999 it uses Stockfish's built-in `UCI_Elo` at 300 to 500 ms per move, so the ratings are approximate. 3000, 3100 and 3200 are the same full-strength bot. A persona's style changes nothing above 1320. **Lowest bot is 800.** |
| Bot banter (scripted lines, optional LLM) | ok | Event-driven, with cooldowns, a mute button and a "serious mode". The LLM option is OpenAI-compatible only, sends no language instruction (so Romanian bots likely answer in English), and stores its key in plaintext localStorage. |
| In-game hint | weak | Shows the engine's best-move arrow and nothing else. No explanation and no hint limit. Hints and takebacks don't affect your win/loss record. |
| Takeback, branch from an earlier move, premove, drag and tap | solid | Branching keeps up to 8 abandoned lines. |
| Eval bar and eval graph | ok | Hidden in serious mode. Shows "M" without the mate distance. |
| Time controls vs bots | missing | Clocks exist only in pass & play. |
| Pass & play | ok | Clock built from saved timestamps, auto-flip, undo. It uses the same "current game" slot as bot games, so starting one abandons the other. |
| Engine match (NNUE vs classical) | ok | A toy, but it works. |

### Learn from your games

| Feature | Rating | Notes |
| --- | --- | --- |
| Game review | ok | Labels: brilliant, great, best, excellent, good, book, forced, inaccuracy, mistake, miss, blunder. Also accuracy (lichess curve, plain average), accuracy split by game phase, key-moment chips, live top-5 engine lines, a threat overlay, and playing out variations. **No explanation in words**: the data needed for one (the refutation line) is stored but never shown. |
| "Retry from here" | **buggy** | It starts a casual bot game from that position and **silently wipes any game in progress** (`ReviewScreen.jsx:617-638`). It is not a "find the better move" drill. |
| Batch review of imported games | ok | If the app is backgrounded during a review, a shallow result can be saved for one move (medium confidence). |
| Analysis board | **buggy** | Shows 5 engine lines, threats, move verdicts and up to 8 stashed lines (a flat list, not a tree). Bugs: **pasting a PGN that has a FEN header crashes the whole app to the error screen** (`Analysis.jsx:240` resets the start position while keeping moves made from the FEN one). The engine lines and the move verdict show the *previous* position's data for about 0.7 s after each move, so a fast second move gets a wrong verdict. Opening names appear even for custom positions. Nothing is saved when you leave the screen. |
| Archive | ok | Star, delete with undo, multi-select PGN export. No search or filter. 50-game cap (starred games are kept). |
| PGN import and export | ok | Paste import never sets your colour, so pasted games produce no blunder puzzles and the board always shows White at the bottom. Export is the main line only: no comments, evals or variations. |
| Import by username (Lichess, chess.com public API) | ok | Good error handling. The chess.com import only reads the **last 2 monthly archives**, so if you haven't played for 2 months you get 0 games. After the response headers arrive, the rest of the download can't be timed out or cancelled. |
| Stats | ok | W/D/L, a performance rating from your last 20 bot games, accuracy and blunder trends, puzzle rating, lessons done. |

### Puzzles

| Feature | Rating | Notes |
| --- | --- | --- |
| Bundled Lichess puzzles | ok | 7,200 puzzles in 6 tiers of 1,200, rated 757 to 2551, with 34 themes. Loaded as one 1 MB JSON file. |
| Tier and rated-mix trainer, theme filter, 2-step hint | **buggy** | Picks the puzzle nearest your rating. Bugs: **a correct alternative checkmate is marked wrong and costs rating** (`PuzzleSets.jsx:308`); Reveal shows the move as "e2e4" instead of "e4"; revealed or failed puzzles count as solved for tier progress. |
| Puzzle rating | ok | Plain Elo (K=32, then 16). Hints and Reveal count as a loss. |
| Spaced review (1/3/7/21 days) | ok | The "due" count can include puzzles that no longer exist, so it can show "Due today: N" and then "Nothing due". |
| Rush (3 minutes) and Streak | solid | Unrated, no hints. |
| Blunder trainer (puzzles from your own games) | ok | Accepts any move within 30 cp of the best. If the engine is busy for more than 4 s, a correct alternative is marked wrong. |
| Three separate puzzle solvers | fragile | They have three different rules for what counts as correct. |

### Openings and lessons

| Feature | Rating | Notes |
| --- | --- | --- |
| Opening explorer (3,704 named lines, play counts and evals) | ok | Follows move order only, not transpositions. About 470 lines share a name key, so some lines show a sibling line's eval, and React gets duplicate keys. |
| Opening drill | **buggy** | "Show move" doesn't count as a miss, so you can "master" a line by revealing every move. |
| Lessons (72: 29 openings, 30 concepts, 13 endgames; 557 steps, 205 quizzes) | weak for you | The runner is decent. Content gaps: **nothing on how the pieces move, the rules, piece values or notation**, and quiz feedback is in notation. In 7 quizzes an arrow already shows the answer. In 14 quizzes you play the side the board isn't oriented for. Completion is meaningless: you can skip past quizzes and press Finish. Alternative answers that are accepted get replaced on the board by the main answer (`Lessons.jsx:326-330`, a `setTimeout` that does nothing). |
| Custom position editor | ok | The en passant square is always cleared. |
| Pro games database (982 events, live Lichess broadcasts) | ok | About 39 MB, opt-in offline download. |

### Look and feel

| Feature | Rating | Notes |
| --- | --- | --- |
| Board themes and piece sets (34 themes, 33 piece sets, custom colours) | solid | Your own sets, plus cburnett, merida and kosal (open licences). Keep them. |
| Sounds and haptics | ok | Synthesized. No sound in review or analysis. |
| Accessibility | weak | The board has no ARIA, no keyboard move entry, and no reduced-motion setting. |
| Phone layout | ok | 560 px column. The board is about 355 px wide on a 390 px phone. No real landscape or desktop layout below 900 px. |

## 3. Fragile, duplicated or hard to extend

1. **One store blob for everything** (`storage.js`, `packages/shared/src/store.js`).
   - Every puzzle solve re-serializes up to about 1 to 3 MB on the main thread.
   - When storage is full, writes fail for the other seven apps on the origin too. The banner's size maths only counts chess games and puzzles.
   - Progress and spaced-review entries are keyed by tier name plus puzzle id, with no versioning, so changing the puzzle file breaks them.
2. **No position or move-tree model.** Each screen replays moves from the start position to rebuild positions; there are about 10 copies of this. Analysis and Review each have their own, incompatible "line plus 8 stashed lines" model. A proper variation tree (needed for a decent analysis board and for a coach that walks through lines) means replacing both.
3. **Copy-pasted chess helpers:**
   - Legal-move map: 7 copies.
   - Promotion check: 6 copies.
   - Classification thresholds: 3 copies, and the Review and Analysis copies can drift apart.
   - `pvToSans`: 2 copies.
   - Threat probe: 2 copies.
   - Opening lookup: 2 copies (`findOpening` and `nameFor`).
4. **Three puzzle solvers with different rules** (`Puzzles.jsx`, the tier trainer in `PuzzleSets.jsx`, and `LineSolver`). Any puzzle feature you add has to be built three times, or they need to be merged first.
5. **Oversized components.**
   - `ReviewScreen.jsx` (958 lines) holds four unrelated screens: PGN import, online import, batch review and the review viewer.
   - `PlayBot.jsx` (752 lines) mixes game state, engine calls, chat timing and UI.
   - Adding a coach panel to either one without splitting it first will make it worse.
6. **The engine interface is Stockfish-shaped.** It sends Stockfish-only UCI options and returns cp/mate lines. Maia (a neural net that predicts human moves) would need its own adapter class. Nothing else blocks it, because `chooseBotMove` already takes the engine as a parameter.
7. **Offline is not really offline-first on the web.**
   - The engine, the puzzles and the opening data are not precached. They only work offline after you've used them once online.
   - `navigator.storage.persist()` is never called, so the browser may evict the 40 MB net.
   - The engine files aren't versioned, so a new Stockfish build at the same URL would never reach installed copies.
   - The manifest says "Fully offline".
8. **No tests and no CI checks.** Every change today is verified by hand.
9. **Same-origin sharing.** All eight apps share `lulushu12.github.io` (and so does any other GitHub Pages project on your account). That means a shared 5 MB localStorage, and the LLM API key is readable by every page on that origin.

## 4. Can it support an offline engine, a large puzzle set and device sync without a rewrite?

| Capability | Verdict | What it takes |
| --- | --- | --- |
| Offline engine (Stockfish WASM) | **Already there.** Needs hardening (S). | Precache, or offer a one-tap "make available offline" with progress, for the engine, puzzles and opening data; call `persist()`; put a version in the engine file names. Multi-threaded Stockfish would need COOP/COEP headers, which GitHub Pages cannot send. Single-threaded is plenty for a beginner, so I recommend staying single-threaded. |
| Human-like bots (Maia) | **Possible without restructuring** (M, plus research). | A second engine adapter (for example onnxruntime-web plus Maia weights) behind the same "choose a bot move" call. Open question for Phase 2: the original Maia nets cover about 1100 to 1900, which may not reach the levels you play. |
| Large puzzle set (50k+) | **No, not as it is.** Restructure needed (M). | At 50k puzzles the single JSON is about 7 MB and 23 MB of memory; at 200k it is about 29 MB and 90 MB, re-downloaded in the background on every launch. Needs: puzzles in IndexedDB, loaded in chunks by rating and theme, picked with an index instead of a full scan, progress keyed by the Lichess puzzle id rather than tier, and one puzzle solver instead of three. |
| Device sync (self-hosted) | **No.** Restructure needed (L). | Single blob, last write wins between tabs, no per-record `updatedAt` or deletion markers, and a restore replaces everything. Needs: an IndexedDB data layer with one record per game, review, puzzle attempt, lesson progress and setting, each with an id, `updatedAt` and a deleted flag; a one-time migration from `chess-v1`; and a backup format that still reads old backups. Sync then becomes "push and pull changed records since time T", which a small server on your NixOS box can handle. |

**Bottom line: restructure first, don't rewrite.** Recommended Phase 0, in order:

1. **Test harness** (M). Vitest for pure logic: review classification, bot move selection, puzzle grading, SRS, storage normalize and cap. Playwright on the bundled Chromium for 6 to 8 core flows: play a bot game, review it, solve a puzzle, run a lesson, import a PGN, back up and restore. Run it in CI before deploy.
2. **Chess core module** (M). One position and move-tree model, plus the shared helpers (legal moves, promotion, classification, PV to SAN, threat probe), and an engine adapter interface. This removes the duplicated code, and every later feature builds on it.
3. **Data layer to IndexedDB** (L). Per-record stores with sync-ready fields, migration from the current blob, a compatible backup format, and `persist()`. This is the expensive, hard-to-undo step, so it gets a migration test with a copy of your real data before it ships.
4. **Offline asset hardening** (S). Precache or one-tap download with progress for the engine, puzzles and opening data; versioned engine URLs.

Roughly M + M + L + S. Steps 1 and 4 can ship on their own straight away. Step 3 is the one that unlocks the large puzzle set and sync, so it can wait if you'd rather have coach features sooner.

## 5. Bugs found (verified unless marked)

Severity: S1 breaks the app or loses data, S2 is wrong behaviour you will hit, S3 is minor.

| # | Sev | Bug | Where |
| --- | --- | --- | --- |
| 1 | S1 | Pasting a PGN with a `[FEN]` header crashes the app to the error screen | `Analysis.jsx:240-243`, `:52-57` |
| 2 | S1 | "Retry from here" silently discards the game in progress | `ReviewScreen.jsx:617-638` |
| 3 | S2 | An alternative checkmate in the tier and mix puzzles is marked wrong and costs rating | `PuzzleSets.jsx:304-308` |
| 4 | S2 | Analysis shows the previous position's lines and verdict after a move; a fast move gets a wrong verdict | `Analysis.jsx:36, 81-127, 183-194` |
| 5 | S2 | Revealed or failed puzzles count as solved for tier progress | `PuzzleSets.jsx:427` |
| 6 | S2 | Drill "Show move" still counts as a clean, mastered run | `Drill.jsx:278` |
| 7 | S2 | The chess.com import only reads the last 2 months | `importers.js:112` |
| 8 | S2 | An accepted alternative lesson answer is replaced on the board by the main answer | `Lessons.jsx:326-330` |
| 9 | S2 | 7 lesson quizzes show the answer as an arrow; 14 have the board oriented for the wrong side | lesson data (agent-scripted count, not re-checked one by one) |
| 10 | S2 | A saved lesson step isn't clamped, so a shortened lesson crashes the runner | `Lessons.jsx:224, 246` |
| 11 | S2 | The puzzle "due" count includes entries that review then drops | `PuzzleSets.jsx:73` vs `:744` |
| 12 | S3 | Reveal shows the move as UCI ("e2e4") | `PuzzleSets.jsx:390` |
| 13 | S3 | The threat overlay shows "threats" that aren't threats (no comparison with the current eval) | `ReviewScreen.jsx:455`, `Analysis.jsx:146` |
| 14 | S3 | The blunder trainer marks correct alternatives wrong when the engine is busy for more than 4 s | `puzzledb.js:158` |
| 15 | S3 | About 470 opening lines share a key: wrong eval shown, duplicate React keys | `Openings.jsx:107`, `opening-meta.json` |
| 16 | S3 | Analysis shows an opening name for a custom start position | `Analysis.jsx:59` |
| 17 | S3 | A desktop right-drag released off the board blocks piece dragging (medium confidence) | `Board.jsx:368, 587-593` |
| 18 | S3 | Backgrounding during a batch review can save a shallow eval for one move (medium confidence) | `engine.js:21`, `review.js:68` |

## 6. Things to raise before Phase 2

1. **"Personal use only, never published."** Today the app *is* public: the GitHub Pages site and the APK release links are open to anyone, and the repo is public. That's fine for the licences in use (Stockfish GPLv3 with its notice kept; Lichess puzzles CC0; cburnett, merida and kosal pieces), but it matters for two things. GitHub Pages is a hosted service, and your list of banned hosts doesn't mention it, so do you want to keep it or serve the PWA from your NixOS box? And anything we add, such as your imported chess.com games or an LLM key, should never be bundled into the build.
2. **The brand sweep can't reach zero, by design.** A baseline run of Replica's `sweep.py` on `apps/chess` found 26 hits:
   - Most are legitimate: the chess.com importer you asked for, and the GPL copyright line inside `stockfish-nnue-16-single.js` ("(c) 2023, Chess.com, LLC"). That line **must stay**, because removing it would breach the GPL.
   - Two code comments say "chess.com style"; those should go.
   - The real concern is colour. The app's accent `#81b64c` is, I believe, chess.com's signature green, and the review-label palette (`review.js:9-21`) and icons look modelled on chess.com's. Low confidence until Phase 2 checks public sources. If confirmed, those count as chess.com trade dress under your "no chess.com assets" rule, and changing them touches the theme, which you said to keep. Your call at that point.
   - I'll run the sweep with an explicit allowlist for the importer and the GPL notice.
3. **Replica is a clone-to-sell pack.** Its defaults (Next.js, Supabase, Vercel, Stripe) contradict your fixed decisions, so I'll use its method (recon map, feature matrix, `parity.py`, `sweep.py`, the architect template) but not its stack. It also writes to `replica/`; per your instructions everything goes in `docs/chess-replica/` instead. I installed the pack to `~/.claude/skills` in this container (not committed to the repo); it will need reinstalling in a future session.
4. **The monorepo.** Chess shares `packages/shared` with seven other apps. I plan to keep the new data layer local to chess and not change the shared store, so nothing else can break. Say so if you'd rather it be shared.
