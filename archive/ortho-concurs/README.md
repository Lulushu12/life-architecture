# Ortho: Concurs (archived)

Exam-prep section of `apps/ortho`, removed from the live app on 2026-09-24.
Nothing here is bundled or served. Files were moved, not copied, so this is
the only copy.

## What it was

A drill mode for the Foișor 2026 specialist post exam (orthopaedics and
traumatology). Each of the 83 topics in the official tematica has one
Markdown file written to a fixed template: `## Recapitulare` (read),
`## Script de prezentare` or `## Script operator` (present out loud, timed and
graded per `###` step) and a questions section (`### Î1.` / `**R:**` pairs).
Script steps and questions were scheduled with an SM-2 style algorithm
(grades 0 again, 1 hard, 2 good, 3 easy; intervals capped at 7 days).

Probes targeted (see `src/tematica.js`, `PROBES`):

| key  | probe                  | date       |
|------|------------------------|------------|
| `co` | Clinică ortopedie      | 2026-09-24 |
| `ct` | Clinică traumatologie  | 2026-09-28 |
| `p`  | Practică operatorie    | 2026-09-30 |

## Layout

```
content/concurs/*.md   was apps/ortho/src/content/concurs/
src/concurs.js         was apps/ortho/src/concurs.js (content parsing + scheduling)
src/tematica.js        was apps/ortho/src/tematica.js (PROBES, TOPICS)
src/ConcursHome.jsx    probe list
src/ConcursProbe.jsx   topics of one probe + mixed question drill
src/ConcursTopic.jsx   one topic: study / present / questions
src/PresentDrill.jsx   timed presentation drill
src/QuestionDrill.jsx  flashcard question drill
src/concurs.css        was the tail of apps/ortho/src/styles.css ("Concurs (exam prep)" block)
```

## Stored progress

Progress stays in the app's localStorage key `ortho-v1` under `concurs`.
`storage.js` still defaults and normalizes it so existing progress is kept,
but nothing reads it.

```
concurs: {
  items: {
    "<topicId>#q<index>" | "<topicId>#s<index>": {
      reps, ease, interval, lapses, due, seen, last, at
    }
  },
  sessions: [
    { topicId, mode: "present", at, durationSec, targetSec, grades: [0..3], score }
  ]
}
```

`topicId` is `<probe key>-<nn>-<slug>` (the Markdown file name), `q` is a
question and `s` a script step; `due` and `at` are epoch ms, `interval` is days.

## Re-enabling

1. Move the files back:
   `mv content/concurs ../../apps/ortho/src/content/`,
   `mv src/*.js src/*.jsx ../../apps/ortho/src/`, and append
   `src/concurs.css` to the end of `apps/ortho/src/styles.css`.
2. Exclude the folder from the reference library: in
   `apps/ortho/scripts/build-index.mjs` skip the `concurs` category when
   walking `src/content/` (it was `if (category === "concurs") continue;` in
   `buildArticles()` of `src/content.js` before the index was generated at
   build time).
3. `App.jsx`: import `ConcursHome`, `ConcursProbe`, `ConcursTopic`; add
   `"concurs"`, `"concurs-probe"`, `"concurs-topic"` to `SCREENS`; in
   `stackFor` map `concurs-probe` and `concurs-topic` to
   `[HOME, { screen: "concurs" }, v]`; render
   `<ConcursHome store onOpenProbe={(key) => nav({ screen: "concurs-probe", key })} onBack={back} />`,
   `<ConcursProbe probeKey={view.key} store setStore onOpenTopic={(id) => nav({ screen: "concurs-topic", id })} onBack={back} />` and
   `<ConcursTopic topicId={view.id} store setStore initialMode={view.mode} onOpenArticle={openArticle} onBack={back} />`;
   pass `onConcurs={() => nav({ screen: "concurs" })}` to `Home`.
4. `Home.jsx`: import `daysUntil, topicList, topicProgress` from
   `./concurs.js` and `PROBES` from `./tematica.js`, accept `onConcurs`, and
   put the card back under the "+ New article" button:

   ```jsx
   const nextProbe = PROBES.find((p) => daysUntil(p.date) >= 0) || PROBES[PROBES.length - 1];
   const nextDays = daysUntil(nextProbe.date);
   const dueTotal = topicList().reduce((a, t) => {
     const p = topicProgress(store, t);
     return a + p.qDue + p.sDue;
   }, 0);

   <RowButton className="probecard concurs-entry" onClick={onConcurs}>
     <span className="probecard-head">
       <span className="probecard-title">Concurs Foișor 2026</span>
       <span className={"probecard-days" + (nextDays <= 3 ? " soon" : "")}>
         {nextDays > 0 ? `${nextDays} zile` : nextDays === 0 ? "azi" : "încheiat"}
       </span>
     </span>
     <span className="probecard-sub">
       {nextDays >= 0 ? `Urmează: ${nextProbe.label}` : "Toate probele au trecut"}
       {dueTotal > 0 ? ` · ${dueTotal} scadente` : ""}
     </span>
   </RowButton>
   ```
5. `storage.js`: restore backup merging of concurs progress in `mergeImport`
   (`concurs: mergeConcurs(store.concurs, imported.concurs)`), where
   `mergeConcurs` keeps the newer item state per key (by `at`) and unions
   sessions by `topicId:at`, sorted by `at`.
6. `concurs.js` loads its topics with an eager `import.meta.glob`; switch it
   to a lazy glob or the bundle grows by about 1.9 MB again.
