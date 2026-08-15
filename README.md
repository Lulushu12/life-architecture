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

## Android APKs

Every app also builds as a native Android app via Capacitor. The web assets
ship *inside* the APK — Stockfish and its 39MB NNUE net included — so each one
works offline from a fresh install, with no first-visit caching step and no
dependence on the service-worker cache surviving.

Any change under `apps/` rebuilds every APK and republishes it. To build
without changing anything, run the **Build APKs** workflow by hand
(Actions → Run workflow) with *publish* ticked.

Each app lands on its own `<app>-latest` release, giving permanent links that
install straight from the phone:

| App | Download |
|-----|----------|
| Chess | `releases/download/chess-latest/chess.apk` |
| Whist & Rentz | `releases/download/whist-latest/whist.apk` |
| Games | `releases/download/games-latest/games.apk` |
| Breathe | `releases/download/breathe-latest/breathe.apk` |
| Focus | `releases/download/focus-latest/focus.apk` |
| Calories | `releases/download/calories-latest/calories.apk` |
| Ortho | `releases/download/ortho-latest/ortho.apk` |
| Life Architecture | `releases/download/life-architecture-latest/life-architecture.apk` |

All prefixed with `https://github.com/Lulushu12/life-architecture/`. Rebuilds
replace the asset at the same URL, so the links never change. Release assets
are public on a public repo. (Actions *artifacts* are the other output, but
they are login-gated zips and the GitHub mobile app can't show them — the
release links are what to use on a phone.)

Or build one locally with the Android SDK installed:

```sh
cd apps/<app>
npm run apk        # → android/app/build/outputs/apk/debug/app-debug.apk
```

### Signing

Without a keystore the workflow builds debug APKs — installable, but
`debuggable`, meaning anything with ADB access can attach to the process and
read app storage. For a build you keep on your phone, add four repo secrets
and the workflow assembles signed, non-debuggable releases instead (one
keystore signs all eight):

```sh
keytool -genkeypair -v -keystore release.jks -alias apps \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 release.jks     # → secret ANDROID_KEYSTORE_BASE64
```

Plus `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEYSTORE_ALIAS`, and
`ANDROID_KEYSTORE_ALIAS_PASSWORD`. Keep `release.jks` backed up somewhere
outside the repo — losing it means installs can't be updated in place.
(`*.jks`/`*.keystore` are gitignored.)

### What the APKs can reach

Each APK requests only `android.permission.INTERNET` — no camera, microphone,
location, or storage. The native bridge registers zero Capacitor plugins, so
nothing in the WebView can reach a native API at all.

Four apps make no network calls whatsoever:

| App | Network use |
|-----|-------------|
| Breathe, Focus, Ortho, Whist | none — fully offline |
| Chess | optional live-AI bot banter; inert until you paste an endpoint and key |
| Life Architecture | optional GitHub branch sync (needs a PAT) and AI coach (needs a key); both off by default |
| Games | "fetch quotes" adds new cryptograms from a public quote API; bundled puzzles work offline |
| Calories | food search and barcode lookup hit Open Food Facts; the log itself is local |

`INTERNET` is outbound-only; it opens no port and lets nothing in. Each app
serves its own assets in-process via `WebViewAssetLoader`, not over a socket,
so for the four offline-only apps you can delete the `<uses-permission>` line
from `AndroidManifest.xml` and rebuild to make outbound traffic impossible at
the OS level. That has not been tested on a device — check the app still opens
before relying on it.

Backups are off everywhere (`allowBackup="false"` plus Android 12+
data-extraction rules), so history, settings, and any token or API key you set
stay on the device rather than syncing to Google. The FileProvider ships with
no declared paths, since no plugin uses it.

Life Architecture's fonts are self-hosted in `public/fonts` rather than pulled
from Google Fonts, so it renders identically with no off-origin request.

The Pages build is unaffected by any of this: `npm run build` still emits the
`/life-architecture/<app>/` paths and registers each service worker.
`vite build --mode android` is the only thing that switches to relative paths
and drops the (redundant) service worker.

## Conventions

New apps copy the patterns of `apps/whist`: same dependency set, dark
mobile-first UI, a `base` that switches between `/life-architecture/<name>/`
and `./` on `--mode android`, service worker registration in `main.jsx` guarded
by that mode, an app-specific cache name, and single-key localStorage
persistence written through on every state change.
