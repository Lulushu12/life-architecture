# Life Architecture

A collection of personal apps, built as installable offline-first PWAs and
deployed together to GitHub Pages.

| App | Path | Description |
|-----|------|-------------|
| Life Architecture | `apps/life-architecture` | Habit tracker RPG — daily/long-term quests, XP, levels, streaks, weekly schedule. Served at the site root. |
| Whist & Rentz | `apps/whist` | Scorekeeper for Romanian Whist and Rentz. Fully offline, auto-saves every action, resumes unfinished games. Served at `/whist/`. |

## Development

Each app is a standalone Vite + React project:

```sh
cd apps/<app>
npm install
npm run dev
```

## Deployment

Pushing to `main` triggers the GitHub Actions workflow, which builds every
app and publishes the composed site to GitHub Pages. Each app is installable
to a phone home screen from its own URL.
