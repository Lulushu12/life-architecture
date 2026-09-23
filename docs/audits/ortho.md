# Ortho audit (apps/ortho)

## 1. What it does
Screens via view state (App.jsx:21, if-chain 43-130), no router: Home (search btn, + New article, Concurs card w/ days-to-probe + due count, 5 category cards, Favorites, Recents(10), BackupPanel), CategoryView (region/specialty chip filters), ArticleView (TopBar, star, Edit for local only, tags, one .card.articlebody), SearchView (autofocus, snippet), Editor (title, category chips, tags, 16-row textarea, preview, save/delete), ConcursHome (3 probe cards co/ct/p from tematica.js:7-29, dates 2026-09-24/28/30), ConcursProbe (question session capped 40, sort chips, 83 topic rows), ConcursTopic (tabs Recap / Prezentare|Operație / Întrebări; related: frontmatter; drillKey resets drills on every tab tap, line 70).
Content: two eager import.meta.glob ?raw (content.js:14, concurs.js:15). Frontmatter hand-parsed keeping only title/tags/region/specialty; `updated:` discarded (present in 451 files, required by UPDATE-PROTOCOL). Concurs sliced by H2 regexes (concurs.js:39-41), script split on `### N. Title (2 min)` (66-95), questions `### Î1.` / `**R:**` (98-110). tematica hard-coded (15 co + 38 ct + 30 p).
Search (search.js): no lib/index; per query normalizes every body (4 regex passes) + substring; title +10, tags +5, body +1. No fuzzy/diacritics/prefix. Concurs excluded (content.js:71).
SRS (concurs.js:152-206): SM-2 variant, 4 grades; Again 10 min, Good 1d/3d/interval*ease, Easy 3d..., cap 7 days. Keys positional `${topicId}#q${index}` (162). Queue due oldest, then unseen, then soonest.
Oral drill (PresentDrill.jsx): ready/run/review; 250ms tick; step titles only; review reveals content w/ times (red >1.25x), GradeRow per step writes SRS `#s{i}`; score sum/(3n)*100; sessions last 500.
Local articles in ortho-v1 blob {id local/<uuid>, ...}; bundled read-only. Backup shared panel; merge newer per id.

## 2. Architecture
Single store write-through. Screens unmount on view change => filters/tab/drill/scroll lost. 538 files, 7.76MB raw MD inlined into main chunk (~2MB gz), buildArticles (455 parses + sort) at module init. Search O(corpus) per keystroke, no memo/debounce; getArticle/categories re-merge/sort 455 per call. SW shell-only precache, constant CACHE_NAME. No pushState/popstate; no @capacitor/app => hardware back exits. base hard-coded in manifest.

## 3. UX / visual
560px, accent #60a5fa. Body 16px/1.6, h1 22, h2 17, h3 15, h4 13.5. 70KB monographs as one unbroken card: no TOC, sticky heading, collapsibles, progress, position memory. Tables 13.5px in h-scroll wrapper, nowrap headers; 1,271 rows w/ 4 cols, 254 w/ 5-6 => side-scroll walls. Non-sticky TopBar, ellipsized titles. Back loses scroll/filters; no scrollTo(0,0) => opens mid-article. Search: separate screen, no recents/scope/in-article find. Dark only, no font size control, lang="en" but Concurs Romanian. A11y: div onClick rows everywhere (ui.jsx:44, Home.jsx:48/63/77, ConcursProbe.jsx:72, ConcursHome.jsx:23); 11-11.5px chip counts/table headers. Exam prep UX is the strongest part.

## 4. Bugs
1. Lists glued to preceding line swallowed into paragraph (markdown.jsx:137-144). Pattern `**Indications**\n- item` in 268 files (213/214 techniques, all 36 diagnoses, 15 concurs, 3 classifications) => run-on paragraph w/ literal dashes. Most visible defect.
2. Ordered lists restart at 1 after nested bullets (markdown.jsx:127-134 no start; 116 flattens indents). 49 files affected.
3. Templates ship as articles (content.js:63-87 never skips `_` slugs; concurs.js:116 does). Checklists contains only the template.
4. `updated:` dropped => evidence sweep invisible.
5. Search O(corpus) per keystroke, no debounce (SearchView.jsx:8, search.js:38); getArticle re-merges per call (content.js:105-124).
6. Concurs topics unsearchable.
7. Positional SRS keys (concurs.js:162): editing questions reassigns history.
8. No back-stack; hardware back exits; no scroll reset/restore.
9. Tab tap discards in-progress drill (ConcursTopic.jsx:66-71).
10. No wake lock during 12-min presentation.
11. Editor loses unsaved text on Back (Editor.jsx:31).
12. SW never prunes/signals.
13. .chip defined twice conflicting (styles.css:169, 362); useMemo in CategoryView.jsx:66-67 never memoizes.
14. Content: 231 literal `(?)` markers rendered verbatim; "Full context: X in Diagnoses" trailer in 451 files is plain text not a link.
15. Inline regex can't nest bold/italic; blockquotes joined.

## 5. Proposals
### Must-do
- Fix block parser: stop paragraph at list/table/heading/quote/fence; one nesting level; `start` on ol; images. Parser unit test. S/M.
- Skip `_` templates; prefill from template in Editor. S.
- History + back handling (hash/pushState, popstate, @capacitor/app), scrollTo(0,0), restore list scroll. Deep links `#/article/diagnoses/coxartroza`. M.
- Search index at build (normLower once, NFD diacritic strip), debounce 100ms, useMemo, include 83 concurs topics. S/M.
- Stable SRS keys (hash of question text) + one-time migration. S/M.
- Wake lock in PresentDrill run phase. S.
- Editor dirty guard + autosave draft. S.
### High-value
- Monograph reading mode: TOC sheet from heading blocks, sticky compact header w/ current H2 + progress bar, collapsible H2 (Quick Reference open), remember scroll per article. M.
- Typography scale + tables: font-size setting S/M/L, body 17px/1.65, H2 rule, sticky first col, wrapping headers, "cards" toggle for 5+ col tables. M.
- Cross-links + backlinks: "Full context" trailer -> real link; `[text](category/slug)` internal links; backlinks block ("Referenced by"). M.
- Updated badges: keep `updated`, show on rows/header, "Recently updated" strip. S.
- Daily review queue + stats (reviews/day, retention, lapses/topic, 7-day forecast). M.
- Coverage heatmap 83 cells + weak-area drill + "never presented" filter. S/M.
- Oral drill: vibrate over target, pause, MediaRecorder capture to IndexedDB w/ playback, rubric from Fraze-cheie checkboxes, per-step timing history. M/L.
- Exam-day mode (daysUntil <= 2): one-pass coverage, printable Fraze-cheie digest. S.
- SRS: in-session relearning requeue (S), learning step for Hard on new; FSRS-4.5 post-exam (M).
- Cloze/auto cards from "Key numbers" + classification tables. L.
- Authoring export: "Copy as .md" w/ frontmatter + filename; export all local as zip. S/M.
- PWA update flow + precache. M.
- Cold-start: lazy category globs / prebuilt JSON index + manualChunks. M/L.
- Settings (font size, theme incl. light for wards, exam dates, max interval, language). M.
- A11y: buttons/roles, lang="ro" wrapper, aria-live timer, 44px grade buttons. S.
- Android: back, haptics on grade, adjustResize for Editor, filesystem+share for backup. M.
### Nice-to-have
Images w/ zoom; recent/pinned searches + TF ranking + in-article find; read-aloud speechSynthesis RO; interactive checklists; tag browse; print-to-PDF; Firebase sync of local articles + progress.

## 6. Cross-app
backup.js identical md5 in ortho/whist/chess/calories/life-architecture; BackupPanel identical ortho/whist/calories, LA diverged. sw.js 8-way copy. Tokens identical except --accent (chess own palette; LA different var names --bg2/--fg/--mut). packages/shared fits: deploy.yml already builds all in one job.
