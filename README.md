# Life Architecture

A collection of personal apps, built as installable offline-first PWAs and
deployed together to GitHub Pages. Each app is installable to a phone home
screen from its own URL and keeps all data on-device (localStorage,
write-through on every action) unless noted.

| App | Path | Serves at | Description |
|-----|------|-----------|-------------|
| Life Architecture | `apps/life-architecture` | `/` | Habit tracker RPG and the suite's home: daily/long-term quests, XP, levels, streaks, weekly schedule, PPL training log with an overload gate, macro protocol view, optional AI coach. Local-first; backup/import is the sync story (an optional GitHub branch sync exists but is off by default). Reads Focus, Breathe and Calories activity through the shared event ledger to auto-complete quests. |
| Whist & Rentz | `apps/whist` | `/whist/` | Scorekeeper for Romanian Whist and Rentz. Configurable rules, undo/edit with recompute, resume unfinished games, JSON backup. |
| Breathe | `apps/breathe` | `/breathe/` | Wim Hof-style guided breathing rounds + meditation timer, with session history and synthesized audio cues. |
| Focus | `apps/focus` | `/focus/` | Pomodoro, named task timers, interval break/posture reminders, and daily stats. |
| Games | `apps/games` | `/games/` | Chess clock (Fischer increment), sudoku with unique-solution generator, cryptograms. |
| Calories | `apps/calories` | `/calories/` | Food & macro log backed by Open Food Facts (search + barcode), training log, weight trend. |
| Ortho | `apps/ortho` | `/ortho/` | Personal clinical reference — articles authored in-app (on-device) or as Markdown files in `apps/ortho/src/content/`, searchable and offline. Ships a full orthopedic knowledge base: a Diagnoses section with 36 monographs (262 diagnoses, treatment ladders, rehab protocols, linked 2023–2026 evidence) plus classification and technique articles extracted into the app's native sections, refreshed monthly by a scheduled evidence sweep (`apps/ortho/UPDATE-PROTOCOL.md`). Also carries a Concurs section: the Foișor 2026 specialist-exam tematica (83 clinical and operative topics in `apps/ortho/src/content/concurs/`) with a recap, a timed oral-presentation drill graded per section, and commission Q&A cards on a spaced-repetition schedule. |
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

Each APK requests `android.permission.INTERNET`. Three exceptions, each
deliberate: Focus, Breathe and Life Architecture also request
`POST_NOTIFICATIONS` (Android 13+) so their timers and reminders can fire
through `@capacitor/local-notifications` while the app is closed; this is a
local alarm, it never touches the network. Calories requests `CAMERA` for
barcode scanning in the WebView. Every app registers `@capacitor/app` so the
hardware Back button pops in-app screens instead of closing the activity;
no other native API is reachable from the WebView.

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

Shared infrastructure lives in `packages/shared` (source only, no build step,
no npm workspace): design tokens and base CSS, UI primitives (toggle, stepper,
confirm sheet, toasts), an error boundary, a versioned localStorage store with
migration and corruption recovery, the backup/import panel, a Vite plugin that
generates each app's service worker with a per-app cache prefix and a
build-hash cache name, history-backed navigation with Android Back handling,
wake lock, synthesized audio and haptics, local notifications, and the
cross-app event ledger (`la_events_v1`) that Life Architecture reads.
`packages/shared/README.md` is the contract; `packages/shared/ADOPTION.md` is
the checklist a new app follows.

New apps copy the patterns of `apps/whist`: same dependency set, dark
mobile-first UI, a `base` that switches between `/life-architecture/<name>/`
and `./` on `--mode android`, the `@shared` Vite alias, `sharedSw({ name })`
in the plugin list, `registerSw()` from the app, a config snapshot per record
with totals derived on read, and single-key localStorage persistence written
through on every state change via `createStore`.

All eight apps share one origin on GitHub Pages, so they share localStorage
and CacheStorage. Never clear caches you do not own by name prefix, and never
assume a storage key is private to one app.

`docs/design-audit-2026-09.md` records the audit this structure came from,
with per-app findings under `docs/audits/`.
