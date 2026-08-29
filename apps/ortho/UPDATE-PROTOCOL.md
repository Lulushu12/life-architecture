# Evidence Update Protocol

How the Ortho app's knowledge base stays current. A scheduled Claude routine (monthly) runs
this protocol; it can also be run on demand by asking Claude to "run the ortho evidence sweep".

The knowledge-base monographs live in `apps/ortho/src/content/diagnoses/` (36 files, one per
diagnosis cluster, each tagged with a `specialty:` frontmatter key). Atomic articles extracted
from them live in `apps/ortho/src/content/classifications/` and `.../techniques/` — those two
directories also contain the user's own hand-written articles, so edit only files that clearly
derive from a monograph (they end with a "*Full context: … in the Diagnoses section.*" line).
The checklists and notes categories are the user's own and are NEVER touched by this protocol.

## Procedure

1. **Inventory.** List all monographs in `apps/ortho/src/content/diagnoses/` and read each
   file's frontmatter (`title`, `specialty`, `updated`).
2. **Sweep.** For each specialty, search for publications since the oldest `updated` date in
   that specialty:
   - New or revised clinical practice guidelines: AAOS, NICE, ESSKA, ISAKOS, EFORT, AOSpine,
     BOA/BOAST standards, ACR appropriateness criteria, EULAR/OARSI (for OA), IDSA (for MSK
     infection), POSNA (peds).
   - Landmark RCTs and meta-analyses in the major journals: JBJS, Bone & Joint Journal, CORR,
     AJSM, KSSTA, Spine, JSES, Foot & Ankle International, JPO, Injury, Arthroscopy.
   - Practice-changing findings only — ignore incremental case series.
3. **Update.** For each affected monograph:
   - Add dated bullets to `## Recent Evidence & Guidelines (2023–2026)` (rename the year range
     as it grows) with source links.
   - If a finding changes a treatment recommendation, update the relevant `## Treatment` or
     `## Quick Reference` content too — don't leave the card contradicting the evidence.
   - If the change affects a classification or technique that has an extracted article in
     `classifications/` or `techniques/`, update that article to match.
   - Bump `updated:` in the frontmatter.
4. **Verify.** `cd apps/ortho && npm install && npm run build` must pass.
5. **Deliver.** Commit to a branch (`claude/ortho-evidence-sweep-YYYY-MM`), push, and open a
   PR summarizing per-specialty changes so they can be reviewed before merge.
6. **No-op months are fine.** If nothing practice-changing surfaced, report that and skip the PR.

## Quality bars

- Every claim in an evidence bullet carries a link (guideline page, PubMed/DOI).
- Prefer primary sources over news coverage.
- Note evidence level where meaningful (RCT, meta-analysis, guideline strength).
- Never delete older evidence bullets — they form a running changelog of practice.
