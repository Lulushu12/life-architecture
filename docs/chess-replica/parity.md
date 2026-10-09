## Parity: 78.0 / 100

features 78.0  (49 counted, must-haves 20 of 22 done)

Not shippable yet: 2 must-have features are not done.

## By area, weakest first
- lessons                       33.3  (2 features)
- puzzles                       60.0  (9 features)
- navigation                    62.5  (4 features)
- history                       71.4  (3 features)
- analysis                      79.2  (6 features)
- bots                          80.6  (9 features)
- review                        89.7  (12 features)
- coach                        100.0  (4 features)

## Missing, in build order
- [must] puzzles: Enough puzzles at your rating, partial  (1200 under 1000 and 1200 at 1000-1299)
- [must] review: Best move with reason, partial  (reason given when the coach finds one (missed mate, missed win); otherwise "best was X")
- [should] analysis: Save an analysis, no
- [should] puzzles: Coach tip after a wrong puzzle move, no
- [should] puzzles: Daily puzzle with streak and calendar, no
- [should] bots: Play a bot from any position, partial  (from editor and lessons yes; from analysis no; from review buggy (audit bug 2))
- [should] history: Game archive with filters and tabs, partial  (flat list with stars only)
- [should] history: Keep all your games, partial  (capped at 50 (starred kept))
- [should] lessons: Learn path with Next Lesson, partial  (72 lessons by category; no path; completion meaningless)
- [should] navigation: Game-over sheet with Rematch, partial  (Review and New only)
- [should] navigation: Home screen built around tasks, partial  (12 equal tiles)
- [should] puzzles: Custom puzzles by theme and rating range, partial  (theme filter yes; rating range no)
- [should] puzzles: Puzzle Rush, partial  (3 minutes only; no 5 min or survival)
- [could] bots: Adaptive bot that adjusts to how you play, no
- [could] bots: Time controls in bot games, no
- [could] lessons: New-to-chess basics (moves and rules), no  (you likely know the rules already)
- [could] navigation: Bottom tab bar, no
- [could] review: Per-game rating estimate, no  (their formula is unpublished; ours would be made up)
- [could] analysis: Variation tree with comments, partial  (linear line plus 8 stashed lines)
- [could] bots: Clean vs assisted record per bot (crowns), partial  (mine counts W-D-L and ignores hints and takebacks)
- [could] puzzles: Difficulty setting for rated puzzles, partial  (tiers and rated mix exist; no offset)
- [could] review: Opening name plus your history in that opening, partial  (name only)

## Left out on purpose (not scored)
- Bots below 800: you said the bots are fine; revisit only if 800 bots start feeling hard
- Coach voice: possible later with on-device speech; low value
- Celebrity coaches: real people; out of bounds
- Puzzle Battle: live multiplayer
- Puzzle Points tiers and skins: gamification art

## Yours, not in the original (not scored)
- Fully offline including engine and review
- Full-strength NNUE engine locally by default
- Puzzles from your own blunders with spaced review
- Pro games database and live broadcasts offline
- Opening drill
- Engine match and position editor
- Import from Lichess and chess.com
- Romanian-language bots
- 33 piece sets and 34 board themes with custom colours
- Export everything (PGN and JSON backup)
- Blunder check before your move
