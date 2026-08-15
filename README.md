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

## Android APK (chess only, for now)

Chess additionally builds as a native Android app via Capacitor. The web
assets ship *inside* the APK — Stockfish and the 39MB NNUE net included — so
it works offline from a fresh install, with no first-visit caching step.

Run the **Build Chess APK** workflow (Actions → Run workflow) with *publish*
ticked. It attaches the APK to the `chess-latest` release, giving a permanent
link that installs straight from the phone:

```
https://github.com/Lulushu12/life-architecture/releases/download/chess-latest/chess.apk
```

Re-running the workflow replaces the asset at that same URL, so the link never
changes. Release assets are public on a public repo. (Actions *artifacts* are
the other output, but they are login-gated zips and the GitHub mobile app
can't show them — the release link is the one to use on a phone.)

Or build locally with the Android SDK installed:

```sh
cd apps/chess
npm run apk        # → android/app/build/outputs/apk/debug/app-debug.apk
```

### Signing

Without a keystore the workflow builds a debug APK — installable, but
`debuggable`, meaning anything with ADB access can attach to the process and
read app storage. For a build you keep on your phone, add four repo secrets
and the workflow assembles a signed, non-debuggable release instead:

```sh
keytool -genkeypair -v -keystore release.jks -alias chess \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 release.jks     # → secret ANDROID_KEYSTORE_BASE64
```

Plus `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEYSTORE_ALIAS`, and
`ANDROID_KEYSTORE_ALIAS_PASSWORD`. Keep `release.jks` backed up somewhere
outside the repo — losing it means installs can't be updated in place.
(`*.jks`/`*.keystore` are gitignored.)

### What the APK can reach

Only `android.permission.INTERNET` is requested — no camera, microphone,
location, or storage. The app has one network feature: the optional live-AI
bot banter in Settings, which is inert unless you paste an endpoint and key
(`ai: { baseUrl: "", apiKey: "", model: "" }` by default). Everything else —
Stockfish, review, puzzles, lessons, openings — is on-device.

`INTERNET` is outbound-only; it opens no port and lets nothing in. The app
serves its own assets in-process via `WebViewAssetLoader`, not over a socket,
so if you want to make outbound traffic impossible at the OS level, delete the
`<uses-permission>` line from `AndroidManifest.xml` and rebuild. That also
kills the AI banter — and it hasn't been tested on a device, so check the app
still opens before relying on it.

Backups are off (`allowBackup="false"` plus Android 12+ data-extraction
rules), so game history and any API key you set stay on the device rather than
syncing to Google.

The Pages build is unaffected: `npm run build` still emits the
`/life-architecture/chess/` paths and registers the service worker.
`vite build --mode android` is the only thing that switches to relative
paths and drops the (redundant) service worker.

## Conventions

New apps copy the patterns of `apps/whist`: same dependency set, dark
mobile-first UI, `base: '/life-architecture/<name>/'`, a service worker with
an app-specific cache name, and single-key localStorage persistence written
through on every state change.
