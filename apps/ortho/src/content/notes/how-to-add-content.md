---
title: How to add content
tags: meta, howto, formatting
---

This app has no built-in editor. All content is Markdown files that live in
the repo at `apps/ortho/src/content/<category>/<slug>.md` and get bundled
into the app at build time — so once deployed, every article works fully
offline.

## Folder = category

There are exactly four category folders, and the folder name **is** the
category shown in the app:

- `classifications/`
- `techniques/`
- `checklists/`
- `notes/`

To add a new article, drop a new `.md` file into one of those folders. The
filename (without `.md`) becomes the article's slug and is used to build its
id (`category/slug`). Use lowercase, hyphen-separated filenames, e.g.
`ankle-fracture-weber.md`.

## Front matter

Every file starts with a small front-matter block between two `---` lines:

```
---
title: Article title
tags: comma, separated, tags
---
```

`title` is shown everywhere the article is listed. `tags` is a
comma-separated list — they're rendered as chips on the article page and are
searchable. Everything after the closing `---` is the article body,
rendered as Markdown.

## Supported Markdown features

This file intentionally exercises every feature the renderer supports, so
opening it is also a quick visual test of the rendering pipeline.

### Headings

Use `#`, `##`, `###` for the three heading levels (this section is an `###`
example).

### Text styling

You can write **bold text**, *italic text*, and `inline code` inline with
normal prose.

### Links

Here is [an example link](https://example.com) pointing off-app — links open
in a new tab.

### Lists

Unordered list:

- Imaging reviewed
- Consent confirmed
- Equipment checked

Ordered list:

1. Draft the article
2. Fill in the sections
3. Save the file — it appears in the app on the next deploy

### Blockquote

> A blockquote is useful for a caveat, a reminder, or a quoted source.

### Horizontal rule

Above and below this paragraph is a horizontal rule.

---

### Code block

Fenced code blocks render in a monospace block, useful for structured notes
or pseudo-steps:

```
Example fenced block.
Line two of the block.
```

### Table

Pipe-syntax tables render as a scrollable table:

| Column A | Column B | Column C |
| --- | --- | --- |
| Row 1 value | Row 1 value | Row 1 value |
| Row 2 value | Row 2 value | Row 2 value |

## What NOT to do

Don't rely on any Markdown feature not listed above (no images, no nested
lists, no HTML) — the renderer is intentionally minimal and hand-written, so
unsupported syntax will just print literally instead of rendering.
