# Visual design audit: why the app feels barren

Date: 2026-10-09. Method: the production build, driven by a headless browser at phone size (390 × 844) and desktop size (1366 × 820), on a fresh profile with one game in progress. Screenshots are in `screens/`. Read from the point of view of a graphic designer: hierarchy, density, colour, type, rhythm and imagery. This proposes nothing that touches your board themes or piece sets.

## Verdict

**You're right that something is off, and it isn't one thing.** It's five things, roughly in order of impact:

1. **Large dead zones exactly where the eye should land.**
2. **No hierarchy:** everything is the same size, weight and treatment.
3. **Colour is only ever a hairline:** 1-pixel borders and blue text links.
4. **Emoji doing the job of icons.**
5. **Two screens that are actually broken.**

Element size and spacing are part of it. The big tiles hold very little, and the gaps between groups are uniform. But spacing alone wouldn't fix it.

The board is the best-looking thing in the app: full width, clean, good piece sets. Most fixes below make the rest of each screen work as hard as the board does.

## What's wrong, with evidence

### 1. Dead space where the action is (biggest effect)

- On the **bot game** (`screens/05-game-hint.png`), everything below the move list is empty: **about 40% of the phone screen**. The **puzzle** screen (`08-puzzle.png`) is the same.
- These are the screens you spend the most time on, and their bottom half, the part your thumb reaches, is blank. Meanwhile the controls are a thin row of small blue text links ("Hint", "Takeback", "Chat on").
- Every mainstream chess app fills this space with the same three things:
  - **player plates** above and below the board: avatar, name, rating, material up
  - a **move strip**
  - a **bottom action bar** of large icon buttons in thumb reach
- Your app has none of the three, so the board floats in a void.

### 2. No hierarchy

- **Home** (`01b-home-resume.png`) is 12 identical tiles of 180 px, each holding one emoji and one word. "Play bots", the thing you do every day, gets the same visual weight as "Engine match", which you rarely use.
- The two "primary" tiles differ only by a 1 px green outline, which reads as a selection state, not as importance.
- With no focal point, the eye doesn't know where to start. That's a large part of "sterile".
- Text has the same problem. Nearly everything is 15 to 17 px semibold system font. The only typographic moment in the app is the "Chess." title. Ratings and scores, which are the interesting numbers, are set like labels.

### 3. Flat, colourless surfaces

- The background `#161512` and card surface `#211f1c` are only a few percent apart in lightness, so cards barely separate from the page. There are no other elevation steps.
- Colour appears only as:
  - 1 px accent borders
  - **blue text links** (`--accent2: #60a5fa`) for every action, even inside the game
  - the green chips
- That leaves two unrelated accents (green and blue) competing. Actions look like web hyperlinks rather than app buttons.
- **Resign is a blue link in the top bar** (`05-game-hint.png`): a destructive action styled like the friendliest thing on screen.

### 4. Emoji as the icon system

- The only colour on the home screen comes from emoji: the robot, handshake, graduation cap, microscope, filing cabinet.
- Emoji are 3D, glossy, multi-coloured and drawn by the phone's vendor, so they look different on every device. Next to flat dark UI they read as clip art.
- They're charming as **bot avatars** (Costel's socks), and should stay there. They just shouldn't be the navigation icons.

### 5. Two screens are broken, not just plain

- **Puzzles hub** (`07-puzzles.png`):
  - The training-set cards are all different widths, the text is centred, and the progress bars show as underlines.
  - Cause: the components use classes `lr-main`, `lr-title`, `lr-sum` and `lr-side`, which **have no CSS at all** (verified: no rule in `styles.css` or the shared `base.css`). The browser's default button styling shows through.
- **Lessons hub** (`09-lessons.png`): the same cause. `catcard-arrow` has no styles, so the chevron sits orphaned at the bottom left of each card, and the title and count stack in identical type.
- These two screens alone would make any app feel unfinished.

### 6. Smaller things that add up

- **Back button:** a heavy 44 px bordered square, louder than the title next to it.
- **Board coordinates** are nearly invisible: small, and low contrast against the squares.
- **Empty states:**
  - **Stats** (`13-stats.png`) with no games is six stacked cards of grey "nothing yet" text. One welcoming empty state with a "Play a bot" button would read far better.
  - **Lessons** has a half-empty screen under 3 cards.
- **Bot picker** (`02-picker.png`): large boxes with the rating headers as small grey labels. The record line under each name ("-") is a green dash that looks like a rendering glitch.
- **Settings** is one very long scroll with 34 theme swatches and 33 piece swatches as tiny tiles. It's functional, but you can't see what a piece set looks like at that size.
- **Desktop home** (`20-desktop-home.png`) is the phone grid stretched to three columns: lots of large, empty boxes.

## Recommendations

These are grouped by cost, and none of them restyles your board or pieces. **Most of them ride along with items already in the plan**, so they add little extra work.

### A. Fix what's broken (S, goes into item 3)

- Style the puzzle and lesson hub cards properly:
  - full width, left-aligned
  - title over summary, with a right-hand column for the count
  - a real progress bar
  - the chevron on the right

### B. Visual foundation (S to M, new, done together with item 4's colour picker since both touch the tokens)

1. **Surface scale:** 3 steps instead of 1:
   - page
   - card, clearly lighter, with a faint top highlight
   - raised, for sheets and the selected state

   Primary and selected elements get an **accent-tinted fill** (the accent at about 12% opacity) plus the accent border, not a border alone.
2. **One accent for actions.** The blue link colour is retired for actions. Buttons become real buttons: filled with the accent for primary, tinted for secondary, red-tinted for destructive. Blue stays only for inline text links, which are few.
3. **One icon set:** inline SVG line icons from an open-licensed set such as Lucide (ISC) or Tabler (MIT), bundled so they work offline. They're tinted with the muted text colour, or the accent when active. Emoji stay only as bot avatars.
4. **A type scale:**
   - 5 sizes: 12, 14, 16, 20 and 28 px, with 2 weights
   - tabular figures for every number
   - **one self-hosted display face for headings and big numbers** (ratings, accuracy, streaks), so the numbers you care about look like trophies, not labels
   - Life Architecture already self-hosts its fonts, so the pattern exists.
   - I'd propose 2 or 3 candidate faces in a preview page for you to choose from, like the colours.
5. **A spacing scale** (4, 8, 12, 16, 24, 32):
   - tighter inside groups, more space between unrelated groups, so proximity does the grouping
   - home tiles shrink to fit their content instead of being tall empty boxes
6. **Coordinates** slightly larger, and coloured to contrast with the square they sit on.

### C. Per-screen layout (rides with the plan items)

| Screen | Change | Plan item |
| --- | --- | --- |
| Home | One **hero card** at the top: "Continue vs Costel" with a **mini board of the actual position**, or "Play again vs (last bot)" when no game is open. Then 3 or 4 medium tiles (Daily puzzle, Puzzles due, Next lesson). Then the rest as compact list rows with icons. A real chess position on the home screen is the single most effective cure for sterility, and it's content, not decoration | 10 |
| Bot game | **Player plates** above and below the board. The bot's plate holds its avatar, name, rating and the chat bubble attached to it, so the board stops jumping. Your plate shows material up and the help level. A **bottom action bar** with icon buttons (Hint, Takeback, Help sheet, More) fills the dead zone in thumb reach. The move list becomes a styled horizontal strip | 7 |
| Puzzle | A **prompt banner** under the top bar: a chip in the side-to-move colour plus "Find the best move for Black". A feedback area below the board for "Correct", "Try again" and coach tips. The same bottom action bar as the game | 11 (banner and bar can come earlier, in B) |
| Review | Summary card with big display-face accuracy numbers; badge counts as coloured chips; graph markers | 6 |
| Archive | Each row gets a **mini board** of the final position plus a result chip (W/D/L in semantic colour) and accuracy | 12 |
| Stats | One empty state with a call to action when there's no data. When there is data, big numbers in the display face | 10 |
| Lessons | A "Next lesson" hero card with a mini board of the lesson's start position; category cards fixed (A) | 13 |
| Bot picker | Rating headers as clear section headers. The record shown as W-D-L chips, or hidden until you've played that bot. The help-level chips at the top | 7 |
| Settings | Grouped into sections that open and close (Board, Pieces, App colour, Game, Data). Piece swatches large enough to see the knight's shape | 4 |
| Desktop | Home caps at 2 columns with the hero spanning both; the game and analysis right-hand panel holds the plates, engine lines and move list instead of empty space | 7, 12 |

### What I would not do

- **No gradients, glassmorphism or glow.** They date fast and fight the board.
- **No colour-coding every section with its own hue.** A rainbow home screen trades sterile for noisy.
- **No change to the board, pieces, board themes or eval bar.** They're the strongest part of the app already.

## Suggested next step

Before any code: **a preview page like the colour one.** It would show Home and the bot game at phone size, as they are today and after A, B and C, side by side, in your chosen accent options and with 2 or 3 display-face candidates. You pick, and the picks become the spec for item 4 and the screen items.

Plan changes if you agree:
- **A** joins item 3.
- **B** joins item 4.
- **C** rides with the items in the table.
- The preview page comes first.

## Decisions (2026-10-09)

- Accent: **Teal** by default; Plum, Copper and Brass stay selectable.
- Display face: **Sora** by default, plus any font file you add yourself.
- Layout: approved as previewed. The coach gets its own **Coach on/off** button in the game's bottom bar, changeable mid-game; Resign moves into the Help sheet (plan item 7).
- Shipped with plan item 3: fix A (hub cards). Shipped with plan item 4: foundation B. The per-screen layouts (C) ride with their plan items.

