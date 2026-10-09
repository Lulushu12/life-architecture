# Architecture: infrastructure items only

This follows Replica's `replica-architect` method (stack, schema, API, the parts that bite, build order), applied only to the plan items that add infrastructure: **0** (signing), **1** (tests and CI), **14** (backup to your box), and the deferred move off Pages (item 15). Everything else in the plan is ordinary code inside the existing app and needs no architecture of its own.

Replica's default stack (Next.js, Postgres on Supabase, Stripe, Resend, Vercel) does not apply. Your fixed decisions rule out hosted services, payments and accounts. The stack here is what the repo already uses (Vite, React, Capacitor, GitHub Actions), plus your NixOS box.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | Existing Vite 5 + React 18 + chess.js; Capacitor 6 for the APK | No rewrite; the audit found the structure sound apart from the store and the duplication |
| Unit tests | Vitest + jsdom | Same config language as Vite; runs the existing ES modules unchanged |
| Browser tests | Playwright, Chromium | The bundled browser runs real Stockfish WASM; already installed in this environment, installed by the CI job on GitHub |
| CI | GitHub Actions: a new `test` workflow that the existing deploy and APK workflows wait for | Keeps the current release flow; adds a gate |
| Signing | One Android release keystore in 4 repo secrets (the README's existing design) | The workflow already supports it; only the secrets are missing |
| Backup receiver | One Python 3 script using only the standard library, run by a small NixOS module as a systemd service | Nothing to install, easy to read, testable here |
| Network to the box | Tailscale, with `tailscale serve` providing HTTPS on the tailnet name | Private, gives a real certificate, no ports opened to the internet. **Assumption:** you use or will install Tailscale. If not, the app accepts any URL, such as a LAN address at home |
| Transport from the APK | Capacitor's built-in native HTTP (`CapacitorHttp`, part of `@capacitor/core`, no new dependency) | Skips the WebView's CORS and mixed-content rules, so even a plain-HTTP LAN address works from the APK |

## Item 0: signing

```
keytool -genkeypair -v -keystore release.jks -alias apps \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 release.jks  ->  ANDROID_KEYSTORE_BASE64
```

Plus `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEYSTORE_ALIAS` and `ANDROID_KEYSTORE_ALIAS_PASSWORD`. These are the names `.github/workflows/android-apks.yml` already reads (lines 46 and 76 to 88).

The parts that bite:
- **Losing the keystore** means you're back to uninstalling for updates. You keep a copy outside the repo.
- **The first signed APK** can't install over a debug-signed one. That means one final backup, uninstall and restore per app.
- **Debug builds stay debuggable** if the secrets are ever removed. The workflow falls back silently today. The plan adds a visible warning line to the run summary.

## Item 1: tests and the CI gate

Layout:

```
apps/chess/
  vitest.config.js            (reuses vite.config.js aliases, jsdom)
  test/unit/*.test.js         (pure modules: review, bot, puzzledb, storage, pgn, openings, importers)
  test/fixtures/              (games, positions, stores, a scripted fake engine)
  test/e2e/*.spec.js          (Playwright flows against `vite preview` of the production build)
  playwright.config.js        (webServer: vite build && vite preview --port 4187; Chromium only)
.github/workflows/test.yml    (on: push, pull_request; paths: apps/chess/**, packages/shared/**)
```

Test doubles:
- **The fake engine** implements the same `analyze(fen, opts)` shape as `src/engine.js`. It returns scripted lines per FEN, so review classifications are deterministic.
- **Real Stockfish runs only in the Playwright flows.**
- **The bot's random source** becomes injectable. That is the one change to app code in this item: a default parameter, with behaviour unchanged.

CI wiring:
- `deploy.yml` and `android-apks.yml` gain a first job that calls the test workflow (`workflow_call`). Their build jobs run `needs:` it.
- A red test blocks both Pages and the APKs.

The parts that bite:
- **Stockfish in CI is slow.** E2E flows use short engine times through a test-only setting read from `localStorage`. That setting is never exposed in the UI.
- **The 40 MB net in CI.** Playwright serves it from the build output, so there's no network fetch. The browser cache is per test run.
- **Flaky timing.** Flows wait on visible state (a move appearing in the list), never on fixed sleeps.

## Item 14: one-way backup to the box

### Data stored

There is no database. It's files on disk:

```
/var/lib/la-backup/<app>/
  2026-10-09T07-31-12Z_<sha256-12>.json.gz     one file per received backup
  latest.json.gz -> (symlink to the newest)
```

**Retention:**
- every backup from the last 7 days
- then one per day for 30 days
- then one per month for 12 months

The rest are pruned after each upload.

### API

| Method and path | Does | Who | Input | Output |
| --- | --- | --- | --- | --- |
| `PUT /v1/backups/{app}` | Store a backup | Bearer token | gzip JSON body (the app's existing backup format, no API key), header `X-Backup-Created: <ISO time>` | `201 {id, storedAt}`, or `200 {id, duplicate:true}` when identical to the latest |
| `GET /v1/backups/{app}` | List stored copies | Bearer token | none | `200 [{id, storedAt, bytes}]` |
| `GET /v1/backups/{app}/{id}` | Download one, for a manual restore | Bearer token | none | gzip JSON |
| `GET /v1/health` | Is the box up | none | none | `200 ok` |

- `{app}` is limited to `[a-z-]{1,32}`, so the other apps can reuse this later.
- Body limit: 20 MB.
- The token lives in a file on the box (`tokenFile` in the NixOS module), never in the repo.

### In the app (`apps/chess/src/boxBackup.js`)

- **Settings:** box URL, token, and an on/off switch. They're stored in the chess store under `settings.box`, and **left out of exports** the same way the AI key is today.
- **When it runs:** on launch and after each finished game, if it's switched on, at least 20 hours have passed since the last success, and the app is visible.
- **How it sends:** the body is gzipped with `CompressionStream`. The APK uses CapacitorHttp; the web version uses fetch.
- **Failures never interrupt you.** They're recorded and the next trigger retries. Settings shows "Last copy to box: date" or the last error in plain words.
- **Restore** stays manual: download the file from the box through the list endpoint, then use the existing Import.

### On the box (`ops/la-backup/`)

- `server.py`: standard library only (`http.server`, `gzip`, `hashlib`, `json`).
  - Writes to a temp file, then renames, so a crash never leaves a half-written backup.
  - Constant-time token comparison.
- `module.nix`: options `enable`, `port` (default 8787), `dataDir`, `tokenFile`.
  - Runs `server.py` as a hardened systemd service: `DynamicUser`, `StateDirectory`, `ProtectSystem=strict`, and the like.
  - Binds to 127.0.0.1. `tailscale serve` puts HTTPS in front of it.
- `README.md`: the 5 lines to add to your NixOS configuration, and the `tailscale serve` command.

### The parts that bite

| Risk | Answer |
| --- | --- |
| Box off or phone away from the tailnet | Silent retry on the next trigger; no queue to grow |
| Partial writes | Temp file plus rename |
| The same data sent twice | Content hash; a duplicate is acknowledged, not stored |
| Disk growth | Retention prune after each upload (about 1 to 3 MB per copy, about 50 copies kept) |
| Token on the web version | The browser version shares storage with the other apps on Pages. The plan enables box backup only in the APK until Pages is gone |
| Clock skew between phone and box | The server's own time names the file; the phone's time is kept only as metadata |
| Privacy | Tailnet only, nothing exposed to the internet, no third party |
| Untested on real hardware | Automated tests cover client and server here. `module.nix` can't be evaluated in this environment, which has no Nix. You run it first, and I fix what breaks |

### Build order

1. `server.py` with its tests.
2. The client module with tests against a local instance of `server.py`.
3. The Settings UI.
4. `module.nix` and the README.

## Item 15 (deferred): moving off Pages

Sketch only, to be designed when you ask for it:
1. Every web app's data is backed up through its existing Backup panel.
2. The repo is made private. You do this; I can't.
3. The APK workflow builds only the apps whose folders changed, to stay inside the private-repo Actions allowance.
4. CI attaches the chess web build (`dist/`) to a release.
5. The box pulls it with a read-only token and serves it on `localhost` for your desktop, and over the tailnet for any other device.
6. `deploy.yml` is removed.

The build is installable as a desktop app on localhost, because browsers treat localhost as a secure address.
