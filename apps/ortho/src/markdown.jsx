// Minimal hand-written markdown renderer. No external dependency.
// Renders into React elements (never dangerouslySetInnerHTML), so HTML in
// the source is inert — React text nodes escape it automatically.
//
// Supported: # / ## / ### headings, **bold**, *italic*, `code`, fenced code
// blocks, unordered/ordered lists, pipe tables, blockquotes, horizontal
// rules, links, plain paragraphs.

const INLINE_RE = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/g;

function parseInline(text, keyPrefix = "i") {
  const nodes = [];
  let last = 0;
  let m;
  let key = 0;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const k = `${keyPrefix}-${key++}`;
    if (m[1] !== undefined) {
      nodes.push(<code key={k}>{m[1]}</code>);
    } else if (m[2] !== undefined) {
      nodes.push(<strong key={k}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      nodes.push(<em key={k}>{m[3]}</em>);
    } else if (m[4] !== undefined) {
      nodes.push(
        <a key={k} href={m[5]} target="_blank" rel="noreferrer">
          {m[4]}
        </a>
      );
    }
    last = INLINE_RE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(line);
}

function splitTableRow(line) {
  let l = line.trim();
  if (l.startsWith("|")) l = l.slice(1);
  if (l.endsWith("|")) l = l.slice(0, -1);
  return l.split("|").map((c) => c.trim());
}

function parseBlocks(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // fenced code block
    if (line.trimStart().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      i++;
      const code = [];
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // consume closing fence
      blocks.push({ type: "code", lang, content: code.join("\n") });
      continue;
    }

    // heading
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      blocks.push({ type: "heading", level: h[1].length, text: h[2].trim() });
      i++;
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // blockquote
    if (line.startsWith(">")) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", text: quote.join(" ") });
      continue;
    }

    // table: header row followed by a separator row
    if (line.trim().startsWith("|") && lines[i + 1] && isTableSeparator(lines[i + 1])) {
      const header = splitTableRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    // unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // ordered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // paragraph: consecutive non-blank lines
    const para = [];
    while (i < lines.length && lines[i].trim() !== "") {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", text: para.join(" ") });
  }
  return blocks;
}

export function Markdown({ text }) {
  const blocks = parseBlocks(text || "");
  return (
    <div className="md-content">
      {blocks.map((b, idx) => {
        const key = `b${idx}`;
        switch (b.type) {
          case "heading": {
            const Tag = `h${b.level}`;
            return <Tag key={key}>{parseInline(b.text, key)}</Tag>;
          }
          case "hr":
            return <hr key={key} />;
          case "blockquote":
            return <blockquote key={key}>{parseInline(b.text, key)}</blockquote>;
          case "code":
            return (
              <pre key={key} className="md-code">
                <code>{b.content}</code>
              </pre>
            );
          case "ul":
            return (
              <ul key={key}>
                {b.items.map((it, j) => (
                  <li key={j}>{parseInline(it, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key}>
                {b.items.map((it, j) => (
                  <li key={j}>{parseInline(it, `${key}-${j}`)}</li>
                ))}
              </ol>
            );
          case "table":
            return (
              <div key={key} className="tablewrap">
                <table className="md-table">
                  <thead>
                    <tr>
                      {b.header.map((c, j) => (
                        <th key={j}>{parseInline(c, `${key}-h${j}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((c, ci) => (
                          <td key={ci}>{parseInline(c, `${key}-${ri}-${ci}`)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "p":
          default:
            return <p key={key}>{parseInline(b.text, key)}</p>;
        }
      })}
    </div>
  );
}
