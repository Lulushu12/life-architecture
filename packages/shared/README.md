# @shared

Source-only shared code for every app under `apps/`. No build step, no npm
workspace, no package.json of its own. Each app points a Vite alias at this
folder and bundles the modules it imports with its own React and Capacitor.

## Wiring an app

`apps/<name>/vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { sharedSw } from '../../packages/shared/vite/swPlugin.js'

export default defineConfig(({ mode }) => ({
  plugins: [react(), sharedSw({ name: '<name>' })],
  base: mode === 'android' ? './' : '/life-architecture/<name>/',
  resolve: {
    alias: { '@shared': path.resolve(__dirname, '../../packages/shared/src') },
    // Modules under packages/ have no node_modules of their own; force every
    // bare import they make to resolve from this app's node_modules.
    dedupe: ['react', 'react-dom', '@capacitor/core', '@capacitor/app', '@capacitor/local-notifications'],
  },
  server: { fs: { allow: [path.resolve(__dirname, '../..')] } },
}))
```

`src/styles.css` starts with:

```css
@import "@shared/tokens.css";
@import "@shared/base.css";
:root { --accent: #22c55e; --accent-ink: #04120a; }
```

`public/sw.js` is deleted; the plugin emits `dist/sw.js` on web builds.
`main.jsx` calls `registerSw()` from `@shared/swRegister.js` instead of the
inline registration.

Every app depends on `@capacitor/app` (hardware back). Apps that schedule
notifications also depend on `@capacitor/local-notifications`.

## Modules (all under `src/`)

### tokens.css
`:root` variables only: `--bg #0b1220`, `--surface #131c2e`, `--surface2 #1b2740`,
`--border #24314d`, `--text #e6ecf7`, `--muted #8b98b3`, `--accent #38bdf8`,
`--accent-ink #04121c`, `--accent2 #38bdf8`, `--danger #ef4444`, `--gold #f59e0b`,
`--ok #22c55e`, `--radius 14px`, `--radius-sm 10px`, `--tap 44px`,
`--font system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
Apps override `--accent`/`--accent-ink` (and Chess overrides the whole set)
after the import.

### base.css
Resets and the shared component vocabulary, using only the tokens above:
- `*` box-sizing, transparent tap highlight; `html, body` background/color/font,
  `overscroll-behavior-y: none`; `button` reset; `:focus-visible` 2px accent ring;
  `@media (prefers-reduced-motion: reduce)` kills transitions/animations globally.
- `.page` (560px column, 14px gutters, safe-area bottom), `.card`, `h2` section
  header, `h3`, `.hint`, `.hint.small`, `.warn`, `.okmsg`, `.bigbtn` (+`:active`
  scale 0.98 and `:disabled`), `.linkbtn` (min-height 44px), `.iconbtn` (44px),
  `.chip` / `.chip.sel` / `.chips`, `.toggle` / `.toggle.on` / `.knob`, `.setrow`
  / `.setlabel`, `.stepper` (44px buttons, input), `.field` / `.flabel` /
  `.input`, `.topbar` / `.tb-title` / `.tb-sub`, `.tabbar` / `.tab` /
  `.tab.active` (fixed bottom, safe-area), `.backuppanel` / `.backuprow` /
  `.backuptext`, `.sheet-backdrop` / `.sheet` / `.sheet-actions` (bottom
  sheet), `.toasts` / `.toast` / `.toast-action`, `.errorboundary`.
- Every interactive class has an `:active` state (opacity or scale).
- Class names match what the apps already use so adopting means deleting the
  app's duplicate block, not renaming.

### ui.jsx
- `Toggle({ checked, onChange, label? })`: `<button role="switch" aria-checked>`.
- `SettingRow({ label, hint?, children })`.
- `NumInput({ value, onChange, min, max, step, decimals?, inputMode? })`:
  stepper with a text input. Keeps a string draft while focused, allows empty,
  clamps on blur/Enter, `inputMode="decimal"` when `step < 1` or `decimals`,
  otherwise `"numeric"`. Buttons have aria-labels. Press-and-hold repeats
  (350ms delay, then every 80ms).
- `Stepper` = alias of NumInput without the text field (`{ value, onChange,
  min, max, step, format? }`), same press-and-hold.
- `IconButton({ label, onClick, children, className? })`: 44px, `aria-label`
  required.
- `ConfirmSheet({ open, title, message, confirmLabel = "Confirm", cancelLabel =
  "Cancel", danger = false, onConfirm, onCancel })`: bottom sheet with
  `role="dialog" aria-modal`, Escape cancels, focus moves in and back.
- `useConfirm()`: returns `[confirm, sheetElement]` where `confirm({ title,
  message, confirmLabel, danger })` resolves to true/false. Drop-in replacement
  for `window.confirm`.
- `ToastProvider` + `useToast()`: `toast(message, { action?: { label, onClick },
  duration = 4000 })`. Toasts render above the tab bar. `toast.undo(message,
  onUndo)` helper. Max 3 visible.

### ErrorBoundary.jsx
`<ErrorBoundary storageKey="whist-rentz-v1" appName="Whist">` wraps the app.
On error: message, "Copy raw data" (copies `localStorage[storageKey]`), "Reset
data" behind a ConfirmSheet, "Reload".

### store.js
- `dayKey(date = new Date())` local `YYYY-MM-DD`; `todayKey()`; `addDays(key, n)`
  DST-safe (uses local Date arithmetic, not 86400000).
- `newId()` (crypto.randomUUID with fallback).
- `createStore({ key, version, defaults, migrate?, normalize? })` returns
  `{ key, load(), save(store) }`.
  - `load()`: parse; on parse failure copy the raw string to `${key}.corrupt`
    and return `{ ...defaults(), _recovered: true }`; if `store.version <
    version` run `migrate(store, fromVersion)`; deep-merge `defaults()` for
    missing keys (top level and one level down for plain objects); run
    `normalize(store)` if given; set `version`.
  - `save(store)`: `JSON.stringify` and `setItem`; returns `{ ok: true }` or
    `{ ok: false, error }` (quota) without throwing.
- `usePersistentStore(def)`: `useState(() => def.load())` + write-through effect;
  returns `[store, setStore, status]` where `status` is `{ ok, error, savedAt }`.
  Also listens to the `storage` event for the same key and reloads (cross-tab).
- `useVisibleDate()`: returns `todayKey()` and updates on `visibilitychange`,
  `focus`, and at local midnight.

### backup.js / BackupPanel.jsx
Same API as the current whist copy, plus:
- `backupText(store, { strip = [] })` strips dotted paths (e.g.
  `"settings.ai.apiKey"`) before serializing.
- `BackupPanel({ data, onRestore, validate, prefix, strip?, storageKey? })`
  shows "Last backup: N days ago / never" (from `localStorage[prefix + ":lastBackup"]`,
  set when the user copies or downloads), a "Share" button when
  `navigator.share` exists (shares the JSON as a file when `canShare({files})`,
  else as text), and reports how many records were rejected by `validate` if
  `validate` returns `{ ok, dropped }` instead of a boolean.

### bridge.js (cross-app event ledger)
Key `la_events_v1`, array capped at 2000 (oldest dropped).
- `emitEvent({ app, type, dayKey?, value? })` appends `{ id, app, type, at,
  dayKey, value }`, posts on `BroadcastChannel("la-events")`.
- `readEvents({ since?, app?, type? })`.
- `subscribeEvents(cb)`: `storage` event + BroadcastChannel; returns unsubscribe.
Event types by app: `focus.pomodoro` `{ minutes, taskId?, taskName? }`,
`focus.task` `{ minutes, taskName }`, `breathe.session` `{ kind:
"breathing"|"meditation", minutes, rounds?, bestHold? }`, `calories.day`
`{ kcal, protein, carbs, fat }` (emitted on every food change for that day,
LA keeps the latest per dayKey), `calories.training` `{ exercises }`,
`calories.weight` `{ kg }`, `games.solved` `{ game, difficulty?, seconds }`,
`chess.game` `{ result, botElo?, accuracy? }`.

### useHistoryNav.js
`useHistoryNav(initialView, { persistKey? })` returns `{ view, nav, back,
replace }`. `nav(view)` sets state and `pushState`; `popstate` restores;
on native platforms registers `@capacitor/app` `backButton` (pop while
`canGoBack`, else `exitApp`). If `persistKey` is given the current view is
saved to localStorage and restored on launch (replaceState). Views are plain
objects (`{ screen, ...params }`). Also exports `useBackGuard(when, onBack)`
for "intercept back while a session runs" (pushes a sentinel entry and calls
`onBack` instead of popping).

### useWakeLock.js
Fixed version of Breathe's hook: tracks `released`, listens for the sentinel's
`release` event, re-requests on `visibilitychange`.

### audio.js / haptics.js
- `audio.ensure()` creates/resumes the AudioContext (call from a gesture and
  from `visibilitychange`); `audio.tone(freq, dur, opts)`; named cues:
  `tick`, `tickLast` (higher), `chime`, `bell`, `gong` (196 Hz plus 392/588/784
  partials so phone speakers reproduce it), `click`, `warn`, `success`, `fail`,
  `lowTime`. `audio.play(name, { enabled = true })`.
- `vibrate(pattern, { enabled = true })` guards `navigator.vibrate`. Patterns:
  `haptics.tap` 10, `haptics.success` [30, 40, 30], `haptics.warn` [60, 60, 60],
  `haptics.fail` 120.

### notify.js
- `isNativeNotify()`; `requestPermission()` resolves `"granted" | "denied" |
  "unsupported"` (native: `LocalNotifications.requestPermissions`; web:
  `Notification.requestPermission`).
- `scheduleAt({ id, title, body, at, channel? })` schedules a local notification
  for `at` (ms). Native only; on web resolves `false` (callers fall back to
  in-app cues). `cancel(id)`, `cancelAll(prefix?)`.
- `notifyNow({ title, body, tag })` web Notification / native immediate.
- Ids are numbers; each app reserves a range (focus 1000-1999, breathe
  2000-2999, life-architecture 3000-3999).

### swRegister.js
`registerSw({ onUpdate })`: no-op in `android` mode; registers
`${BASE_URL}sw.js`; when a new worker activates, calls `onUpdate(reload)` so
the app can show an "Update available" toast whose action calls `reload()`.

## vite/swPlugin.js
`sharedSw({ name, extraPrecache = [], cacheOnly = [], skipPrecache = [], ignore = [] })`.
`cacheOnly` files are stored in a `<name>-data` cache that activate never
deletes, so a 40MB engine net survives deploys. `ignore` regexes (matched
against the path) make the worker pass those requests through untouched; the
root app uses it to stay out of the sibling apps' scopes.
On non-android builds, in `closeBundle` writes `<outDir>/sw.js`:
- `CACHE_NAME = "<name>-<8-char build hash>"` (hash of the emitted asset list).
- Precache: `base`, `base + "index.html"`, `manifest.json`, `icon-192.png`,
  `icon-512.png`, every emitted `assets/*` file, plus `extraPrecache`, minus
  `skipPrecache` patterns. Install uses per-file `cache.add` with failures
  logged, never all-or-nothing.
- Activate: delete caches whose name starts with `"<name>-"` and is not
  `CACHE_NAME`. Never touch other apps' caches. `clients.claim()`, then
  `postMessage({ type: "sw-activated" })` to all clients.
- Fetch (same-origin GET only): navigation requests network-first with cache
  fallback; `assets/*` cache-first (immutable); URLs matching any `cacheOnly`
  regex cache-first with no revalidation once present; everything else
  stale-while-revalidate. Never `respondWith(undefined)`: if both fail,
  return `Response.error()`.
