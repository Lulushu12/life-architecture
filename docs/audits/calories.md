# Calories audit (apps/calories)

## 1. What it does
Five tabs (ui.jsx:57-80): Today, Foods, Training, Weight, Settings. No router.
Today (TodayView.jsx): day nav, 4 ProgressBars vs targets (hidden if target 0), 4 fixed meals (storage.js:6 breakfast/lunch/dinner/snacks), entry rows name/grams/kcal/protein, EditEntryModal edits grams only, Delete no confirm/undo. "+ Add food" opens FoodPicker full-screen (App.jsx:141-151).
FoodPicker: list step (filter cached DB sorted lastUsedAt), "Search online", "Barcode", "New custom food". Search: single-shot OFF on Enter. Barcode: BarcodeScanner. All converge cacheAndLog (31-40) -> log step: pieces stepper (piece foods), grams stepper, MacroRow, Add. Entries denormalized (118-127). addLogEntry (App.jsx:26-39) bumps lastUsedAt.
Portions (food.js): per-100g, grams source of truth, pieceWeight. No serving sizes, ml, last-used portion.
FoodEditor: name/brand/4 macros steppers, log-by-piece toggle. FoodsView alphabetical.
Recents only by lastUsedAt; no favourites/frequency/copy yesterday/templates/quick-add.
Training (TrainingView.jsx): day nav, user-defined exercise library (strength/cardio), LogForm sets grid (reps, kg) + "Add set (repeat last)", cardio min/km, shows last 5 sessions. No RPE/rest timer/PRs/volume/notes/routines.
Weight: 0.1 stepper default 70, 30-day SVG polyline (no axes, preserveAspectRatio none stretches markers), 7-day avg + delta, 14 recent.
Settings: 4 target steppers, metric only, BackupPanel.

## 2. Architecture
One useState store (App.jsx:13). Shape storage.js:8-17: foods, exercises, logs{date}{meal}[], training{date}, weights{date}, settings.targets. Key calories-v1, whole-store serialize per change (App.jsx:21-23). No pruning/version/migration. ~1MB/year + duplicate foods. loadStore resets silently on parse fail (35-38); quota errors swallowed.
Backup: same as whist; mergeImport LWW per record (storage.js:76-101). backup.js byte-identical to life-architecture.
OFF (offc.js): v2 search search_terms, fields code/product_name/brands/nutriments, page_size 20, 10s AbortController; legacy fallback only on throw/non-OK (54-66). Barcode /api/v2/product/{code}.json. No caching/debounce/pagination/country/lang. Only kcal/P/C/F; no-kcal products dropped.
BarcodeScanner: BarcodeDetector + getUserMedia rAF loop ean_13/ean_8; manual entry always. APK: no CAMERA permission => getUserMedia rejects => "Camera permission denied". iOS: no BarcodeDetector. Works only Chrome Android PWA.
PWA: sw.js same pattern. No apple meta. No routing; Android back closes app from FoodPicker.

## 3. UX / visual
560px, lime accent #84cc16 + sky secondary. Small text: tab labels 10.5px, tags 10.5px. Only progress bar + toggle animate. No toast/undo/haptics. Empty states one-liners. Native confirm for Training/Weight/Foods deletes; none for Today entries. Logging cached food @100g = 3 taps; other portions 5g steps (150g = 10 taps). NumInput clamps per keystroke, can't clear; weight min=20 makes "7"->20->"205". Training inputs type=number no inputMode. Search: OFF order as-is, no dedupe, no "already in DB", no country bias (owner in Romania), results show kcal only. A11y: clickable divs, no aria-labels, labels not bound, focus outline removed (styles.css:203-206), no aria-current, emoji tab icons.

## 4. Bugs
1. kJ treated as kcal: offc.js:16 falls back to energy_100g (kJ) => 4.18x calories.
2. Grams stepper dead for piece foods (FoodPicker.jsx:107).
3. Duplicate foods on every OFF pick (cacheAndLog draft.id || newId(); no dedupe by code).
4. Stale "today" after midnight (App.jsx:15-16, WeightView.jsx:46); no visibilitychange.
5. Editing piece entry desyncs pieces (App.jsx:41-55).
6. Exercise type change crashes LogForm history (TrainingView.jsx:149-151).
7. v2 empty-OK never triggers legacy fallback (offc.js:55-63); verify v2 full-text.
8. NumInput can't clear/clamps mid-typing (ui.jsx:7-12).
9. Android back closes app.
10. Camera button shown in APK where it can't work.
11. Silent data loss: quota swallowed, parse reset.
12. mergeImport resurrects deleted entries (localUpdated 0, storage.js:86-89).
13. Minor: index keys, Modal no Escape/focus trap, sw respondWith undefined, manifest icon purpose.

## 5. Proposals
### Must-do
- Fix kJ fallback (/4.184, read energy-kj). S.
- Dedupe OFF foods by barcode + one-time dedupe on load. S.
- Roll date forward on visibilitychange/focus. S.
- Fix piece-food stepper + pieces edit. S.
- Rewrite NumInput text-mode inputMode=decimal, string draft, clamp on blur. S.
- Android back (pushState for sub-screens). M.
- Hide camera where unsupported. S.
- Surface storage failures (banner, keep corrupt blob under second key). S.
- Focus styles + semantic buttons + aria. S.
### High-value
- Remember last portion per food. S.
- Unified search box (local instant + OFF after debounce/Enter, mark already-in-DB). M.
- Frequent + favourites (useCount, star, recency-frequency score). S.
- Copy yesterday / copy meal. S.
- Quick-add macros. S.
- Meal templates (seed from LA meals.js OPTIONS). M.
- Richer OFF fields (serving_size, nutriscore, nova, fiber, sugars, sat fat, salt, image) + cc=ro&lc=ro + P/C/F on rows + "macros incomplete" flag + serving chips. M.
- Weight EMA (alpha ~0.1) trend + weekly rate + axis labels; weight.js. S.
- Adaptive TDEE (mean kcal + 7700 × weekly EMA delta / 7 over 2-3 weeks, coverage check) + suggested target w/ confirm. M.
- Weekly dashboard (7 bars kcal vs target, protein avg, adherence, EMA delta). M.
- Training ergonomics: set checkmarks, RPE, prefill from last session, rest timer w/ vibrate, e1RM + PR badge, volume, routines. M.
- Undo toast instead of confirm. S. Today feedback toast + highlight + haptic. S.
### Nice-to-have
Fiber/sugar/salt/sat fat (S-M); water counter (S); eatenAt (S); CSV export (S); storage compaction + version + migrate, IndexedDB later (M); settings (country, default meal by time, week start, light theme) (S-M); PWA meta + update prompt (S); Android CAMERA permission trade-off, status bar, keyboard resize (S-M); voice/text entry after unified search (L); useMemo + rAF-debounced save (S).

## 6. Cross-app
LA Nutrition.jsx: 5 fixed slots (meals.js:7-13), hard-coded 2100/160/65/210 (constants.js:44-48), preset options, custom macros, waist/weight every 2nd Sunday; data la3_local_meal_{date}, la3_local_bm_{date} (data/logs.js), synced to git branch. Train.jsx fixed PPL + overloadGate.js.
Overlap: totals vs targets, weight log, set-based training. No shared schema (calories-v1 vs la3_local_*, 4 vs 5 slots, per-100g vs absolute, user exercises vs catalog). Same day can be double-logged. Same origin on Pages => LA can read calories-v1 today; not across APKs.
Recommendation: Calories = food + body-weight source of truth; LA Nutrition becomes protocol layer reading totals/weights from Calories (same-origin key on web; backup import or shared sync branch on Android). Seed Calories templates from meals.js OPTIONS, default targets from constants.MACROS. Training: keep LA home of overload gate/PPL; either drop Calories training tab or extract overloadGate.js + exercises.js to shared package.
