# Gap analysis: your app vs chess.com (Phase 3, gate 2)

Date: 2026-10-09. Inputs: `01-audit.md` (your app), `02-recon.md` (chess.com, public sources), `features.csv` (the feature matrix), and `parity.md` (Replica's `parity.py` output).

## How to read this

- **Value to me** is judged for you specifically: under 1000, mostly bots and Coach, few games against people, and a goal of replacing chess.com. **H** means you'd use it every session, **M** weekly, **L** rarely.
- **Cost** assumes the Phase 0 restructure from the audit is done. S is a day or two of focused work, M is about a week, L is more than that.
- Rows marked **(coach)** depend on the coach engine described below. Build that once and those rows all become S.
- Recommendations:
  - **adopt**: build the same capability, in your own words and look.
  - **adapt**: take the idea, change it to fit you.
  - **skip**: don't build it.
  - **mine is better**: protect what you have.

## Parity score

Replica's `parity.py` gives **47.2 / 100** on the slice you use, with must-haves 8 of 22 done. The priorities behind that score are *your* value ratings, not chess.com's, so this measures "how much of what I'd use is there".

By area, weakest first:

| Area | Score |
| --- | --- |
| Coach | 0 |
| Lessons | 33 |
| Review | 48 |
| Bots | 50 |
| Puzzles | 53 |
| Analysis | 58 |
| Navigation | 63 |
| History | 71 |

Your 10 strengths are left out of the score, because the tool doesn't count features chess.com lacks. The number is honest but one-sided; see "Where your app is already better".

## The one thing that matters most

**The coach is the gap.** Everything chess.com does that you'd miss hangs off one capability: turning engine output into a sentence a beginner understands. Examples:
- "your bishop on c4 is now undefended"
- "this lets a knight fork your king and rook"
- "you missed that their queen was hanging"

Your app already computes almost all the raw material: multipv lines, the line after your move, the threat probe, and win% drops. It just never turns that into words.

**Proposed coach engine** (offline, rule-based, written from scratch). It would sit in a chess-core module and run on a position before and after a move, plus the engine's lines. It would detect:
- material lost along the best reply line
- a piece left hanging or newly undefended, checked by static exchange
- an allowed fork, pin or skewer, or a discovered attack
- an allowed mate threat or back-rank weakness
- a missed capture or missed mate
- king safety after castling rights are lost
- opening principles (undeveloped pieces, early queen moves), in the first 10 moves only

Each finding becomes a short sentence from your own templates, with an arrow or a highlighted square. The optional Claude extra would get the same facts as structured input when online, and write a richer explanation. Claude never sees your games unless you switch it on.

Cost: **L** for the engine, then S per surface (in-game feedback, hint step 1, review explanations, puzzle tips).

## Feature table

| Area | Chess.com has | Your app has | Gap | Value to me | Cost | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| Bots | 100+ bots; the level tiers run 250 to 2450, plus an engine slider to 3200; free tier gets about 20 | 150 bots from 800 to 3200, in Romanian and English | Nothing below 800 | L (you said fine) | S | **skip** for now |
| Bots | Adaptive bots | Fixed-strength bots | No adaptation | L | S | **skip** (could later: nudge the bot ±50 after each result) |
| Bots | Assistance presets (Challenge, Friendly, Assisted, Custom) with toggles: eval bar, threat arrows, suggestion arrows, move feedback, engine lines | One "serious mode" toggle, an on-demand hint and takeback | No presets; threat arrows, suggestion arrows and move feedback missing in games | **H** | S | **adapt**: your own preset names (for example "On my own", "Some help", "Full help", "Custom"), shown as chips on the picker and changeable mid-game from a sheet |
| Bots | Red threat arrows during play | None in games; the Review/Analysis probe is buggy | Missing, and the probe shows non-threats | **H** for a beginner (stops hung pieces) | S | **adopt**, after fixing the probe so it only shows real threats |
| Bots | Move feedback after each move | None | Missing | **H** | S (coach) | **adopt** as one coach surface |
| Bots | Crowns per bot by how much help you used | W-D-L that ignores hints and takebacks | Can't tell clean wins from assisted ones | M | S | **adapt**: record the help used per game; show clean W-D-L and assisted W-D-L |
| Bots | Time controls vs bots | None (clocks only in pass & play) | Missing | L (you play untimed) | M | **skip** |
| Bots | Bot chat | Bilingual banter tied to game events, cooldowns, mute, optional LLM | None | n/a | n/a | **mine is better** |
| Bots | Finish vs bot from analysis | From the editor and lessons; review Retry is buggy; none from analysis | Partial, plus a data-loss bug | M | S | **adopt** "Play from here" in analysis, and fix the review path to ask before replacing a game |
| Coach | Play Coach: a guided game where the coach praises, flags mistakes and explains tactics and positional ideas after your moves | Nothing | Whole feature | **H** | L (engine) + S | **adapt**: no separate "coach mode". Move feedback is one switch inside any bot game, so every bot can be a coach game. Fewer screens, same value |
| Coach | Prompts you to find the idea first | Nothing | Missing | **H** | S (coach) | **adopt** |
| Coach | Two-step hint: the idea, then the move | One step: the move arrow | Missing step 1 | **H** | S (coach) | **adopt**: step 1 highlights the piece and names the motif ("there's a fork"); step 2 is the arrow |
| Coach | Voice | None | Missing | L | S (on-device speech) | **skip** for now |
| Coach | Celebrity coaches | None | n/a | none | n/a | **skip** (real people) |
| Coach | Richer explanations on the paid tier | Nothing | n/a | M | M | **adapt**: optional Claude explanations when online, off by default, key kept out of backups |
| Review | 10 move labels, rating-aware | Same 10 plus Forced, same thresholds, not rating-aware | Brand closeness (see below); not rating-aware | M | S | **adapt**: keep the mechanics, rebrand colours and glyphs. Skip rating-aware tuning |
| Review | Accuracy overall and per phase | Same | None | M | n/a | parity |
| Review | Per-game "Game Rating" | Performance rating over your last 20 games in Stats | Per-game number missing | L | S | **skip**: the formula is unpublished, so ours would be invented precision |
| Review | Summary screen: coach one-liner, graph, accuracy, counts, phases, then Start | One long page with everything at once | No summary-first layout, no one-liner | **H** | S (coach) | **adopt** |
| Review | Key moments with a Next button | 3 chips | No stepper | **H** | S | **adopt**: Next / Previous key moment, starting from your last book move |
| Review | Coach explains why a move was bad, with "show fork / lost piece / checkmate" | Label plus "best was X" | No why | **H** | S (coach) | **adopt** |
| Review | Show: play out what happens after your move | Line is stored, never shown | Display only | **H** | S | **adopt** |
| Review | Best, with the reason | Best move and arrow | No reason | **H** | S (coach) | **adopt** |
| Review | Retry: find the better move, hint, feedback | Starts a bot game and wipes your current one | Wrong feature, plus a data-loss bug | **H** | S | **adopt**: an in-place retry with a hint and coach feedback. Keep "play it out vs a bot" as a second button that asks first |
| Review | Opening plus "you've played this N times" | Opening name only | History missing | L | S | **could** later |
| Review | 1 full review a day free; unlimited on Platinum and above | Unlimited, offline, on the device | None | n/a | n/a | **mine is better** |
| Analysis | Engine lines, eval, arrows, settings | 5 lines, eval, threats, verdicts | Stale-lines bug; threat probe bug | M | S | **fix** (bugs 4 and 13) |
| Analysis | Variation tree with comments (web) | One line plus 8 stashed lines | No tree | L | M | **skip** for now; the Phase 0 move-tree makes it cheap later |
| Analysis | Save analysis | Lost when you leave | Missing | M | S | **adopt**, after the data layer |
| Analysis | FEN / PGN / set-up import | Same, but a PGN with a FEN header crashes the app | Bug 1 | M | S | **fix** |
| Analysis | Masters explorer | Lichess-based explorer plus a 982-event pro database | No masters stats | L | n/a | **mine is already better** for you: offline, plus the opening drill |
| History | Archive tabs and filters (bot, coach, favourites, result, date) | Flat list, stars, PGN export | No filters | M | S | **adopt**: tabs All / Starred / Bots / Imported, result filter, accuracy on each row |
| History | Keeps every game | Capped at 50 | Cap | M | S after the data layer | **adopt**: lift the cap once games live in IndexedDB |
| Puzzles | Rated, Glicko, near your rating, 3 a day free | Elo, near your rating, unlimited | Glicko vs Elo doesn't matter for one player | n/a | n/a | **mine is better** (unlimited, offline) |
| Puzzles | 500k+ puzzles; difficulty Standard / Hard / Extra Hard | 7,200; 1,200 under 1000 and 1,200 at 1000-1299 | Depth in your band | **H** | S | **adapt**: re-sample Lichess (CC0) for about 15k puzzles rated 400 to 1400, beginner themes weighted. Add a difficulty offset |
| Puzzles | Any mate accepted | Tier trainer rejects alternative mates | Bug 3 | **H** | S | **fix** |
| Puzzles | Daily puzzle: hearts, coach tip, calendar, streak | Nothing | Missing | M | S | **adapt**: one bundled puzzle per date (Lichess marks its past dailies), hearts, a streak, and a Life Architecture quest hook |
| Puzzles | Rush: 3 min, 5 min, Survival | Rush 3 min plus Streak | 5 min and Survival | L | S | **could** |
| Puzzles | Custom: themes, rating range, failed-only | Theme filter, spaced review | Rating range | M | S | **adapt**: add a rating-range slider |
| Puzzles | Coach tip on a wrong move | "Not that one, try again" | Missing | M | S (coach) | **adopt** |
| Puzzles | Battle, Points tiers, skins | n/a | n/a | none | n/a | **skip** |
| Lessons | Learn Path from New to Chess up, with Next Lesson and locked/open/done tiles | 72 lessons by category; completion means nothing | No path; beginner content starts at tactics | M | S (path) / M (new content) | **adapt**: a path ordering of your existing lessons, a Next Lesson button, and completion that requires passing the quizzes. New "rules" content: **skip** unless you want it |
| Navigation | Task-first Home (Play Bots, Coach, Solve a Puzzle, Next Lesson, Daily Puzzle) | 12 equal tiles plus a resume card | No priority | M | S | **adapt** (per-screen section below) |
| Navigation | Game-over sheet: Review / Rematch / New | Review / New | No rematch | M | S | **adopt** |
| Navigation | Bottom tab bar | None | Missing | L | M | **skip**: your home is one tap from everything; a tab bar is restyling |

## Where your app is already better (protect these)

1. **Unlimited and offline.** Reviews, puzzles, lessons and bots have no daily limits and no account, and keep working in airplane mode. Chess.com's free tier gets 1 review a day, 3 puzzles a day and 1 Coach game a month.
2. **Full Stockfish NNUE on the device by default.** Chess.com's local default is a lighter, handcrafted-evaluation engine.
3. **Puzzles from your own blunders**, with spaced review at 1/3/7/21 days. Recon found no chess.com equivalent built from your own games.
4. **Romanian and English bots with event-driven banter**, plus an optional LLM. You can't get this anywhere else.
5. **Your board and piece look**: 34 themes, 33 sets including your own generated ones, and custom colours. None of it comes from chess.com.
6. **A pro games database and live broadcasts offline, the opening drill, engine match and the position editor.**
7. **Your data is yours**: PGN export, JSON backup, import from both Lichess and chess.com.
8. **Life Architecture integration**: games already feed your quest ledger. Daily puzzles can too.

Rule for the build: none of these regress. The Phase 0 tests cover 1, 3, 5 and 7 explicitly.

## Brand findings (decide at this gate)

| Finding | Confidence | Recommendation |
| --- | --- | --- |
| Your `--accent`, `--ok` and the Best/Excellent badges are `#81b64c`, chess.com's brand green | M | **Change it.** It's one UI token, not a board theme, so your themes stay. I'd propose 2 or 3 alternatives checked with Replica's contrast tool for you to pick from. S |
| The same 10 classification names | H | **Keep the words.** "Best", "Mistake", "Blunder" and so on are ordinary chess vocabulary, and "!!" and "!" are standard annotation marks. Your list (10 plus Forced) already differs. Your call if you want to rename "Great" and "Miss" too. |
| Great, Book and Mistake badge colours are near-identical to a third-party approximation of chess.com's | L | **Recolour all badges** to your own palette when you change the accent. S |
| Two code comments say "chess.com style" | H | Reword them. Trivial. |
| Stockfish's GPL notice mentions Chess.com, LLC | H | **Must stay** (licence). Sweep allowlist. |
| The chess.com importer | H | Stays (you asked for it). Sweep allowlist. |

## Interface and flows: where chess.com is better, per screen

Each item is a targeted change, not a restyle. Your colours (after the accent swap), type, spacing and themes stay.

**Home**
- *Theirs:* the most-used tasks come first, and the daily puzzle sits on the home screen.
- *Change:*
  - Keep the resume card.
  - Add a row of 3 or 4 large tiles: "Play again vs (last bot)", Daily puzzle, "Puzzles due: N", Next lesson.
  - Move the other 12 tiles into a smaller grid below.
  - Show the unsolved-blunder count on the puzzles tile (it's there today).

**Bot picker**
- *Theirs:* a compact list, with an Options sheet that holds the mode presets.
- *Today you scroll 25 levels × 3 bots from 800 upward.*
- *Change:*
  - Open scrolled to bots near your performance rating, with a "Recent opponents" row at the top.
  - Put the assistance-preset chips above the list, replacing the lone "serious mode" toggle. Serious mode becomes the "On my own" preset.

**Bot game**
- *Theirs:* coach or feedback in a bubble, a bottom bar (Hint, Undo, Resign) and a settings cog for the toggles.
- *Change:*
  - Put a single feedback strip under the board for the coach and the bot's chat, so the board stops shifting when chat appears (today the chat area above the board is 58 px).
  - The hint becomes two-step.
  - Add a small toggles sheet (eval bar, threats, suggestion, feedback) reachable mid-game.
  - Move Resign into that sheet instead of the top bar, to make accidental taps less likely.

**Game over**
- *Theirs:* a sheet with Review / Rematch / New.
- *Change:* add Rematch (same bot, colours swapped) and a one-line result. Optionally run the quick review on the spot so accuracy shows straight away.

**Review**
- *Theirs:* a summary first, then move-by-move with Next key moment and Show / Best / Retry.
- *Change:*
  - Open on a summary card: coach one-liner, both accuracies, counts per label, phase accuracy, and a "Start review" button.
  - Move-by-move view: a coach explanation panel under the board, plus 4 buttons:
    - Next key moment
    - Show (the line after your move)
    - Best (with the reason)
    - Retry (in place)
  - Markers on the graph for your mistakes and blunders.

**Analysis**
- *Theirs:* the same tools, plus "Finish vs Bot" and Save.
- *Change:* add "Play from here" and "Save" to the existing toolbar. Fix bugs 1, 4, 13 and 16 (from the audit).

**Archive**
- *Theirs:* tabs and filters.
- *Change:* tabs (All / Starred / Bots / Imported) and a result filter. Rows already show accuracy.

**Puzzles hub**
- *Theirs:* the daily puzzle and a clear choice of modes.
- *Change:* daily puzzle card at the top, then "Due today", then Rated and Rush, then Themes with a rating range.

**Lessons**
- *Theirs:* a path with Next Lesson.
- *Change:* add a "Next lesson" card at the top of the list, following your path order. Completion requires passing the quizzes.

## Questions for you at this gate

1. **Coach language:** English only, or Romanian too, like the bots? Bilingual roughly doubles the template-writing work in the coach engine, not the logic.
2. **Accent colour:** OK to replace `#81b64c` and recolour the review badges? Your board themes and piece sets are untouched either way.
3. **"Coach mode" as a toggle inside bot games, rather than a separate Coach opponent:** agree? It is the bigger structural choice in this table.
4. **Puzzle re-sample:** about 15k puzzles rated 400 to 1400 (roughly 2 MB). Fine, or smaller?
5. **Optional Claude explanations:** do you want this in the plan at all? If yes, the key handling needs care, because every app on `lulushu12.github.io` can read localStorage. The safest option is to keep the key only in the APK, or behind a small proxy on your NixOS box later.

## Gate 2 answers (2026-10-09)

1. **Coach language:** English only. All coach phrases go in one file keyed by finding, so Romanian can be added later without touching the logic.
2. **Accent colour:** options below; your pick is pending.
3. **Coaching as a switch inside bot games:** agreed, on condition that it can be changed mid-game. The toggles sheet in the bot game handles that.
4. **Puzzles:** keep the bundled set as it is. **The re-sample row is dropped.** You're happy to dabble in harder tiers.
5. **Claude explanations:** keep the existing LLM code and add the Claude layer later. Asked: can the coach work like chess.com's, even if rough and repeatable, without a language model? Yes; see "The coach is templates, not a trained model" below.
6. **Rushing:** you're under 1000 mainly because you rush. Untimed, you hold your own against bots from the low 1000s up to the mid 1000s. Added row:

| Area | Chess.com has | Your app has | Gap | Value to me | Cost | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| Coach | Feedback only after the move (as far as recon found) | Nothing | A check *before* a move lands | **H** (targets rushing) | S (coach) | **mine will be better**: in help presets, a move that hangs material or allows mate pauses with a nudge ("look at their knight first"), which you can override. It fades: it's off in "On my own", and Stats counts how often it saved you, so you can see the habit improving |

7. **Desktop is NixOS; browser versions are rarely used.** So:
   - Pages is not needed for chess.
   - Sync between devices has no real use for you yet.
   - See "Scope changes" below.

### The coach is templates, not a trained model

- **How chess.com generates its coach text: I don't know.** Public sources describe what the coach says, not how it's produced. That it feels "repeatable" suggests prewritten phrases filled in from engine facts, but that is an inference.
- **The rule-based coach planned here is exactly that kind of system:**
  - The engine and chess rules produce facts, for example "the move left the knight on c3 undefended" or "it allows Qxf7#".
  - Each fact type has 3 to 5 phrasings of your own, rotated, with the piece, square and line filled in.
  - It is fast, offline and small, and it is right whenever the facts are right.
- **Training or running a language model for this: no.**
  - Training one needs a large set of annotated moves, GPU time, and weeks of work, and the result would still be worse than templates.
  - A small off-the-shelf model running on the device means a 0.5 to 1 GB download, slow replies on a phone, and wrong chess claims. Language models are bad at reading boards.
  - Either way, it would still need the same rule engine underneath to supply the facts.
- The later Claude option slots in on top: it gets the same structured facts and rewrites them more richly when online. **It never decides what is true about the position.**

### Accent colour options

All pass WCAG AA on your background (`#161512`) and surface (`#211f1c`), and with your dark button text (`#141b0b`). Checked with Replica's `contrast.py`.

| Option | Hex | On background | Dark text on it | Clashes with |
| --- | --- | --- | --- | --- |
| Plum | `#a58be0` | 6.41:1 | 6.19:1 | nothing in the app; no chess site uses it as its brand colour, as far as I know |
| Teal | `#3fb3a4` | 7.13:1 | 6.88:1 | the current Brilliant badge (to be recoloured anyway) |
| Copper | `#d98a4e` | 6.69:1 | 6.46:1 | the Mistake orange `#e58f2a`, which is too close |
| Brass | `#e0b34a` | 9.32:1 | 9.00:1 | the gold and Inaccuracy yellow `#f0c15c`, which is too close |

- **Recommendation: plum.**
- **Success green:** `--ok` (used for "solved" messages) stays green, because green means success, but moves off chess.com's exact value, for example to `#5fae6e`.
- **Badges:**
  - Keep the universal yellow, orange and red for inaccuracy, mistake and blunder. Lichess uses the same family.
  - Recolour the distinctive ones: Brilliant in the plum family, Great in a clear blue, Best and Excellent in the new success green, and Book in sand.

### Scope changes from these answers

- **Device sync: dropped for now.** Your fixed decision says "only where needed", and with phone-first use it isn't needed. Backup and restore stays as the safety net.
- **The IndexedDB restructure (audit section 4) shrinks from L to "defer".**
  - Each APK has its own storage, so chess isn't sharing 5 MB with the other apps there.
  - The 50-game cap is the only remaining driver. Moving just games and reviews to IndexedDB (M) can come later, if the cap starts to bite.
- **Offline hardening for the web version (S): deprioritised,** since the APK bundles everything.
- **Pages and a private repo:** one optional step at the end of the roadmap:
  1. Back up any web-app data.
  2. Make the repo private and stop the Pages deploy.
  3. Build only the APK that changed, to stay within the free Actions allowance.
  4. Serve the desktop build locally on your NixOS machine.
- **Phase 0 is now:** a test harness (M) plus a chess-core module (M). That is what the coach engine is built on.
