# Whist & Rentz audit (apps/whist)

## 1. What it does
Screens via view.screen (App.jsx:11,38-64): Home, WhistSetup, RentzSetup, WhistGame, RentzGame. No URL routing.
Home: New Whist / New Rentz, Unfinished + History GameCards sorted by updatedAt; summary() recomputes whole game per card per render (5-18); delete via confirm(); BackupPanel at bottom.
WhistSetup: PlayersEditor (3-6, ui.jsx:54-82), first dealer chips, collapsible rules (round order 1-8-1 or 8-1-8, counts of 1/8-card rounds, exact-bid base/per-trick, miss base/penalty, streak toggle/len/bonus/malus, "dealer can't equalize bid sum").
WhistGame: topbar round/cards/dealer + Undo; entry card w/ chips in bidding order (dealer last ♦), NumberGrid 0..cards; ScoreTable (174-251) sticky header + totals, bid small, cum green/red, ★/▼ streak; tap row -> RoundEditor (selects, tricks-sum check). Standings when done.
RentzSetup: players, first chooser, per-mini-game toggle + point steppers.
RentzGame: chooser grid (used dimmed), HandEntry by type (PlayerPick, UnitsEntry steppers w/ x/8 counter, OrderEntry, Totale composite). pending stored in game (survives kill). Undo pops hand w/ confirm. RentzTable delta over cum; HandEditor.

### Scoring (rules.js)
Whist sequence (20-28): N×1, 2..7, N×8, 7..2, N×1 (24 rounds for 4p). Standard.
Per round (55-83): hit 5+bid; miss -(|taken-bid|). Standard. Streaks (63-77): 5 consecutive hits +10, 5 misses -10, reset. Common "primă". Missing variants: skip 1-card rounds from streak counting (add streakSkipOnes); alternative bonus schemes.
Bid constraint (WhistGame.jsx:36-40) correct; tricks constraint (41-48) correct; RoundEditor does NOT enforce forbidEqualSum (259-260).
Rentz defs (102-111): Whist +50/trick, Popa de roșu -200, 10 treflă +200, Damele -40×4, Caro -30×2N, Levata -50×8, Totale composite (143-151), Rentz positions 400/200/100/0. Configurable. Gaps: Totale membership hard-coded, no dealer concept, no negative last place, no alternate order rule. Arithmetic looks right.

## 2. Architecture
store {games:{id}} key whist-rentz-v1, write-through. view not persisted. Config snapshotted at creation (rules.js:2-3). Derive-on-read (computeWhist/computeRentz per render) => edit-with-recompute free. Undo walks back entry order. backup.js + BackupPanel (textarea/clipboard/download-if-not-APK/import), mergeImport newer updatedAt wins (storage.js:38-45). exportStore dead (storage.js:28-35). sw.js cache-first fixed name whist-v1. Manifest portrait-primary. Capacitor no plugins.

## 3. UX / visual
560px column, entry card above 52vh scrolling table. No @media at all. Table numbers small: .bid 10.5px (481), .cum 14px, totals 15px: not readable across a table. Dark only, green (Whist) / sky (Rentz). No per-player colour. Only .numbtn:active feedback. No toasts/haptics/round summary. No recent players. One-tap bids with auto-advance is good; disabled numbers unexplained (25% opacity); last player's forced tricks still need a tap; Rentz steppers up to 8 taps; no autofocus/enterKeyHint. A11y: no aria on ‹ ✕ toggles numbers; Undo 33px, iconbtn 38px, pchip 31px. Native select/confirm.

## 4. Bugs
1. Bad import bricks app permanently: validate = d && d.games (Home.jsx:88); game w/o players -> computeRentz throws (rules.js:157), store already written, no error boundary.
2. Android back exits from any screen.
3. SW cache never rotates (sw.js:7, 47-50); first offline launch after update can fail.
4. GameCard defined inside Home (Home.jsx:27) => remounts.
5. Sticky totals magic top:37px (styles.css:448).
6. exportStore dead.
7. RoundEditor doesn't enforce forbidEqualSum.
8. Leader ignores ties; "Player 1 0" on fresh game (Home.jsx:15-16; ui.jsx:84-100).
9. Duplicate names accepted (ui.jsx:69-79).
10. NumInput ignores empty/NaN (ui.jsx:27-30); no inputMode for negatives.
11. Mixed EN/RO, lang="en".
12. Rentz Undo w/ pending discards silently; "change game" duplicates it (72-81).
13. HandEditor can't change game/chooser (351-379).

## 5. Proposals
### Must-do
- Schema-validate imports + error boundary w/ "export then reset". S.
- Android back + persist view (@capacitor/app). S.
- Recent players chips + "Play again" (rotate dealer/chooser). S/M.
- Explain constrained numbers + single big "Ana takes 3" button / auto-commit. S.
- Legible scoreboard: .cum 17-18px, .bid 12px, totals 20px + rank badges + delta-to-leader, sticky-left # col, kill magic top. S.
- Touch targets 44px + aria labels/roles. S.
- Versioned SW cache + update toast. S.
### High-value
- Round-complete toast + vibrate + row highlight. S.
- Landscape/table mode (drop orientation lock; entry left, table right; "Table view" big totals). M.
- Fast Rentz units entry: tap-to-increment chips + "rest to X" + auto-fill last. M.
- Stats screen (per-player games/wins/avg/best round/longest streak/head-to-head; cumulative line chart). M.
- Share results (navigator.share text + canvas PNG). M.
- Rules variants: streakSkipOnes, Totale membership, negative last place, optional Rentz dealer, enforce forbidEqualSum in editor. S each.
- In-game rename, change first dealer before round 1, block duplicate names. S.
- Undo toast w/ Redo; confirm only crossing completed round. S.
- History grouping by month, filter, search. S.
- HandEditor change game/chooser. S.
### Nice-to-have
Per-player colours/avatars (S); wake lock (S); delta vs cum toggle (S); light theme + color-scheme meta (M); RO/EN toggle (M); durations/timestamps (S); 7-8 player double deck (S); custom confirm sheet (S).

## 6. Cross-app
backup.js + BackupPanel byte-identical in whist/calories/ortho (LA differs in class names). sw.js differs by name/path only. Tokens identical except --accent (calories adds --accent-ink). => packages/shared: backup, BackupPanel, tokens.css, sw template, useWakeLock. whist ui.jsx primitives cleanest seed. Home "cards by updatedAt + ✕ + BackupPanel" pattern shared w/ ortho, breathe => shared HistoryList. README conventions omit: config snapshot + derive-on-read, write-through root store, clipboard-first backup rationale, Android back handling.
