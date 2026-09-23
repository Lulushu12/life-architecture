const LIST_RE = /^([ \t]*)([-*+]|\d{1,9}[.)])([ \t]+)(.*)$/;
const FENCE_RE = /^[ \t]*```/;
const HEADING_RE = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const HR_RE = /^ {0,3}(?:-[ \t]*){3,}$|^ {0,3}(?:\*[ \t]*){3,}$|^ {0,3}(?:_[ \t]*){3,}$/;
const QUOTE_RE = /^ {0,3}>/;
const HREF = "((?:[^()\\s]|\\([^()\\s]*\\))+)(?:\\s+\"[^\"]*\")?";
const INLINE_RE = new RegExp(
  [
    "`([^`]+)`",
    "!\\[([^\\]]*)\\]\\(" + HREF + "\\)",
    "\\[([^\\]]+)\\]\\(" + HREF + "\\)",
    "\\*\\*(?=\\S)(.+?)\\*\\*",
    "\\*(?=[^\\s*])([^*]+?)\\*",
  ].join("|"),
  "g"
);
const INTERNAL_RE = /^(?:\.{1,2}\/)*([a-z][a-z0-9-]*)\/([A-Za-z0-9][\w-]*)(?:\.md)?(?:#[\w-]*)?$/;

function foldText(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function expandTabs(s) {
  return s.replace(/\t/g, "    ");
}

function indentOf(line) {
  return expandTabs(line.match(/^[ \t]*/)[0]).length;
}

function dedent(line, n) {
  const l = expandTabs(line);
  let i = 0;
  while (i < n && l[i] === " ") i++;
  return l.slice(i);
}

export function internalTarget(href) {
  if (!href || href.includes("://") || href.startsWith("/") || href.startsWith("#")) return null;
  const m = href.match(INTERNAL_RE);
  return m ? `${m[1]}/${m[2]}` : null;
}

export function parseInline(text) {
  const out = [];
  let last = 0;
  const re = new RegExp(INLINE_RE.source, "g");
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: "text", v: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: "code", v: m[1] });
    else if (m[3] !== undefined) out.push({ t: "img", alt: m[2] || "", src: m[3] });
    else if (m[5] !== undefined) {
      out.push({ t: "link", href: m[5], internal: internalTarget(m[5]), c: parseInline(m[4]) });
    } else if (m[6] !== undefined) out.push({ t: "strong", c: parseInline(m[6]) });
    else if (m[7] !== undefined) out.push({ t: "em", c: parseInline(m[7]) });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out;
}

export function inlineText(tokens) {
  return tokens
    .map((k) => (k.t === "text" || k.t === "code" ? k.v : k.t === "img" ? k.alt : inlineText(k.c || [])))
    .join("");
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(line) && line.includes("-");
}

function splitTableRow(line) {
  let l = line.trim();
  if (l.startsWith("|")) l = l.slice(1);
  if (l.endsWith("|") && !l.endsWith("\\|")) l = l.slice(0, -1);
  return l.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
}

function isTableStart(lines, i) {
  return /^\s*\|/.test(lines[i]) && i + 1 < lines.length && isTableSeparator(lines[i + 1]);
}

function isBlockStart(lines, i) {
  const l = lines[i];
  return (
    FENCE_RE.test(l) ||
    HEADING_RE.test(l) ||
    QUOTE_RE.test(l) ||
    HR_RE.test(l) ||
    LIST_RE.test(l) ||
    isTableStart(lines, i)
  );
}

function makeSlugger() {
  const seen = new Map();
  return (text) => {
    const base =
      foldText(text)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "section";
    const n = seen.get(base) || 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n + 1}` : base;
  };
}

function parseList(lines, i, ctx) {
  const first = lines[i].match(LIST_RE);
  const baseIndent = indentOf(first[1]);
  const ordered = /\d/.test(first[2]);
  const block = { type: "list", ordered, start: ordered ? parseInt(first[2], 10) : 1, items: [] };

  while (i < lines.length) {
    const m = lines[i].match(LIST_RE);
    if (!m || indentOf(m[1]) > baseIndent || /\d/.test(m[2]) !== ordered) break;
    const offset = indentOf(m[1]) + m[2].length + expandTabs(m[3]).length;
    let text = m[4].trim();
    i++;

    while (i < lines.length && lines[i].trim() !== "" && !isBlockStart(lines, i)) {
      text += " " + lines[i].trim();
      i++;
    }

    const sub = [];
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === "") {
        let j = i;
        while (j < lines.length && lines[j].trim() === "") j++;
        if (j < lines.length && indentOf(lines[j]) > baseIndent) {
          for (; i < j; i++) sub.push("");
          continue;
        }
        break;
      }
      if (indentOf(l) > baseIndent) {
        sub.push(dedent(l, Math.min(offset, indentOf(l))));
        i++;
        continue;
      }
      break;
    }

    block.items.push({ text, inl: parseInline(text), blocks: sub.length ? parseLines(sub, ctx) : [] });

    let j = i;
    while (j < lines.length && lines[j].trim() === "") j++;
    const next = j < lines.length ? lines[j].match(LIST_RE) : null;
    if (!next || indentOf(next[1]) > baseIndent || /\d/.test(next[2]) !== ordered) break;
    i = j;
  }
  return [block, i];
}

function parseLines(lines, ctx) {
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (FENCE_RE.test(line)) {
      const fenceIndent = indentOf(line);
      const lang = line.trim().slice(3).trim();
      i++;
      const code = [];
      while (i < lines.length && !FENCE_RE.test(lines[i])) {
        code.push(dedent(lines[i], fenceIndent));
        i++;
      }
      i++;
      blocks.push({ type: "code", lang, content: code.join("\n") });
      continue;
    }

    const h = line.match(HEADING_RE);
    if (h) {
      const text = h[2].trim();
      const inl = parseInline(text);
      blocks.push({ type: "heading", level: h[1].length, text, inl, id: ctx.slug(inlineText(inl)) });
      i++;
      continue;
    }

    if (HR_RE.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    if (QUOTE_RE.test(line)) {
      const quote = [];
      while (i < lines.length && QUOTE_RE.test(lines[i])) {
        quote.push(lines[i].replace(/^ {0,3}>[ ]?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", blocks: parseLines(quote, ctx) });
      continue;
    }

    if (isTableStart(lines, i)) {
      const header = splitTableRow(line);
      const align = splitTableRow(lines[i + 1]).map((c) =>
        c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : null
      );
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        const cells = splitTableRow(lines[i]);
        const row = header.map((_, c) => cells[c] ?? "");
        rows.push(row.map((c) => parseInline(c)));
        i++;
      }
      blocks.push({ type: "table", header: header.map((c) => parseInline(c)), align, rows });
      continue;
    }

    if (LIST_RE.test(line)) {
      const [block, next] = parseList(lines, i, ctx);
      blocks.push(block);
      i = next;
      continue;
    }

    const para = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !isBlockStart(lines, i)) {
      para.push(lines[i].trim());
      i++;
    }
    const text = para.join(" ");
    blocks.push({ type: "p", text, inl: parseInline(text) });
  }
  return blocks;
}

export function parseBlocks(text) {
  const lines = String(text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  return parseLines(lines, { slug: makeSlugger() });
}

export function splitSections(blocks) {
  const intro = [];
  const sections = [];
  for (const b of blocks) {
    if (b.type === "heading" && b.level === 2) sections.push({ heading: b, blocks: [] });
    else if (sections.length) sections[sections.length - 1].blocks.push(b);
    else intro.push(b);
  }
  return { intro, sections };
}
