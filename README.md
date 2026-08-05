# Life Architecture

A collection of personal apps, built as installable offline-first PWAs and
deployed together to GitHub Pages. Each app is installable to a phone home
screen from its own URL and keeps all data on-device (localStorage,
write-through on every action) unless noted.

| App | Path | Serves at | Description |
|-----|------|-----------|-------------|
| Life Architecture | `apps/life-architecture` | `/` | Habit tracker RPG — daily/long-term quests, XP, levels, streaks, weekly schedule. Syncs via Firebase. |
| Whist & Rentz | `apps/whist` | `/whist/` | Scorekeeper for Romanian Whist and Rentz. Configurable rules, undo/edit with recompute, resume unfinished games, JSON backup. |
| Breathe | `apps/breathe` | `/breathe/` | Wim Hof-style guided breathing rounds + meditation timer, with session history and synthesized audio cues. |
| Focus | `apps/focus` | `/focus/` | Pomodoro, named task timers, interval break/posture reminders, and daily stats. |
| Games | `apps/games` | `/games/` | Chess clock (Fischer increment), sudoku with unique-solution generator, cryptograms. |
| Calories | `apps/calories` | `/calories/` | Food & macro log backed by Open Food Facts (search + barcode), training log, weight trend. |
| Ortho | `apps/ortho` | `/ortho/` | Personal clinical reference — articles authored in-app (on-device) or as Markdown files in `apps/ortho/src/content/`, searchable and offline. |
| Chess | `apps/chess` | `/chess/` | Full chess app on local Stockfish 16 NNUE (WASM): bot personas with adjustable strength and banter, Game Review with move classification and accuracy, analysis board, blunder puzzles, pass & play. Engine GPLv3; pieces cburnett (lichess); openings lichess-org/chess-openings. |

## Development

Each app is a standalone Vite + React project:

```sh
cd apps/<app>
npm install
npm run dev
```

## Deployment

Pushing to `main` triggers the GitHub Actions workflow, which builds every
app and publishes the composed site to GitHub Pages.

## Conventions

New apps copy the patterns of `apps/whist`: same dependency set, dark
mobile-first UI, `base: '/life-architecture/<name>/'`, a service worker with
an app-specific cache name, and single-key localStorage persistence written
through on every state change.
