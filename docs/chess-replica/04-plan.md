# Plan (Phase 4, gate 3)

Date: 2026-10-09. Built from `01-audit.md`, `03-gap-analysis.md` and the answers recorded in both. **No application code is written until you approve this plan.**

## Rules every item follows

1. **Tests before change.** Before an item touches a file, tests that pin down the current behaviour of that code must exist and pass. A bug fix starts with a test that fails because of the bug.
2. **Nothing existing breaks.** The full test suite (unit tests plus browser flows) runs in CI before Pages deploys and before APKs build. Red blocks both.
3. **Every item ships on its own.** Each one ends with a working APK you can install and use. No half-built screens behind flags.
4. **Brand sweep before shipping.** Replica's `sweep.py` runs in CI with an allowlist covering only the chess.com importer and Stockfish's GPL notice. Any other hit blocks the ship.
5. **Your strengths stay.** Offline, unlimited, your themes and pieces, blunder puzzles, export: the tests in item 1 cover them and keep covering them.
6. **The docs move with the code.** Each shipped item updates `features.csv` and `parity.md`, so GitHub always shows where things stand.

Sizes: S is a day or two of focused work, M about a week, L more.

## Overview

| # | Item | Size | Needs | New infrastructure? | You can use it for |
| --- | --- | --- | --- | --- | --- |
| 0 | APK signing key, set up from your phone | S | your 4 pastes into GitHub | **yes** (CI) | updates that keep your data |
| 1 | Test harness and CI gate | M | | **yes** (tooling) | (protection; nothing visible) |
| 2 | Chess core module | M | 1 | no | real threats only on the threat arrows |
| 3 | Bug-fix sweep | M | 1 (2 for some) | no | no crashes, fair puzzles and lessons |
| 4 | App colour picker and new badge colours | S | 1 | no | choosing your accent; chess.com green gone |
| 5 | Coach engine plus review explanations | L | 2 | no | reading *why* each move was bad |
| 6 | Review flow: summary first, Next, Show, Best, Retry in place | M | 5 | no | working through your mistakes |
| 7 | Bot help presets, threat arrows, mid-game help sheet | M | 2 | no | playing with help you control |
| 8 | Coach in bot games: feedback after moves, two-step hint | S | 5, 7 | no | coach games against any bot |
| 9 | Blunder check before your move | S | 8 | no | the anti-rushing habit |
| 10 | Game end and home: rematch, play again, clean vs assisted records | S | 7 | no | faster loops, honest records |
| 11 | Puzzles: coach tips, daily puzzle with streak, rating range | M | 5 | no | a daily habit, puzzles that teach |
| 12 | Archive filters, analysis Play-from-here and Save | S | 2 | no | finding and continuing games |
| 13 | Lessons path and fixes | S | 1 | no | a Next lesson button that means something |
| 14 | One-way backup to your NixOS box (framework) | M | 1 | **yes** (server) | automatic off-phone copies, once the box is ready |
| 15 | Later, on your say-so | | | partly | |

The order puts protection first (0 to 3), then the cheap visible change (4), then the coach in the order that gets value soonest (5 to 9), then the rest. Items 10 to 13 can be reordered freely; tell me if one matters more.

## The items

### 0. APK signing key, from your phone (S, new infrastructure)

**Why first.** Every APK the workflow builds today is signed with a throwaway debug key. That's why you have to back up and uninstall before each update, and every item below would cost you that cycle. Fixing it once fixes all 8 apps.

**How, without a PC:**
1. I generate the keystore and random passwords in this cloud session, which has `keytool`.
2. I put the 4 secret values in one file in my scratchpad, which you can open in the Claude app.
3. On your phone, in a browser on github.com: repo Settings, then Secrets and variables, then Actions. Add the 4 secrets by copy and paste. (I can't set secrets from here; the GitHub tools I have don't cover them.) The keystore value is a long text block of about 3,000 characters. It's tedious on a phone, but it works.
4. You save that file somewhere safe that isn't the repo. Lose it and you're back to uninstalling.

**Honest trade-off.**
- The key and passwords pass through this session's transcript and files.
- For a personal sideloaded app the risk is low: someone holding the key could only replace your app if they also got you to install their APK.
- A key generated on your own NixOS machine would be cleaner, if you'd rather wait for that.

**The last uninstall.** The switch needs one final backup, uninstall, install and restore per app. After that, updates install over the old version and your data stays.

**Done when:** the workflow logs show "Assemble release APK (signed)", and an update installs over the previous one on your phone.

### 1. Test harness and CI gate (M, new infrastructure)

**Unit tests (Vitest).** Characterization tests for the pure logic:
- review classification and accuracy, run on fixture games with a scripted fake engine so results are deterministic
- the sub-1320 bot move picker, with a seeded random source
- puzzle grading, rating, spaced review and next-puzzle choice
- storage: normalize, the game cap, backup validation
- PGN import and export, opening lookup, the importers' parsing

**Known bugs get tests too.** Each audit bug gets a test marked "known bug", so fixing it in item 3 is a visible flip from expected-fail to pass.

**Browser flows (Playwright, real Stockfish)** against the production build:
1. play a bot game to a few moves and resume it after a reload
2. review a seeded game
3. solve a tier puzzle and a blunder puzzle
4. step through a lesson with a quiz
5. paste a PGN into Review and into Analysis
6. back up and restore
7. change board theme and piece set and confirm they persist

**CI:**
- A `test` workflow runs on every push and pull request touching `apps/chess` or `packages/shared`.
- The deploy and APK workflows wait for it.
- `validate-lessons.mjs` joins CI.
- The brand sweep joins CI with its allowlist.

**You see:** nothing in the app. You see a green check on GitHub.

### 2. Chess core module (M)

One module (`apps/chess/src/core/`) for what is copied across screens today:
- legal-move maps and the promotion check
- replaying moves into positions
- the classification thresholds
- `pvToSans`
- one threat probe that compares against the current eval, so it only reports real threats
- the opening lookup, indexed rather than scanned
- an engine adapter interface, so a later engine (or Maia) slots in without touching screens

Screens move over one at a time, with tests green after each move.

**You see:** the threat arrows in Analysis and Review stop showing harmless moves (bug 13). Analysis stops showing the previous position's lines after a move (bug 4).

### 3. Bug-fix sweep (M)

Audit bugs, each with a failing test first:

| Bug | Fix |
| --- | --- |
| 1 | PGN with a FEN header crashes the app |
| 2 | "Retry from here" wipes your game. It will ask first; item 6 replaces it |
| 3 | Alternative mates rejected in puzzles |
| 5 | Revealed puzzles counted as solved |
| 6 | Drill "Show move" counted as clean |
| 7 | chess.com import limited to 2 months; it will walk back until it has 20 games |
| 8 | Lesson alternative answers replaced on the board |
| 9 | 7 quizzes with the answer drawn as an arrow, and 14 with the board oriented for the wrong side (content fixes) |
| 10 | Saved lesson step not clamped |
| 11 | Puzzle due count includes puzzles that no longer exist |
| 12 | Reveal shows UCI |
| 14 | Blunder trainer fails when the engine is busy |
| 15 | Duplicate opening keys |
| 16 | Opening name shown for custom positions |

Bugs 17 and 18 (right-drag, background review) are fixed only if cheap in passing.

**You see:** none of the crashes or unfair puzzle results from the audit.

### 4. App colour picker and new badge colours (S)

- **Settings, then "App colour":** Plum, Teal, Copper and Brass to start, picked live with a preview swatch.
- The presets are a small data list, so adding more later is one line each.
- **Default:** Plum.
- **Chess.com's green is removed,** not offered as an option. Your success messages move to `#5fae6e`.
- **Review badges switch to the new palette** from the preview page: violet Brilliant, blue Great, new greens for Best and Excellent, sand Book.
- Copper and Brass keep their clash with the Mistake and Inaccuracy badges. You've seen it, and they stay available because you asked for the choice.
- The two "chess.com style" code comments are reworded. The sweep runs clean apart from the allowlist.

**You see:** a colour picker, and no chess.com green anywhere.

### 5. Coach engine plus review explanations (L)

**The engine** (`core/coach/`) reads the position before and after a move, plus Stockfish's lines, and produces **facts**. Each fact carries the squares and pieces involved and the line that proves it.
- **Facts it finds:**
  - material lost along the best reply
  - a piece left hanging or newly undefended, checked by static exchange
  - an allowed fork, pin, skewer or discovered attack
  - an allowed mate or mate threat, and back-rank weakness
  - a missed capture, missed mate, or missed punishment of their blunder
  - lost castling and king exposure
  - in the first 10 moves only: early queen moves and undeveloped pieces
- **Templates turn facts into English.** Each fact type gets 3 to 5 phrasings of my own, rotated, all in one file so Romanian can be added later.
- **Facts are plain data** (JSON). That is also what the later Claude layer receives.
- **Tests:** a fixture set of positions with the facts each must produce, including traps for false positives.

**First surface: Game Review**, because the engine data is already computed there and speed doesn't matter.
- each move gets an explanation under the board
- the review gets a one-line summary
- **Show** plays out the line after your move (already stored, never shown today)
- **Best** gets its reason

**You see:** the reason behind every inaccuracy, mistake, miss and blunder in your reviews.

### 6. Review flow (M)

- **Summary card first:** the coach line, both accuracies, a count per badge, accuracy by phase, then "Start review".
- **Move-by-move view:** the explanation panel plus Next key moment (starting at your last book move), Show, Best and Retry.
- **Retry happens in place:** you find a better move, with a two-step hint and coach feedback. "Play it out vs a bot" becomes a second button that asks before replacing a game in progress.
- **The eval graph gets markers** for your mistakes and blunders.

**You see:** a review you work through, the way chess.com's is laid out, in your own colours and words.

### 7. Bot help presets and the mid-game help sheet (M)

- **On the bot picker, help-level chips** replace the serious-mode toggle:
  - "On my own" (today's serious mode)
  - "Some help": eval bar, threat arrows, blunder check
  - "Full help": adds the suggestion arrow and move feedback
  - "Custom"
- **A help sheet in the game** changes any of these mid-game, as you asked.
- **Layout fixes:**
  - Resign moves into that sheet.
  - One strip under the board carries chat and coach text, so the board stops jumping when chat appears.
- **Threat arrows in games** use item 2's probe.
- **The picker opens scrolled to bots near your level,** with a "Recent opponents" row.

**You see:** help you choose and change mid-game, and red arrows on real threats.

### 8. Coach in bot games (S)

- **Move feedback after your moves:** the coach engine on the position you just left. Same facts and templates as review, only shown when there's something worth saying, rate-limited so it doesn't nag.
- **Two-step hint:**
  1. the piece and the idea ("there's a fork available")
  2. the move arrow
- **No separate Coach mode.** Any bot plus "Full help" is a coach game.

**You see:** a coach in every bot game you want one in.

### 9. Blunder check before your move (S)

- **In "Some help" and "Full help":** when the move you're about to make would hang material or allow mate, it doesn't land straight away. You get a nudge, for example "look at their knight on d4 first", and choose to play it anyway or pick another move.
- **The cost is one quick engine search, about 0.3 s.** It runs only in those presets.
- **It fades:** off in "On my own".
- **Stats shows "blunder checks that saved you"** per week, so you can watch the habit change.

**You see:** the feature aimed at your rushing.

### 10. Game end and home (S)

- **Game over:** a Rematch button (same bot, colours swapped) next to Review and New.
- **Home:**
  - The resume card stays.
  - Then 4 large tiles: "Play again vs (last bot)", Daily puzzle (after item 11), "Puzzles due: N", Next lesson (after item 13).
  - The other tiles move into the smaller grid below.
- **Bot records split** into clean and assisted wins, draws and losses, using the help level actually used.

### 11. Puzzles (M)

- **Coach tip on a wrong move**, from the coach engine.
- **Daily puzzle:**
  - one per date, chosen from the bundled set deterministically
  - 5 hearts
  - a streak with a calendar
  - a Life Architecture quest hook through the existing event ledger
- **Rating-range filter** next to the theme filter.
- The puzzle set itself stays as it is, per your answer.

### 12. Archive and analysis (S)

- **Archive:** tabs for All, Starred, Bots and Imported, plus a result filter.
- **Analysis:**
  - "Play from here vs a bot"
  - "Save": saved analyses get a list, and the 50-game cap doesn't touch them, with their own small cap
- No variation tree yet. Item 2's core makes that cheap later.

### 13. Lessons (S)

- **A path order** across your existing 72 lessons.
- **A "Next lesson" card.**
- **Completion requires passing the quizzes.**
- **Progress percentages clamp correctly.**
- No new "how pieces move" content unless you ask.

### 14. One-way backup to your NixOS box (M, new infrastructure, framework only)

**In the app:**
- Settings gets a box address and a token.
- The app pushes a compressed copy of its backup (the existing format, with no API key) at most once a day, on launch and after a game, whenever the box answers.
- It never blocks or slows anything, and shows "Last copy to box: (date)".

**On the box:**
- a tiny receiver script with no dependencies beyond Python's standard library
- a NixOS module to run it as a service
- daily and monthly retention

**Testing.** Tested here with automated client and server tests. **Not tested on your box or phone until the box is set up**, as you said. Details are in `05-architecture.md`.

### 15. Later, only on your say-so

- **Claude explanations:** the existing LLM code stays. The coach's fact format is the hook.
- **Romanian coach templates.**
- **Moving off Pages:**
  1. Back up every web app.
  2. Make the repo private.
  3. Build only the changed APK.
  4. Serve the desktop version locally on NixOS.
- **Games and reviews in IndexedDB,** if the 50-game cap starts to bite.
- **A variation tree in Analysis.**
- **Adaptive bots.**
- **Maia,** if 800 to 1500 ever stops being enough.

## Parity forecast

Computed with `parity.py` by marking each group's features as done in a copy of `features.csv`:

| After | Must-haves done (of 22) | Score |
| --- | --- | --- |
| Today | 8 | 47.2 |
| Items 0 to 4 | 10 | 50.9 |
| Items 5 to 9 | 21 | 79.4 |
| Items 10 to 13 | 21 | 90.8 |

The one must-have left is "Enough puzzles at your rating". It stays partial because you chose to keep the bundled set as it is. That's your call and not a defect; a later re-sample would close it.

## What I need from you to start

1. **Approve this plan, or change the order or scope.**
2. **For item 0:** confirm you want the key generated in this session, accepting that the key passes through it, rather than waiting to generate it on your NixOS machine.

## Status

| Item | State | Notes |
| --- | --- | --- |
| 0 | Parked | You chose to keep moving data by export and import until the key can be made on your NixOS machine |
| 1 | **Done** | 75 unit tests (Vitest) and 16 browser flows (Playwright, real Stockfish). Known bugs 1, 7, 9, 14 and 15 are expected-fail tests. The brand sweep (with allowlist) runs in CI. Pages and APK builds wait for the tests. CI is green on GitHub |
| 2 | **Done** | `src/core/` holds positions and moves, move-quality bands, the threat probe and the engine contract. 9 screens use it instead of their own copies. The opening lookup is indexed and proven identical to the old scan. Bug 4 (stale analysis lines) and bug 13 (threat arrows on harmless moves) are fixed; tests fail on the old code and pass on the new |
| 3 | **Done** | Fixed audit bugs 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15 and 16, plus the importer's stalled downloads. Every fix has a test that failed before it. Bugs 17 (desktop right-drag) and 18 (backgrounded batch review) are left for later as low value. The broken Puzzles and Lessons hub cards now have their styles (design audit fix A) |
| 4 | **Done** | App colour picker (Teal default, Plum, Copper, Brass) with every colour checked for contrast in a test. Display font picker (Sora default, System, plus any .woff2/.woff/.ttf/.otf file you add; kept on the device, not in backups). Chess.com's green is gone everywhere, including review badges, and the brand sweep has no pending hits left. Visual foundation from the design audit: three surface steps, tinted primary cards, real buttons instead of blue links, one line-icon set (Lucide, bundled), display face on headings and big numbers, readable board coordinates, Settings in sections that open and close |
| 5 | **Done** | Coach engine in `src/core/coach/`: facts from the board and Stockfish's lines (hanging pieces, cheaper-piece captures, allowed mates, forks, pins, skewers, material lost along the reply, missed mates and wins, missed punishments, early queen, king walks, recaptures, praise), worded by original English templates. Game Review shows a one-line summary, an explanation for every move, threat arrows and squares from the coach, and "Show the reply". Checked on a real sub-1000 game; three wording errors found that way were fixed and are now tests |
| 6 | **Done** | Game Review opens on a summary (coach line, accuracies, phases, badge counts, key moments, graph with markers for your mistakes) with Start review. Move by move: Next and previous key moment (from your last book move), the coach line, Show the reply, best move, and an in-place Retry with a two-step hint, coach feedback on wrong tries (without giving the answer away) and Give up. Play it out vs a bot stays as a second button |
| 7 | **Done** | Help levels (On my own, Some help, Full help, Custom) chosen on the bot picker and changeable mid-game in a Help sheet: eval bar, threat arrows (real threats only), best-move arrow, coach switch, bot chat, and Resign. New game layout: bot and player plates (material, help level), the bot's line attached to its plate so the board no longer jumps, the move strip, and a bottom action bar (Hint, Takeback, Coach on/off, Help). The picker remembers your level, has a Recent opponents row and opens at the level you last played. Old games keep their old behaviour |
| 8 | **Done** | With Coach on, a line under your plate after each move that matters: every inaccuracy, mistake or blunder gets the reason (from the same coach engine as Game Review) and a Take it back button; great moves, wins of material and checkmate get praise, and a plain best move only now and then so it doesn't nag. Hint is two steps: the idea and the piece first, then Show move draws the arrow. Also fixed a bug found on the way: moving before the engine had judged the position left the evals one short for the rest of the game, which silenced the eval bar, threat arrows and coach |

