# Evidence Update Protocol

How the Ortho Codex stays current. A scheduled Claude routine (monthly) runs this protocol;
it can also be run on demand by asking Claude to "run the ortho evidence sweep".

## Procedure

1. **Inventory.** List all monographs in `ortho-db/**/*.md` and read each file's frontmatter
   (`id`, `specialty`, `updated`).
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
   - Bump `updated:` in the frontmatter.
4. **Deliver.** Commit to a branch (`claude/ortho-evidence-sweep-YYYY-MM`), push, and open a
   PR summarizing per-specialty changes so they can be reviewed before merge.
5. **No-op months are fine.** If nothing practice-changing surfaced, report that and skip the PR.

## Quality bars

- Every claim in an evidence bullet carries a link (guideline page, PubMed/DOI).
- Prefer primary sources over news coverage.
- Note evidence level where meaningful (RCT, meta-analysis, guideline strength).
- Never delete older evidence bullets — they form a running changelog of practice.
