---
date: 2026-08-04
tags: [discussion, tools, pkm]
status: decided
---

# Choosing a local knowledge base

## Question

Can we create an Obsidian-style database, ideally with an open-source
Obsidian/Notion alternative that works locally, and transfer our
discussions into it?

## Options considered

- **Obsidian** — free, local-first, Markdown vault, built-in database views
  (Bases). App itself is not open source, but the data format is plain text.
- **Logseq** — fully open source, local-first, Markdown outliner. Closest
  open-source equivalent to Obsidian.
- **AppFlowy** — leading open-source Notion alternative (databases, kanban);
  local and self-hostable, but uses its own storage format.
- **Anytype** — open source, local-first, object/database model with P2P sync.
- **SiYuan** — open source, block references, built-in spaced repetition.

## Decision

Keep the knowledge base as a **plain Markdown vault inside the
life-architecture git repo** (`vault/`), viewable with Obsidian or Logseq.

Rationale:

- Plain files mean no lock-in — every tool above can import Markdown, and
  git provides history and sync for free.
- Claude can read and write the vault directly in this repo, so discussions
  can be transcribed into `90 Discussions/` as they happen.

## Related

- [[Life Architecture App]]
