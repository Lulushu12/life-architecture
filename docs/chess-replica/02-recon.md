# Recon map: chess.com mobile app (iOS and Android), your slice

**Scope:** Play vs Bots, the in-game Coach and hints, Game Review, the analysis board, puzzles, game history, plus the navigation and flows that connect them. Lessons are covered briefly for context.
**For:** one player, rated a little under 1000, who plays mostly bots and Coach. Personal use.
**Date:** 2026-10-09.
**Method:** Replica `replica-recon`, public sources only.
- Sources were official help-centre articles, chess.com public news and blog posts, the App Store listing, the public brand page, public forum threads, and database.lichess.org.
- No login, no app code, no bundles, no network traffic.
- Google Play would not render, and Reddit could not be read directly. Reddit material was left out rather than read through third-party mirrors.

**Confidence:** **H** means an official help article or store listing. **M** means several secondary sources agree. **L** means a single secondary source or an inference.

**Every layout detail (position, colour, placement) is L unless the row says an official article describes it.** Chess.com changes its app often. Anything dated before 2025 is flagged as possibly outdated.

## Sources

| # | Source | URL | Notes |
| --- | --- | --- | --- |
| 1 | Help: playing the bots (Aug 2026) | https://support.chess.com/en/articles/8614091-how-can-i-play-against-the-chess-com-bots | Bot levels, options, assistance toggles |
| 2 | Help: bot crowns | https://support.chess.com/en/articles/8648611-how-can-i-reset-my-bot-crowns | Crowns per mode |
| 3 | Announcement: new vs computer (2020, possibly outdated) | https://www.chess.com/announcements/view/new-vs-computer | Challenge / Friendly / Assisted definitions |
| 4 | Help: playing the Coach (Apr 2026) | https://support.chess.com/en/articles/10877257-how-do-i-play-against-the-coach | Play Coach mode |
| 5 | News: Play Coach launch (Jun 2025) | https://www.chess.com/news/view/announcing-play-coach | What the Coach says and when |
| 6 | Help: managing the Coach (Aug 2026) | https://support.chess.com/en/articles/10812255-how-do-i-manage-the-coach | Coach settings, voice |
| 7 | Help: Game Review on the app | https://support.chess.com/en/articles/10328363-how-do-i-use-game-review-on-the-app | Review flow, Next / Show / Best / Retry |
| 8 | Help: how Game Review works | https://support.chess.com/en/articles/8584089-how-does-game-review-work | Key moments, hint buttons |
| 9 | Help: move classification (Feb 2026) | https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc | Expected Points model and thresholds |
| 10 | News: Game Review v2 (Mar 2023) | https://www.chess.com/news/view/chesscom-launches-game-review-v2 | Threat explanations, phase grades |
| 11 | Help: accuracy | https://support.chess.com/en/articles/8708970-how-is-accuracy-in-analysis-determined | CAPS2, formula unpublished |
| 12 | Help: Game Rating (Feb 2026) | https://support.chess.com/en/articles/10773754-how-is-game-rating-calculated-in-game-review | Per-game performance estimate |
| 13 | Help: analysis on the app (Feb 2025) | https://support.chess.com/en/articles/10473022-how-do-i-use-game-analysis-on-the-app | App analysis settings |
| 14 | Help: analysis board (Jan 2026) | https://support.chess.com/en/articles/8583825-how-do-i-use-the-analysis-board | Web analysis, import |
| 15 | Help: comments and variations | https://support.chess.com/en/articles/8648793-how-can-i-add-comments-and-variations-to-games | Variation tree (web) |
| 16 | Help: engines (Aug 2026) | https://support.chess.com/en/articles/9462780-chess-engines-on-chess-com-how-do-they-work | Stockfish 18 server, "Lite" local default |
| 17 | Help: Game Explorer | https://support.chess.com/en/articles/8708732-how-do-i-use-the-game-explorer | Masters and own-games explorer |
| 18 | Help: your own games (Aug 2026) | https://support.chess.com/en/articles/8598090-how-do-i-view-my-own-games | Archive tabs and filters |
| 19 | Help: saving bot games | https://support.chess.com/en/articles/8609271-can-i-save-my-games-against-the-bots | Auto-save rules |
| 20 | Help: puzzles overview (Sep 2026) | https://support.chess.com/en/articles/8608686-how-do-puzzles-work-on-chess-com | Rated, Rush, Battle, Daily, Custom |
| 21 | Help: puzzle ratings (Aug 2026) | https://support.chess.com/en/articles/8602396-how-do-puzzle-ratings-work | Glicko, difficulty levels |
| 22 | News: new puzzle rating system (Oct 2025) | https://www.chess.com/news/view/announcing-new-puzzles-rating-system | The re-rating |
| 23 | Help: next puzzle choice (Sep 2026) | https://support.chess.com/en/articles/8708983-how-are-the-next-puzzles-chosen-for-me-when-i-am-training | Pool near your rating |
| 24 | Help: Puzzle Points (Feb 2026) | https://support.chess.com/en/articles/9681952-what-are-puzzle-points-on-chess-com | Gamification layer |
| 25 | Help: Daily Puzzle (Sep 2026) | https://support.chess.com/en/articles/8708990-how-do-i-find-the-daily-puzzle | Hearts, calendar, streak |
| 26 | Help: lessons (Jul 2026) | https://support.chess.com/en/articles/8609703-how-do-lessons-work-on-chess-com | Learn Path, Library |
| 27 | Help: membership levels (Jul 2026) | https://support.chess.com/en/articles/8562418-what-does-each-level-of-membership-get-me | Free vs paid limits |
| 28 | App Store listing | https://apps.apple.com/us/app/chess-play-learn/id329218549 | 4.8 stars, about 838K ratings |
| 29 | Brand resources (Jun 2025) | https://www.chess.com/article/view/chess-com-brand-resources | The 10 classification icons; no hex values |
| 30 | Lichess puzzle database | https://database.lichess.org/ | CC0, 6,157,341 puzzles, columns |
| 31 | Lichess accuracy | https://lichess.org/page/accuracy | For the terminology comparison |

## Core loop (for you)

Play a bot (or the Coach) with assistance on. At game end, go straight to Game Review, where the Coach explains what happened in words. Then retry your mistakes, and fill the gaps with puzzles and lessons.

## Screens

| ID | Screen | How you reach it | Purpose | Key components | Conf. |
| --- | --- | --- | --- | --- | --- |
| S01 | Home | App launch | Task shortcuts | Tiles: Play Bots, Play Coach, Solve a Puzzle, Next Lesson; Daily Puzzle carousel; ratings; "Game Archive" link at the bottom | M (archive link H) |
| S02 | Bottom tab bar | Always visible | Top-level navigation | Officially mentioned: Home, Learn, Watch, More, plus Puzzles in an older article. Exact current set not confirmed | L |
| S03 | Bot list | S01 Play Bots | Pick an opponent | Levels Beginner 250-850 (15 bots), Intermediate 1000-1400 (15), Advanced 1500-2100 (20), Master 2200-2450 (10), Engine slider 250-3200, Adaptive, personality and seasonal bots, crowns, locks | H |
| S04 | Bot Options sheet | S03 Options | Set up the game | Mode preset (Challenge, Friendly, Assisted, Custom), time control or none, colour, toggles: Bot Chat, Eval Bar, Threat Arrows, Suggestion Arrows, Move Feedback, Engine | H |
| S05 | Bot game | S04 Play | Play | Board, chat, Hint, Undo, Options | H items, L layout |
| S06 | Play Coach setup | S01 Play Coach, or Learn then Play Coach | Coach game setup | Strength, colour, coach picker | H |
| S07 | Coach game | S06 | Guided game | Feedback bubble after your moves, 2-step Hint, unlimited Undo, Resign, settings cog | H items, L layout |
| S08 | Game Over pop-up | End of any game | Next action | Quick on-device review; Rematch, New game, Game Review | H |
| S09 | Review summary | S08 Game Review, or from the archive | Overview | Coach one-liner, eval graph, accuracy both sides, Game Rating, count per classification, phase grades, Skills points, Start | H items, L layout |
| S10 | Review move-by-move | S09 Start | Learn from the game | Coach bubble (text, optional voice), move list with icons, Next (key moment), Show, Best, Retry, hint buttons ("Show Fork", "Show Lost Piece", "Show Checkmate", "Show Idea") | H |
| S11 | Review settings | S10 cog | Tune the review | Voice, Skills, Coach avatar, best moves, eval bar position, engine, strength | H |
| S12 | Analysis | S10 magnifier, or More then Analysis | Free analysis | Eval bar, engine lines, suggestion and threat arrows, Move Feedback (can't be on with Engine Lines), Options: reset, flip, share, Finish vs Bot | H (app) |
| S13 | Explorer | Analysis then Explore | Opening data | Masters (about 3M games), your games, a member's games; results bars | H |
| S14 | Game Archive | Bottom of S01 | History | Infinite scroll; filters behind a magnifier; tabs All, Favorites, Live, Daily, Bot, Coach (web) | H (web), L (app fields) |
| S15 | Puzzles hub | Tab or S01 | Choose a mode | Rated, Rush, Battle, Daily, Custom | M |
| S16 | Rated puzzle | S15 | Training | Board, hint, timer, Puzzle Points bar, gear (difficulty: Standard, Hard, Extra Hard) | H items |
| S17 | Puzzle result panel | After S16 | Feedback | Rating change, target time, pass rate, attempts, themes, next or retry | H |
| S18 | Rush | S15 | Timed run | 3 min, 5 min or Survival; 3 strikes; end list of puzzles, reopenable | H |
| S19 | Daily Puzzle and calendar | S01 carousel | Habit | 5 hearts, Coach tip on a wrong move, 2-step hint, calendar with streak flames | H |
| S20 | Custom Puzzles | S15 | Targeted practice | Themes, rating range, all or failed-only, % solved per theme | H |
| S21 | Learn | Learn tab | Courses | Learn Path (New to Chess, Beginner, Intermediate, Advanced), Next Lesson, Library | H (partly web-only) |

## Flows (happy path; tap counts estimated, L)

```
F01 Play a bot with help on
    S01 -> S03 -> S04 -> S05
    taps: about 3, or 5-7 when changing settings
    edge: locked bots on the free tier; mode decides crowns

F02 Finish a game and understand it
    S05 -> S08 -> S09 -> S10 (Next / Show / Best / Retry)
    taps: 1 to reach the review, then 1 per key moment
    edge: free tier gets 1 full review a day; quick-review labels can change after the full review

F03 Play a Coach game
    S01 -> S06 -> S07
    taps: about 2
    edge: free tier gets 1 Coach game a month

F04 Retry a mistake from the review
    S10 Retry -> try a move -> Coach feedback, hint available
    taps: 1 plus your move

F05 Daily puzzle
    S01 carousel -> S19
    taps: 1
    edge: each puzzle must be solved within 48 h to keep the streak

F06 Rated puzzles
    S01 or tab -> S15 -> S16 -> S17 -> next
    taps: 2 to start
    edge: free tier gets 3 a day; a hint counts as a fail

F07 Find an old game and review it
    S01 scroll -> S14 -> filter -> game -> S09
    taps: about 3 plus a scroll

F08 Analyse a position
    More -> Analysis (S12), or from S10 via the magnifier
    taps: 2
```

## Components that matter for your app

| Component | Variants and states | Used on |
| --- | --- | --- |
| Coach feedback bubble | Praise, mistake, explanation, prompt-to-find; with an arrow or square highlight | S07, S10, S19 |
| Two-step hint | Step 1: idea or piece highlighted. Step 2: the move | S07, S10 Retry, S16, S19 |
| Assistance toggles | Eval bar, threat arrows (red), suggestion arrows (green), move feedback, engine lines | S04, S07, S12 |
| Classification badge | 10 kinds, glyph plus colour | S09, S10, S14 |
| Key-moment stepper | A "Next" button that jumps to the next critical move | S10 |
| Action trio | Show / Best / Retry | S10 |
| Game-over sheet | Rematch / New / Review | S08 |
| Hearts | 5 to 0 | S19 |

## Inferred data model (only what affects your app)

```
BotGame      bot, mode (assistance preset), toggles used, hints used, undos used, result, crowns
             evidence: S03, S04, crowns article             confidence: high
Review       per move: classification, expected-points loss, best move, coach text, key-moment flag;
             per game: accuracy, accuracy per phase, game rating, counts
             evidence: S09, S10, articles 9-12              confidence: high (fields), guess (storage)
PuzzleAttempt puzzle, rating before/after, time, hints used, success, difficulty setting
             evidence: S16, S17, article 21                 confidence: high
DailyPuzzle  date, puzzle, hearts left, solved within 48 h
             evidence: S19                                   confidence: high
```

## Method notes that are facts, not assets

- **Classification thresholds** (H, source 9). A move's label comes from how much "expected points" it loses: Excellent under 0.02, Good 0.02 to 0.05, Inaccuracy 0.05 to 0.10, Mistake 0.10 to 0.20, Blunder 0.20 or more. The win chance takes the player's rating into account, and Brilliant and Great are judged more generously for newer players. A Blunder must also lose material or allow mate. **Your app already uses the same cut-offs** on its win% drop (`review.js:127-131`). A published method is not an asset, so this is fine.
- **Engines** (H, source 16). The local default is Stockfish 18 "Lite" (handcrafted evaluation, no neural net); full NNUE is for members. **Your app runs full NNUE locally by default.**
- **Free-tier limits** (H, source 27): 1 full review a day, 3 rated puzzles a day, 1 Coach game a month, about 20 bots. Diamond adds "Coach explanations on all of your moves".

## Brand check (for the sweep)

| Item | Finding | Conf. |
| --- | --- | --- |
| Signature green | `#81b64c` is chess.com's brand colour (Simple Icons cites their brand page, and a third-party homepage sample from Aug 2026 agrees). **Your `--accent` and `--ok` are exactly this value**, and so are the badges for Best and Excellent. | M |
| Classification names | The 10 labels (Brilliant, Great, Best, Excellent, Good, Book, Inaccuracy, Mistake, Miss, Blunder) are chess.com's Game Review set. Lichess uses only inaccuracy, mistake and blunder. Your app has the same 10 plus "Forced", which is **not** a chess.com label. "!!" and "!" are generic annotation symbols. | H |
| Badge colours | No official values are published. Compared with a third-party clone's approximations: your Great `#5c8bb0` vs `#5b8baf`, Book `#a88865` vs `#a88764` and Mistake `#e58f2a` vs `#e28c28` are near-identical. The rest differ. | L |
| Board colours | Your "Green" theme (`#ffffdd` / `#86a666`) is not chess.com's green board (`#ebecd0` / `#779556` per a third-party sample, L). No match. | L |
| Pieces | None of your 33 sets is chess.com's "Neo". cburnett, merida and kosal are open-licensed sets from Lichess's collection. | H |

## Out of scope

- Puzzle Battle, live multiplayer, Watch and streamers: network features.
- Celebrity coaches and voices (real people's names and likenesses) and celebrity bots: not to be cloned under your rules.
- Coach text and bot chat text: not to be copied. Only the *kinds* of feedback are recorded here.
- Puzzle Points tiers and pawn skins, Skills points, crowns art: gamification art and branding.
- Membership and paywall, Cloud Analysis, the Torch engine: their servers.
- The Masters explorer database (about 3M games): their data. Your app has its own pro games database.

## Size

21 screens and 8 flows in your slice. Hard parts for your app:
1. A Coach that explains moves in words, offline and rule-based.
2. Assistance modes wired into the bot game.
3. A review screen split into summary, then move-by-move with Show / Best / Retry.

None needs a server. Overall size for your slice: **M**, once the Phase 0 restructure is done.
