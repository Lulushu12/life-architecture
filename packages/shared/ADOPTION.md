# Adopting @shared in an app

Checklist every app follows. `<name>` is the folder under `apps/`. Do all
steps in order; do not skip a step because "the app doesn't need it".

1. **Vite config** exactly as in README.md "Wiring an app" (alias `@shared`,
   `resolve.dedupe`, `server.fs.allow`, `sharedSw({ name })`). Keep the
   existing `base` logic.
2. **Service worker**: delete `public/sw.js`. In `App.jsx` (inside a
   `useEffect` with `[]`) call `registerSw({ onUpdate: (reload) =>
   toast("Update available", { action: { label: "Reload", onClick: reload },
   duration: 0 }) })`. Remove the inline registration from `main.jsx`.
3. **main.jsx**: render `<ErrorBoundary storageKey=... appName=...>
   <ToastProvider><App /></ToastProvider></ErrorBoundary>` inside StrictMode.
4. **styles.css**: first two lines `@import "@shared/tokens.css";
   @import "@shared/base.css";` then `:root { --accent: <app accent>;
   --accent-ink: <dark ink for text on accent>; }`. Delete the app's own copies
   of the shared blocks (`:root` tokens, `*`, `html, body`, `button`, `.page`,
   `.card`, `h2`, `h3`, `.hint`, `.warn`, `.okmsg`, `.linkbtn`, `.bigbtn`,
   `.iconbtn`, `.chip(s)`, `.toggle`/`.knob`, `.setrow`/`.setlabel`,
   `.stepper`, `.field`/`.flabel`/`.input`, `.topbar`/`.tb-*`, `.tabbar`/`.tab`,
   `.backup*`). Keep app-specific rules. If an app deliberately differs
   (Chess's warm palette, Life Architecture's fonts), keep the override AFTER
   the imports.
5. **Store**: replace the app's `storage.js` load/save with
   `createStore({ key, version: 1, defaults, normalize })` and use
   `usePersistentStore(def)` in App. Keep the same localStorage key. Add a
   `normalize` that repairs entries that would otherwise crash rendering.
   When `status.ok === false` or `store._recovered` render a persistent
   `.warn` banner at the top of the page ("Storage full: changes are not being
   saved" / "Saved data was unreadable and has been reset; the raw copy is
   under <key>.corrupt").
6. **Navigation**: replace the `useState` view/tab with `useHistoryNav(initial,
   { persistKey: "<name>:view" })`. Every screen change goes through `nav()`.
   Screens that must not be left by an accidental back (a running session, a
   half-entered round) use `useBackGuard(running, () => openEndConfirm())`.
7. **Dialogs**: replace every `window.confirm` with `useConfirm()` and every
   `alert` with `toast()`. Deletes get `toast.undo(...)` instead of a confirm
   where restoring is cheap (a list entry); destructive resets keep the sheet.
8. **Primitives**: import `Toggle`, `SettingRow`, `NumInput`, `Stepper`,
   `IconButton` from `@shared/ui.jsx` and delete the local copies. Every icon
   button gets an `aria-label`.
9. **Backup**: use `@shared/BackupPanel.jsx` (delete the local `backup.js` and
   `BackupPanel.jsx`). Apps without one add it to a Settings/More/Home section.
   Pass `strip` for any secret paths.
10. **Wake lock**: `useWakeLock(active)` from `@shared/useWakeLock.js` wherever
    a timer, clock, session or table game is running.
11. **Audio/haptics**: use `@shared/audio.js` and `@shared/haptics.js`; call
    `audio.ensure()` from the start gesture and from a `visibilitychange`
    listener; delete local synth modules.
12. **Dates**: use `dayKey`/`todayKey`/`addDays` from `@shared/store.js`;
    delete local implementations. Anything that shows "today" uses
    `useVisibleDate()` so it rolls over after midnight and on resume.
13. **Bridge**: `emitEvent` from `@shared/bridge.js` at the points named in
    the README for this app.
14. **Manifest**: add `"id"` (the base path), split the icon entry into two
    (`purpose: "any"` and `purpose: "maskable"`), add `"shortcuts"` where the
    app has obvious entry points (parsed from a `?action=` query in App).
    Add `<meta name="apple-mobile-web-app-capable" content="yes">` and
    `<link rel="apple-touch-icon" href="...icon-192.png">` to index.html.
    Ensure the viewport meta has `viewport-fit=cover`. Replace `100vh` with
    `100dvh` in CSS.
15. **Verify**: `npm run build` succeeds, `dist/sw.js` exists and its activate
    filter uses the `<name>-` prefix, `npm run build:android` succeeds (this
    runs `cap sync android`; if it fails only because of the Android SDK,
    `npx vite build --mode android` passing is enough) and no `sw.js` is
    emitted in that build. `grep -rn "window.confirm\|alert(" src` returns
    nothing. `grep -rn "em dash"`: do not introduce the character "—" in
    user-facing strings; use a comma, colon or period.
16. Do NOT run `git add`/`git commit`; do NOT edit files outside
    `apps/<name>/`; if a change to `packages/shared` is needed, describe it in
    the final report instead of making it.
