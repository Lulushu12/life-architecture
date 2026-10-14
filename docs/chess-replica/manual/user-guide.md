---
title: Chess User Guide
---

# About this guide

This is Part 1 of the chess app's manual: how to use it. It describes the app as it stands after the replica plan (items 1 to 16), on `main` as of 14 October 2026.

**This is a sample edition.** Every chapter opens with a short overview and how to get there, then covers **one feature in full**. The chapter's other features are listed at the end under **To come**. Once the format is settled, those get written the same way.

How to read it:

- **Bold text** is exactly what the app shows on screen: a button, a heading, a label.
- **Watch out** lists cover behaviour that is easy to miss or likely to surprise you. Some of these are probably bugs; the last chapter collects those.
- **Code** lines name the source files under `apps/chess/src/` that implement the feature. Start there when something misbehaves.
- The app runs in two places: in a browser as an installable web app (the **web** version, at `/chess/` on GitHub Pages), and as an **Android** app (the APK). They are the same app; where they differ, the guide says so.

Everything runs on the device. There are no accounts and no server. Stockfish 16 NNUE plays and analyses locally, and your data lives in the app's own storage until you back it up (chapter 15).

# 1. Home

Home is the screen the app opens on. It shows what you were doing, what's waiting for you today, and a list of everything else. The **‹** back arrow on most screens returns here.

The app also remembers the last screen you had open, so reopening it can land you there instead of on Home.

## The Home screen (sample)

From top to bottom, Home has a title (**Chess.**), a large card, four tiles, and a list headed **Everything else**.

### The large card

Which card you see depends on your state. The app picks the first that applies:

1. **A game is in progress.** The card shows the live position on a small board.
   - Bot game: **Your move** or **Their move**, then **vs {bot name}**, with the bot's rating, your help level and the move number.
   - Pass & play game: **Pass & play**, then **White to move** or **Black to move**.
   - **Resume game** takes you back to it.
2. **No game in progress, but you've played a bot before.** The card shows **Last game: won/lost/drawn** and **Play again vs {bot name}**, with that bot's rating, your record against it (wins-draws-losses), and your help level.
   - **Play again** starts a new game at once against the same bot, with the same colour as last time and your saved help level.
3. **First run.** **Welcome / Play your first game**, with the line "Pick a bot from 800 up; help is on until you turn it off." Tapping it opens the bot picker.

### The four tiles

| Tile | Big number | Line underneath | Opens |
|---|---|---|---|
| **Daily puzzle** | your streak in days | **New today · 5 hearts**, **N hearts left**, **Solved today ✓** or **Out of hearts today** | today's daily puzzle |
| **Due for review** | puzzles due today | **puzzles you missed** or **nothing due today** | the review queue, or Puzzles if nothing is due |
| **Next lesson** | lessons done / total | the next lesson's title, or **all done** | that lesson |
| **Play bots** | your last opponent's avatar | **last: {name} · W-D-L**, or **choose an opponent** | the bot picker |

### Everything else

In order: **Puzzles · rating N**, **Pass & play**, **Lessons**, **Openings**, **Analysis**, **Game archive**, **Stats**, **Import games**, **Pro games**, **Custom position**, **Engine match**, **Settings & themes**.

The footer reads "Everything runs on this phone, Stockfish 16 NNUE included." The web version adds that the first visit downloads the 39 MB engine net once, and after that it works fully offline.

### Shortcuts

On the installed web app, long-pressing the icon offers three shortcuts: **Play a bot**, **Puzzles** and **Analysis board**. They open those screens directly. The Android app has no shortcuts.

### Banners and messages

A red banner at the top of every screen warns about storage. Only one shows at a time:

- **Storage full: changes are not being saved.** Saving has failed. Nothing you do is kept until you free space. Export and delete old games in the Archive.
- **Saved data was unreadable and has been reset.** The app couldn't read its data on startup and started fresh. The unreadable copy is kept in storage under `chess-v1.corrupt`.
- **Storage nearly full: about X of 5 MB used.** Your games and puzzles are over 85% of a 5 MB budget.

You may also see:

- **Update available**, with **Reload** (web only): a new version is ready.
- **Archive full: N old games were removed. Star games to keep them.** The archive holds 50 games (chapter 6).

### Watch out

- **Play again** on Home keeps your colour. **Rematch** at the end of a game swaps colours. Same bot, different behaviour.
- The 5 MB storage figure only counts games and puzzles, not everything the app stores. The real limit is the browser's and can be hit before the banner says "nearly full".
- On the web, the chess app shares its storage with the other Life Architecture apps on the same site.

**Code:** `Home.jsx`, `App.jsx` (`StorageBanner`, shortcut `ACTIONS`), `public/manifest.json`.

#### To come

- Resuming a game after closing the app
- What "clean" and "assisted" mean on the cards

# 2. Play vs Bot

You play against one of 150 bots, all driven by the local Stockfish. There are two casts of 75, one speaking Romanian and one English, from 800 to 3200 in steps of 100, with three bots at each level. Each bot has a personality that shows in its chat and, at low levels, in how it plays.

Reach it from the **Play bots** tile, the Home card's **Play again** or **Resume game**, or the shortcut.

## Starting a bot game (sample)

Starting a game happens on the **Choose your opponent** screen.

### Step by step

1. **Bots speak:** choose **Română** or **English**. The default is Română. This switches which 75 bots you see and the language they chat in. The coach always speaks English.
2. **You play:** choose **White**, **Black** or **Random**. White is the default. **Random** is decided when the game starts.
3. **Help:** choose **On my own**, **Some help** or **Full help**. The default is whatever you used last, or **Some help** the first time. You can change it during the game.
4. **Pick a bot.** Bots are grouped by rating (800 to 3200). Each shows its avatar and name, your record against it, and **✓ N clean** if you've beaten it without help. **Recent opponents** at the top lists the last three you played. The list opens scrolled to your last opponent's level.
5. **Tapping a bot starts the game immediately.** There's no confirm step.

### Strength

There's no separate strength slider; the bot's rating is its strength.

- **800 to 1300:** a short search plus deliberate mistakes, about 14% of moves at 800, falling to about 3% at 1300. Aggressive personalities prefer captures and checks.
- **1320 to 2999:** Stockfish's own rating limiter.
- **3000 and up:** full-strength Stockfish, 0.9 seconds a move.

### Help levels

| | Eval bar | Threat arrows | Blunder check | Best-move arrow | Coach |
|---|---|---|---|---|---|
| **On my own** | off | off | off | off | off |
| **Some help** | on | on | on | off | off |
| **Full help** | on | on | on | on | on |

- **Threat arrows:** on your turn, up to two red arrows show what the bot would do if it could move again. Only threats worth at least 10 points of win chance are drawn.
- **Blunder check:** if the move you're about to play drops your win chance by 15 points or more, it's held back. A strip says **Before you play {move}:** with a nudge such as "Is your knight on f6 safe?". Choose **Pick another move** or **Play it anyway**. Moves that give checkmate are never held.
- **Best-move arrow:** a green arrow on your turn shows the engine's move.
- **Coach:** comments after moves that matter (a grade such as **Mistake**, with **Take it back**), praises good finds, and sometimes prompts you before your move ("There's a forced mate here. Can you find it?").

During the game, **Help** (or the level chip on your side of the board) opens **Help in this game**. There you can switch levels, set each aid separately (a mix shows as **Custom**), mute **Bot chat**, or **Resign**. The top bar reads **Serious game** on **On my own** and **Casual game** otherwise.

### Clean and assisted games

Every bot game is recorded as clean or assisted, and your record against each bot keeps both.

A game is **clean** only if it was played on **On my own** from start to finish with no hint, no takeback, and no replaying from an earlier move. The first reason a game becomes assisted sticks: switching back to **On my own** later doesn't make it clean again. The end-of-game card says which it was: **Counted as a clean game: no help, hints or takebacks.** or **Counted as assisted:** followed by the reason.

### Watch out

- **The 3000, 3100 and 3200 bots play at exactly the same strength.** All three use full Stockfish at 0.9 s a move.
- Starting a new game replaces the one in progress. The picker warns you when it's a bot game, but **not** when it's a Pass & play game, which is replaced just the same.
- Bot taglines only show as a hover tooltip, so on a phone you never see them.
- **Hint** is available at every help level, including **On my own**. Using it makes the game assisted.
- With the blunder check holding a move, trying the same move again doesn't play it. You have to press **Play it anyway**.
- There's no draw offer. Draws come from the rules only.
- The on-screen **‹** leaves the game paused and resumable. The phone's own Back key asks **Resign this game?**.

**Code:** `PlayBot.jsx` (`BotPicker`, `BotGame`), `bot.js`, `botGame.js`, `helpLevels.js`, `records.js`, `personas.js`, `core/coach/live.js`, `core/threats.js`.

#### To come

- The game screen: plates, eval bar, move list, chat
- Hint and Show move
- Takeback
- Browsing earlier moves and branching
- Premoves
- Game end: Review game, Rematch, New game
- Live AI banter

# 3. Pass & Play

Two people play on one device. There's no engine, hint or coach while you play; you can review the game afterwards.

Reach it from Home → **Pass & play**, which always opens the setup screen. To return to a game in progress, use **Resume game** on Home.

## A two-player game, start to finish (sample)

### Setup

The screen is titled **Pass & play**, **Two players, one phone**.

| Option | Choices | Default |
|---|---|---|
| **Flip board each move** | on / off | on |
| **Use clock** | on / off | off |
| **Minutes per side** (clock on) | 3, 5, 10, 15 | 10 |
| **Increment (s)** (clock on) | 0, 2, 5, 10 | 0 |

These aren't remembered between games. Press **Start game**. Games always start from the normal position.

### Playing

- Tap or drag to move. A picker appears when a pawn promotes.
- With **Flip board each move** on, the side to move is always at the bottom. With it off, White stays at the bottom. There's no manual flip.
- The screen stays awake during play.
- **↩ Undo** takes back one move. It also works after the game has ended, which reopens it.

### The clock

- Two chips show each side's time. The running one is highlighted.
- The increment is added after each move.
- Under 10 seconds, the chip turns red and the phone sounds and vibrates once per turn.
- Reaching zero loses the game on time.

### Ending and saving

- The game ends by itself on checkmate, any rules draw, or time. There's no resign or draw-offer button.
- When it ends, **Review game** saves it to the archive and opens Game Review.

### Watch out

- **A finished game is only saved if you press Review game.** Leaving any other way loses it.
- **End** asks **End this game?** and then discards it, even if the game is already over.
- White's clock doesn't start until White's first move.
- The clock has no pause. It runs on real time, so it keeps going if you switch to Home or close the app.
- Running out of time always loses, even when the other side couldn't possibly checkmate.
- The move list can't be tapped to look at earlier positions during play.
- Pass & play games don't make puzzles, and the review grades both sides equally.

**Code:** `PassPlay.jsx` (`Setup`, `Game`).

#### To come

- Undo after the game ends, in detail
- Reviewing a Pass & play game

# 4. Game Review

Game Review runs Stockfish over every position of a finished game. It grades each move, works out each side's accuracy, explains the important moments in words, and lets you retry your mistakes. The first review of a game takes a little while; after that it's saved and opens instantly.

Ways in: **Review game** at the end of a game, tapping a game in the **Game archive**, **Import games**, **Pro games**, or an engine match's **Save & review**.

## The review flow (sample)

A review goes summary first, then move by move.

### 1. Analysis

The screen shows **Reviewing…**, a progress bar, and **Analyzing position X of Y…**. How long each position gets is set in Settings → **Game review** → **Time per position**: **Fast** (0.2 s), **Balanced** (0.4 s, the default) or **Deep** (1 s). Moves that look like a **Mistake** or worse get a second look at three times the time, which fills the last part of the bar.

### 2. The summary

The title is **Game review**, with the opening and result underneath.

- **Coach:** one paragraph on the game. For a game where you're one of the players, for example: "The turning point was 23. Nxe5: … It was one of N big errors." A clean game gets "A clean game: no mistakes or blunders, X% accuracy."
- **Accuracy cards** for White and Black: the percentage, a line splitting it by phase (**Ope**, **Mid**, **End**), and counts of each grade.
- **Key moments:** up to three chips for the biggest swings, each with how much win chance was lost, for example **-23%**.
- **Eval graph:** tap or drag on it to jump to that move. Dots mark mistakes, blunders and misses.
- **Start review** goes to the first key moment.

### 3. Move by move

For each move, a box shows **{move}: {grade}** in the grade's colour, a sentence from the coach ("This leaves your knight on f6 unprotected, and Bxf6 takes it for free."), and **Best was X**.

When your move wasn't the best:

- **Show best move** draws a green arrow.
- For an Inaccuracy, Mistake, Miss or Blunder, you also get **Show the reply** (the engine's punishing answer), **Retry**, and **Play it out vs a bot**. **Show the best line** appears when the coach has no specific reason to give.

Below that, up to five engine lines. Tap one to play it out on the board as a side line.

Getting around: **‹ Key moment** and **Next key moment ›** jump between the important moves; **‹ Prev** and **Next ›** step one move; you can also tap any move in the list. **Summary** at the top returns to the summary.

Key moments are: the last book move, and every Inaccuracy, Mistake, Blunder, Miss, Great and Brilliant. When the game is yours (a bot game, or an import where your username matched), only your moves count.

### 4. Retry

**Retry** puts you back before the move with **Retry · find a better move than {move}**.

- A try succeeds if it's the engine's move, gives checkmate, or is within 0.30 pawns of the best of the engine's top three moves: **✓ {move}. That's the engine's move.** or **Just as good as the engine's move.**
- A wrong try shows **Not quite.** with the reason, and a red arrow for how the opponent would answer.
- **Hint** highlights the piece; pressing again shows the move. **Give up** shows it outright.

### The grades

"Drop" is how much the mover's chance of winning falls, in points out of 100. A move gets the first grade in this list that fits.

| Grade | When |
|---|---|
| **Book** 📖 | A known opening move in the first 20 half-moves that doesn't drop 5 or more. Book ends at the first move by either side that drops 10 or more. Never used for games from a custom position. |
| **Forced** □ | The only legal move. |
| **Brilliant** !! | The best move, clearly better than any other, and a real sacrifice the opponent can actually take. |
| **Great** ! | The best move, not a recapture, where the second-best move would have been 10 or more worse. |
| **Best** ★ | The engine's top move. |
| **Miss** ✗ | Your opponent just blundered and you let them off, dropping 10 or more. |
| **Excellent** | Drop under 2. |
| **Good** | Drop 2 to 5. |
| **Inaccuracy** ?! | Drop 5 to 10. |
| **Mistake** ? | Drop 10 to 20. |
| **Blunder** ?? | Drop 20 or more. |

**Accuracy** uses the same formula as lichess: each move scores from 100 down according to its drop, and a player's accuracy is the average over their moves (forced moves left out). The opening is the first 20 half-moves; after that a move counts as endgame once 12 or fewer pieces are left on the board, kings and pawns included.

In bot games and imported games, your Mistakes, Blunders and Misses also become puzzles for you (chapter 7).

### Watch out

- **Leaving the review while it's analysing cancels it.** Coming back starts from the beginning.
- **Play it out vs a bot** on a game that wasn't a bot game always gives you **Mimi, the 800 English bot**. The code meant to pick a middle-strength bot; this is a bug.
- A game played out from review counts toward that bot's record but has no help level, so its aids follow the old Settings option **Eval bar in casual games**.
- Side lines you play during a review aren't saved.
- When the grading rules change in an update, saved reviews are re-graded automatically on startup. Grades on old games can change.

**Code:** `ReviewScreen.jsx`, `review.js`, `reviewFlow.js`, `core/classify.js`, `core/coach/`.

#### To come

- Variations during a review
- Threats, Flip, Export PGN, Copy FEN
- Reviewing many games at once
- Play it out vs a bot, in detail

# 5. Analysis

A free board where you play moves for both sides while Stockfish grades each move and shows its best lines. You can paste in a position or game, branch into side lines, save your work, or start a bot game from any position.

Reach it from Home → **Analysis**, the **Analysis board** shortcut, **🔬 Analyse** in the Custom position editor, **🔬 Analysis** after a puzzle, or a saved analysis in the archive.

## Using the analysis board (sample)

### The screen

The title is **Analysis board**. Underneath is the opening name if your moves follow one, otherwise the engine's search depth, otherwise **free board**. **⇅ Flip** is at the top right. The first time on the web, a banner says **Loading engine (first time: ~39 MB)…**.

### Playing moves

- Tap a piece then a square, or drag. Both sides can be moved.
- Long-press and drag (or right-click on a computer) draws your own planning arrows; releasing on the same square draws a circle. The next tap clears them.
- **↩ Undo** removes the last move. **Reset** clears everything back to the start, with an undo in the toast.

### What the engine shows

- **Eval bar:** always on here. It shows White's winning chance, labelled in pawns (**0.3**) or **M** / **-M** for a forced mate.
- **Engine lines:** up to five, each with an evaluation and up to 8 moves. The top line's first move is drawn as an arrow. Tap a line to play its first move.
- **Verdict on your move:** for example **e4: Mistake · best was Nf3 (0.8)**. **show me** shows the position before your move with the best move drawn.
- **⚠ Threats** (on by default): up to two red arrows for real threats.

Each position gets one search of 0.6 seconds, so the depth depends on how fast your phone is. The engine pauses while the app is in the background.

### Side lines

Go back to an earlier move (tap it in the list) and play something different. The old continuation is kept as a chip, **⑂ move N: …**. Tap a chip to swap back. Up to 8 are kept.

### Loading a position or game

Tap **Paste FEN/PGN**, paste, and tap **Load**. A position (FEN) or a whole game (PGN) both work; a game loads its main line.

### Saving and continuing

- **💾 Save** stores the analysis in the Game archive under **Analyses**, named after the opening. After that the button reads **💾 Update**. Up to 30 analyses are kept.
- **▶ Play from here** opens the bot picker from the current position. You play the side to move by default.
- **⤓ Export PGN** and **Copy FEN** share the line.

### Watch out

- **An unsaved board is lost when you leave the screen.**
- **Side lines are never saved or exported.** Only the main line is.
- A move only gets a verdict if the engine had finished with the position before you moved. Move fast and you get none.
- Loading a pasted FEN or PGN replaces the board with no undo.
- After opening a saved analysis, pasting something new and pressing **Update** overwrites the saved one.
- Going over 30 saved analyses silently drops the oldest.

**Code:** `Analysis.jsx`, `engine.js`, `Board.jsx` (`EvalBar`), `core/classify.js`.

#### To come

- Keyboard navigation
- Threat arrows in detail
- Export PGN

# 6. Archive

Every finished game lands here, along with your saved analyses. From the archive you can filter, star, delete and export games, and open any game in Game Review.

Reach it from Home → **Game archive**.

## Tabs, filters and the 50-game limit (sample)

### Tabs and filters

The title is **Game archive**, with **N of 50 games** underneath (and how many are starred).

- **Tabs:** **All**, **Starred**, **Bots**, **Imported**, **Analyses**. **Imported** includes pasted games. Pass & play games and engine matches only appear under **All** (or **Starred**).
- **Result filter:** **Any result**, **Won**, **Drawn**, **Lost**, judged from your side.

Each game shows a small board of the final position, who played, a **Won** / **Drawn** / **Lost** chip, the date and length, and either its accuracy or **tap to review**. Tap it to open Game Review.

### Starring and deleting

- ☆ / ★ stars a game. **Starred games are never removed automatically.**
- ✕ deletes a game. The **Game deleted** message has an undo.

### The 50-game limit

The archive keeps 50 games. When a new game would make 51, the app removes one:

1. the oldest game you've already **reviewed** and not starred;
2. if there are none, the oldest unreviewed game that isn't starred.

It never removes starred games, the game you're looking at, the game in progress, or the newest game. You see **Archive full: N old games were removed. Star games to keep them.** At the limit, a banner explains the rule. Saved analyses have their own limit of 30 and don't count here.

### Exporting games

1. Tap **Select** (top right).
2. Tick games, or use **Select all** / **Select none**. These apply to whatever the current filter shows.
3. Tap **Export selected**, then **Copy**, **Share** or **Download** (web only).

### Watch out

- **Won / Drawn / Lost only works for games where the app knows which side was you.** Pass & play games, engine matches, pasted games, and imports where your username wasn't one of the players never match those filters.
- If 50 or more games are starred, the archive can grow past 50, since nothing can be removed.
- Stats only see games still in the archive, so pruned games drop out of your stats (chapter 13).
- The move count on a game counts half-moves; the import list counts full moves.

**Code:** `Archive.jsx`, `archive.js`, `storage.js` (`GAME_CAP`, `capGames`), `pgn.js`.

#### To come

- Importing games from Lichess or Chess.com
- Pasting a PGN
- Reviewing all unreviewed games
- The Analyses tab

# 7. Puzzles

Tactics training from 7,200 bundled lichess puzzles in six difficulty sets, plus puzzles made from your own mistakes. Everything works offline.

Reach the puzzle hub from Home → **Puzzles · rating N**, or the **Daily puzzle** and **Due for review** tiles. The hub shows **Your puzzle rating: N**, marked **(provisional)** for your first 10 rated puzzles.

## The daily puzzle (sample)

One puzzle a day, five hearts, and a streak. It doesn't change your puzzle rating.

### How the day's puzzle is chosen

The first time you open the daily puzzle on a given day, the app picks one near your rating and locks it in for that day. Puzzles that were already a daily are never repeated. The day changes at midnight on your phone.

### Solving it

The screen shows the date and the puzzle's rating, your five hearts, and **🔥 N days**. The board faces the side you're playing, and the prompt says, for example, **White to move. Find the best move.**

1. Play the move you think is best. The other side's replies play automatically, and the prompt says **Keep going, the line continues.**
2. **A wrong move** costs a heart and isn't played; you try again. A **Coach** strip says what your move would have allowed (a mate, a hanging piece, a fork, losing material) and gives a nudge such as "Look for a move that attacks two things at once." It never gives away the answer.
3. **💡 Hint (costs a heart)** highlights the piece to move. You can't use it on your last heart.
4. Solve it: **✓ Solved with N hearts left**. Run out: **Out of hearts. The streak starts again tomorrow.** An arrow then shows the answer, and **Play it** steps through the solution.

Afterwards, a calendar shows solved and failed days with **Best streak: N days**, and **More puzzles** takes you to rated puzzles.

### The streak

Your streak is the number of days in a row you've solved the daily. Today's unsolved puzzle doesn't break it until the day is over. A failed day or a skipped day resets it to zero.

### Watch out

- Only the puzzle's own solution is accepted, plus any move that gives checkmate. A different move that's just as good still counts as wrong.
- Leaving partway through keeps your hearts but restarts the puzzle from its first move.

**Code:** `Daily.jsx`, `daily.js`, `core/coach/puzzle.js`, `PuzzleSets.jsx` (`useWrongMoveTip`).

#### To come

- Rated puzzles and your puzzle rating
- Training sets: Starter, Easy, Medium, Hard, Brutal, Expert
- Puzzle Rush
- Streak
- My blunders
- Due today (spaced review)
- The rating and theme filter

# 8. Openings and Drill

**Openings** is a browsable tree of 3,704 named opening lines, with their codes (ECO), how often they're played, and the engine's evaluation. **Drill** makes you play a line from memory against an opponent who sticks to the book.

Reach Openings from Home → **Openings**. Drill is started from inside Openings.

## The opening drill (sample)

### Choosing a line

1. In Openings, get to a named position by playing moves, tapping continuations, or searching (for example "Najdorf", "B90" or "London").
2. Once you've played at least two moves and the position has a name, **🎯 Drill this line** appears, with **as White** or **as Black** and how many times you've mastered it.
3. **The side you drill is the side at the bottom of the board.** To drill as Black, press **⇅ Flip** first.

### A drill run

The screen is titled **Drill: {opening}**.

- The opponent's moves play automatically after a short pause.
- Within your line, you must play the line's move: **Your move: play the book move.**
- After the line ends, the run goes on for up to 8 more half-moves of book play. The opponent varies its replies by how popular they are, so no two runs are quite the same. You must play the **most popular** reply: **Past the named line: play the most popular reply.**
- The run ends after those 8 moves, or when the book runs out.

### Mistakes

Any move other than the expected one is a miss, even another good book move ("X is book too, but this line continues differently."). The wrong move isn't played. After one miss the piece to move is highlighted; after two, an arrow shows the move. **Show move** jumps straight to the arrow and counts as a miss.

### Scoring

A run with no misses shows **Clean run: line mastered +1**. Otherwise you see **Line complete with N misses**. Every finished run counts toward your total runs. Progress is kept per line and per colour. At the end: **Drill again**, or **♟ Play from here** to play a bot from that position.

### Watch out

- The line you drill is exactly the moves on the board, including any you played past the named opening.
- **Restart** and switching colour mid-run don't count as runs.
- Leaving the drill resets Openings to the start position.

**Code:** `Drill.jsx`, `drillScore.js`, `Openings.jsx`, `openingdb.js`, `openings.js`.

#### To come

- Searching openings
- Walking the opening tree
- The opening card: evaluation, verdict, popularity
- Play from here

# 9. Lessons

72 interactive lessons on the app's normal board, in three categories: **Concepts** (30), **Openings** (29) and **Endgames** (13). Some moves play by themselves with commentary; at key points you have to find the move yourself.

Reach them from the **Next lesson** tile on Home (straight into your next lesson) or Home → **Lessons**.

## The lesson path (sample)

The path is the order the app suggests you take the lessons in.

### How the path is ordered

- All **Beginner** lessons (24), then **Intermediate** (36), then **Advanced** (12).
- Within each level, the categories take turns: a concept, then an endgame, then an opening, and round again.
- Within a category, topics come in a fixed order. Concepts start with tactics and mates; endgames start with basic mates; openings start with the Italian Game.

With the current lessons, the path begins: 1 "Pins: Absolute and Relative", 2 "King and queen mate", 3 "Italian Game: Main Ideas", 4 "Forks and Double Attacks". New lessons join the path in the right place automatically.

**See the whole path ›** on the Lessons screen shows it in full, grouped by level, with the next one marked **Next**.

### Which lesson is "next"

1. If you've started a lesson and not finished it, it's the earliest one of those on the path. "Started" means you moved past step 1 or solved at least one of its quizzes.
2. Otherwise, it's the first lesson on the path you haven't finished.
3. When everything is done, Lessons shows **Path complete** and the Home tile says **all done**.

### Inside a lesson

- A strip of numbered dots across the top; tap one to jump to that step. Quiz steps show **?**.
- **‹ Back** and **Next ›** move through the steps. On the last step, **Next ›** becomes **Finish lesson**.
- **Quizzes:** play the move on the board. A wrong move says "{move} isn't it, try again", and you can try as often as you like. A right move shows **✓** with an explanation.
- **Show me** draws the answer. The button then becomes **Continue anyway**.
- **♟ Play from here** starts a bot game from the lesson's position.

### When a lesson counts as done

**Every quiz in the lesson must be solved by you, without Show me.** If you press **Finish lesson** with quizzes left, a panel says how many, with **Go to quiz N** or **Leave for now**. Your progress so far is kept either way.

When it's done: **✓ Lesson complete**, the next lesson's title, and **Next lesson ›**.

### Watch out

- A quiz you used **Show me** on doesn't count, even if you then play the move. Go back and solve it yourself.
- **Next lesson ›** at the end of a lesson picks the next unfinished one *after this one* on the path. The Home tile instead favours any lesson you've started. The two can point at different lessons.
- The back arrow inside a lesson goes to that lesson's category, not to wherever you came from.
- Reopening a finished lesson starts at step 1. Replaying it never un-finishes it.

**Code:** `Lessons.jsx`, `lessonRunner.js` (`pathOrder`, `nextLesson`), `lessons/index.js`, `lessons/format.md`.

#### To come

- Browsing by category and level
- Lessons you've started
- What a lesson step can show
- Playing on from a lesson position

# 10. Pro games

A library of 87,055 master games from 982 events, from 1851 to 2024; a shelf of 36 famous games, each with its story; and live tournaments relayed from lichess.org.

Reach it from Home → **Pro games**.

## Browsing and opening games (sample)

### The library

The hub has five entries:

- **🌟 Famous games:** 36 games every player should see, from "The Immortal Game" (1851) to Gukesh vs Ding. Each opens with its story under the board.
- **📡 Live tournaments:** see "To come" below.
- **👑 World Championship:** 59 events, 2,967 games, 1886 to 2024.
- **🪜 Candidates & World Cups:** 64 events, 11,289 games, 1948 to 2024.
- **🏛️ Tournament archive:** 859 events, 72,799 games, grouped into series such as Hastings (74 editions), the USSR Championship (58) and Wijk aan Zee (57).

Event lists run newest first. An event shows its games as **White – Black**, with round, opening code, year and result. Big events show the first 200 games, then **Show more (N left)** adds 400 at a time.

### Searching

Only the **Tournament archive** has a search box. It matches event names, so "Linares", "Zurich 1953" or "Tata" all work. It shows up to 60 results.

### Watching a game

Games open at the starting position. Step through with **‹ Prev** / **Next ›**, jump with **|‹** and **›|**, or press **▶** to auto-play at 1.2 seconds a move. **⇅** flips the board. You can also tap any move in the list.

**🔬 Review with engine** copies the game into your Game archive and opens Game Review on it.

### Offline use

- **Android:** the whole library is inside the app and works offline.
- **Web:** each event downloads the first time you open it, then works offline. Open **Pro games** once while online so the catalogue is saved. To save everything in one go (about 40 MB), use **⬇ Download everything for offline** on the hub.

### Watch out

- **There's no search by player.** Search only covers event names in the Tournament archive.
- Library games have no player ratings.
- **Review with engine** puts the game in your archive, where it counts toward the 50-game limit.

**Code:** `GamesDB.jsx`, `gamesdb.js`, `public/games/`.

#### To come

- Live tournaments
- Downloading the library for offline use (web)

# 11. Custom position

Build any position by hand, then analyse it, play a bot from it, or start an engine match from it.

Reach it from Home → **Custom position**, or **✎ Build a position** in Engine match.

## Setting up a position (sample)

The editor opens with the last position you used from it, or the normal start position the first time. The header says **Ready** when the position is valid, or **N to fix**.

### Placing pieces

1. Pick a piece from the palette: a White row and a Black row, each with king, queen, rook, bishop, knight and pawn. The white pawn is selected to begin with.
2. Tap a square to put that piece there. Tapping a square that already has the same piece removes it.
3. Pick **⌫ Erase** and tap squares to clear them.

**Clear** empties the board. **Start position** sets up a normal game. **⇅ Flip** only turns the view.

### Side to move and castling

- **To move:** **White** or **Black**.
- **Castling:** four chips, **White O-O**, **White O-O-O**, **Black O-O**, **Black O-O-O**. A chip can only be switched while that king and rook are on their starting squares.

### FEN

The first box shows the position as a FEN; tap it to select it for copying. To load one, paste into **…or paste a FEN to load it** and press **Load pasted FEN**.

### When the position isn't valid

A card lists what to fix:

- **White needs a king.** / **White has more than one king.** (and the same for Black)
- **A pawn can't stand on {square}.** (pawns on the first or last rank)
- **The side not to move is in check, that position can't arise.**

### Using the position

Once it's valid, **Use this position** offers **🔬 Analyse**, **♟ Play a bot** and **⚔ Engine match**. Each one also saves the position so the editor reopens with it.

### Watch out

- **Leaving with the back arrow doesn't save the position.** Only the three **Use this position** buttons do.
- **Castling rights aren't removed when you move the king or rook away.** The chip stays on (greyed out) and stays in the FEN. Turn castling off before moving those pieces, or press **Clear**.
- Pasting a FEN drops its en passant square and move numbers.
- Piece counts aren't checked: nine pawns or eight queens are accepted.

**Code:** `PositionEditor.jsx` (`problems`).

#### To come

- Loading a position from Analysis

# 12. Engine match

Watch Stockfish play itself: one side using its neural-net evaluation, the other its older hand-written one, or any pairing you choose, each with its own thinking time. A "match" here is a single game.

Reach it from Home → **Engine match**, or **⚔ Engine match** in Custom position.

## Running a match (sample)

### Setting up

For each side, choose:

- **Evaluation:** **Neural net** or **Classical**.
- **Thinking time per move:** 0.1 s, 0.5 s, 1 s, 3 s or 10 s.

The defaults are White **Neural net, 1s** and Black **Classical, 1s**. Neither side is weakened.

Starting position:

- **Initial position** (the default). Two equal engines mostly draw from here.
- **✎ Build a position** goes to the Custom position editor.
- **🎲 Random sharp opening** picks a named gambit or a lopsided line, so the engines have to fight.

**Call it once a side is winning by 9 pawns** (on by default) ends the game when one side has been 9 pawns or more ahead for the last 8 half-moves.

### Running it

1. Press **▶ Start match**. If either side uses the neural net, the web version downloads it the first time.
2. **White (NNUE) is thinking…** shows who's on move. Each side's badge shows its own latest evaluation and depth, for example **+0.35 d18**.
3. **⏸ Pause** and **▶ Resume** stop and continue.

### How it ends

Checkmate, stalemate, a rules draw, adjudication (**adjudicated, White winning**), or after 200 moves (**stopped after 200 moves**). The result shows in a card and in the subtitle.

Afterwards: **📊 Save & review** saves the game to your archive (players named like "NNUE 1s" and "HCE 1s") and opens Game Review. **↺ Replay this position** starts over with the same setup.

### Watch out

- **Settings can only be changed before the first move.** Use **↺ Replay this position** to change them.
- **Leaving the screen discards the match.** Nothing is saved unless you press **Save & review**, and that only appears once the game has a result.
- Side settings go back to the defaults each time you open the screen.

**Code:** `EngineMatch.jsx`.

#### To come

- Random sharp openings in detail
- Reading the two evaluations

# 13. Stats

A read-only summary of how you're doing: results, an estimated rating, accuracy and blunder trends, how often the blunder check saved you, puzzles, and lessons.

Reach it from Home → **Stats**.

## What each stat means (sample)

### Which games count

Stats use **your games**: bot games, plus imports from Lichess or Chess.com where your username matched one of the players. Pasted games, Pass & play games, engine matches and Pro games don't count. Only games still in the archive count.

### Results

A coloured bar and **Won**, **Drawn**, **Lost** with percentages. Below it:

- **Clean (no help, hints or takebacks) W-D-L · with help W-D-L**, splitting your bot games (chapter 2).
- A count of all archived games by type, for example "12 vs bots · 3 imported · 1 pass & play".

### Performance rating

An estimate from your last 20 bot games: the average rating of the bots you played, plus 400 × (wins − losses) ÷ games. Clean and assisted games both count. The caption shows the sum, for example "Last 20 bot games: 11/20 against an average bot rating of 1450."

### Accuracy and blunders

- **Accuracy, last N reviewed games:** a line of your accuracy in your last 20 reviewed games, with the latest value. When the second half of those games averages more than 5 points better or worse than the first, it adds **trend improving** or **trend slipping**.
- **Blunders per game:** a bar for each of those games, counting only moves graded **Blunder**.

Games you never reviewed aren't in either chart.

### Blunder checks that saved you

How often the blunder check (chapter 2) stopped a bad move: **this week**, **played anyway**, and **all time**, plus a bar chart of the last 8 weeks. Weeks start on Monday.

### Puzzles and lessons

Your puzzle rating with its recent history, your **Rush best** and **Streak best**, and how many lessons you've completed.

### Watch out

- **Stats forget games the archive has removed.** Your record against each bot (on Home and in the picker) is kept separately and never shrinks, so the two sets of numbers can differ. Star games you want to keep counting.
- **played anyway** is this week's count, even though its label doesn't say so.
- Games from before the clean/assisted split have neither label, so clean plus assisted can add up to less than your total.
- The performance rating isn't capped and can swing a lot over 20 games.

**Code:** `Stats.jsx`, `records.js`, `checkStats.js`, `archive.js` (`outcomeOf`).

#### To come

- Empty state

# 14. Settings and appearance

The app's look, board and pieces, game options, review depth, the optional AI chat, backups, and version info.

Reach it from Home → **Settings & themes**. **App colour** and **Display font** are always at the top; everything else is in groups you tap to open. **Board and pieces** starts open.

## Changing the look (sample)

Every change applies straight away and is saved automatically. There's no Save button.

### App colour

Four choices: **Teal** (the default), **Plum**, **Copper** and **Brass**. It recolours buttons, highlights and tints across the app.

### Display font

Used for headings and big numbers; body text keeps the system font. Choose **Sora** (the default) or **System**, or add your own:

1. Tap **Add a font file**.
2. Pick a .woff2, .woff, .ttf or .otf file of 2 MB or less.
3. It's added, selected, and listed with a **Remove** link.

Removing the font you're using switches back to Sora.

### Board theme and piece style

- **Board theme:** 34 boards, plain or textured (wood, speckle, linen, marble). The default is **Brown (lichess)**.
- **Piece style:** 33 sets. The default is **Cburnett**. Many come in families (Staunton, Outline, Pebble, Slim, Blade, Prism, Letter, Orbit) whose variants share names with board themes, so a matching pair is easy to find.

### Board colours and coordinates

A small preview updates as you go.

| Setting | What it does |
|---|---|
| **Light squares**, **Dark squares** | Your own square colours, on top of the theme's texture. **Default** goes back to the theme's colours. |
| **Coordinate color** | Colour of the a–h and 1–8 labels. |
| **Coordinate font** | **Default**, **Serif**, **Mono** or **Narrow**. |

### Arrow colours

**Engine / best move** (green), **Your drawn plans** (orange) and **Opponent threats** (red). **Reset arrow colors** restores all three.

### Watch out

- **Board and piece names only show as a hover tooltip**, so on a phone you pick by looks alone.
- **Your own square colours stay when you change theme.** Only the texture changes. Tap **Default** to go back to the theme's colours.
- **Added fonts aren't in backups.** They're kept separately on the device. Restoring a backup on another phone that doesn't have the font falls back to Sora.
- The coordinate colour picker shows a light grey even when you haven't set one; the real default comes from the theme.

**Code:** `Settings.jsx`, `appearance.js`, `fontStore.js`, `Board.jsx` (`BOARD_THEMES`), `pieces/`.

#### To come

- Game: Sounds, Haptics, Eval bar in casual games, Piece animation speed
- Game review: Time per position
- Live AI banter (optional)
- Version and updates

# 15. Backups

All your data lives in the app's own storage. On Android, uninstalling deletes it; on the web, clearing the site's data deletes it. A backup copies everything to a file or text that you can restore later.

Reach it from Home → **Settings & themes** → **Backup and restore**.

## Exporting and restoring a backup (sample)

**Last backup:** shows when you last saved one: **never**, **today**, **yesterday** or **N days ago**.

### Exporting

1. Tap **Export backup**. A card shows the backup's size and its full text.
2. Choose how to keep it:
   - **Save backup file** (Android only): writes `Documents/Chess/chess-backup-{date}-{time}.json`, reads it back to check it, and confirms with **✓ Saved and checked**. This folder survives uninstalling the app.
   - **Copy to clipboard.**
   - **Share**, where your phone supports it.
   - **Download file** (web only).

For a backup over about 100,000 characters, the card warns that the clipboard can cut it short on some phones, and suggests saving a file instead.

### What's in a backup

Everything: settings, your record against each bot, the game in progress, all archived games and reviews, saved analyses, your mistake puzzles, puzzle progress and rating, lesson and drill progress, the blunder-check log, the daily puzzle log, and the custom position.

Left out on purpose: your AI key, your box address and token. Also not included: fonts you added, and the "last backup" date.

### Restoring

Tap **Import from file** and choose the file, or paste the text into the box and tap **Restore from pasted text**. Success says **Backup restored.**

Errors you might see:

- **That isn't valid JSON.**
- **That doesn't look like a backup of this app.**
- **This backup is incomplete: it stops after N characters, probably cut off when it was copied.** The pasted text was cut short. Use a file instead.

### Watch out

- **Restoring replaces everything and doesn't ask first.** Your current data is swapped for the backup's straight away; nothing is merged. Your AI key and box settings on this device are kept.
- The data you had just before restoring is kept in storage under `chess-v1.prerestore`, but there's no button to bring it back.
- A restore goes through the same rules as normal use: damaged games are skipped, the 50-game limit applies, and old reviews are re-graded.
- **Last backup** only updates when you actually save, copy, share or download. Opening the export card doesn't count.

**Code:** `packages/shared/src/BackupPanel.jsx`, `packages/shared/src/backup.js`, `backupFile.js`, `Settings.jsx` (`onRestore`).

#### To come

- Backup to your box (Android only, not yet running: the receiver in `ops/la-backup/` hasn't been set up on the box)
- Getting a backup back from the box

# Known issues found while writing

Things this guide describes that look like bugs rather than design. None of them have been fixed.

| Chapter | Issue |
|---|---|
| 2 | The 3000, 3100 and 3200 bots play identically (full Stockfish, 0.9 s a move). Confirmed in `bot.js`. |
| 2 | The picker's "Starting a new game abandons the current one" warning doesn't show when the game in progress is a Pass & play game, though it still gets replaced. |
| 3 | **End** on a finished Pass & play game discards it without saving. Only **Review game** saves. |
| 3 | The Pass & play clock keeps running when you leave the app. |
| 4 | **Play it out vs a bot** on a non-bot game always uses Mimi (800). `ReviewScreen.jsx` takes the middle of the bot list, which is where the English cast starts. Confirmed. |
| 11 | Castling rights stay set after the king or rook leaves its square. |
| 13 | The **played anyway** tile is this week only but isn't labelled that way. |
| 15 | The box backup's address check accepts `http://`, but the Android app probably blocks plain-HTTP traffic. Untested. |
