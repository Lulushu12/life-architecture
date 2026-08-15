# Ortho Codex — Orthopedic Knowledge Database

Source of truth for the in-app **Ortho Codex** section of Life Architecture. Every file in
this directory (except this README and `UPDATE-PROTOCOL.md`) is one *monograph* covering a
cluster of closely related orthopedic diagnoses. The app loads these markdown files at build
time (`import.meta.glob` in `src/OrthoCodex.jsx`), so editing a file here and rebuilding is
all it takes to update the app — offline-capable via the PWA.

> **Disclaimer:** Personal clinical reference for a licensed orthopedic surgeon. Not a
> substitute for institutional protocols, local guidelines, or clinical judgement.

## Directory layout

```
ortho-db/
  trauma/          Fracture care, polytrauma, open fractures
  arthroplasty/    Degenerative joint disease, replacement, PJI, revision
  sports/          Arthroscopy, ligament/tendon/cartilage, instability, RTP
  spine/           Degenerative, deformity, trauma, infection/tumor of spine
  hand-wrist/      Carpal trauma/instability, neuropathies, tendon disease
  foot-ankle/      Forefoot deformity, PCFD, Charcot, ankle arthritis
  peds/            Pediatric hip, physeal fractures, clubfoot, infections
  onco-metabolic/  Bone tumors, osteomyelitis, osteoporosis/fragility
```

## File schema

Each monograph starts with YAML frontmatter, then a fixed section order. The app's parser
depends on this structure — keep the `## ` headings exactly as written.

```markdown
---
id: proximal-femur-fractures            # kebab-case, unique, matches filename
title: Proximal Femur Fractures         # display title
region: Hip & Femur                     # anatomic region (filter facet)
specialty: Trauma                       # Trauma | Arthroplasty | Sports | Spine | Hand & Wrist | Foot & Ankle | Pediatrics | Oncology & Metabolic
diagnoses: [Femoral neck fracture, Intertrochanteric fracture, Subtrochanteric fracture]
classifications: [Garden, Pauwels, AO/OTA 31, Evans-Jensen, Seinsheimer, Russell-Taylor]
tags: [hip fracture, fragility, hemiarthroplasty, cephalomedullary nail]
updated: 2026-08-15                     # date of last content/evidence refresh
---

## Quick Reference
(The rapid card layer: classification table(s) with treatment implications, first/second-line
treatment ladder in a compact table, red flags, key numbers. Must stand alone for clinic/pre-op use.)

## Anatomy & Pathophysiology
## Clinical Evaluation & Imaging
## Classification
(Every clinically used classification, with grades/types spelled out and what each changes in management.)

## Treatment
### Non-operative
### Injections & Adjunctive Procedures   (omit if genuinely not applicable)
### Operative
(Techniques described at decision-making depth: indications, approach options, fixation/implant
choice, key technical points and pitfalls.)

## Rehabilitation Protocol
(Phased, with timelines, weight-bearing/ROM milestones, physio content, return-to-work/sport criteria.)

## Complications
## Recent Evidence & Guidelines (2023–2026)
(Dated bullets: guideline updates — AAOS, NICE, ESSKA, ISAKOS, AOSpine, BOAST... — landmark RCTs,
meta-analyses, and what changed in practice. Each bullet cites its source.)

## Key References
(Numbered list with links: guidelines, classic papers, recent trials.)
```

## Updating

See `UPDATE-PROTOCOL.md`. A scheduled Claude routine sweeps for new guidelines and landmark
publications and refreshes the `Recent Evidence` sections; manual edits are equally welcome —
bump `updated:` in the frontmatter when you change clinical content.
