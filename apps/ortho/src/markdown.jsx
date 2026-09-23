import { memo, useMemo, useState } from "react";
import { parseBlocks, inlineText } from "./mdparse.js";

const parseCache = new Map();

export function parseCached(text) {
  const key = text || "";
  let blocks = parseCache.get(key);
  if (!blocks) {
    blocks = parseBlocks(key);
    if (parseCache.size > 24) parseCache.delete(parseCache.keys().next().value);
    parseCache.set(key, blocks);
  }
  return blocks;
}

export function Inline({ tokens, onOpenArticle }) {
  return tokens.map((k, i) => {
    switch (k.t) {
      case "text":
        return k.v;
      case "code":
        return <code key={i}>{k.v}</code>;
      case "strong":
        return (
          <strong key={i}>
            <Inline tokens={k.c} onOpenArticle={onOpenArticle} />
          </strong>
        );
      case "em":
        return (
          <em key={i}>
            <Inline tokens={k.c} onOpenArticle={onOpenArticle} />
          </em>
        );
      case "img":
        return <img key={i} className="md-img" src={k.src} alt={k.alt} loading="lazy" />;
      case "link":
        if (k.internal && onOpenArticle) {
          return (
            <a
              key={i}
              href={`#${k.internal}`}
              className="md-internal"
              onClick={(e) => {
                e.preventDefault();
                onOpenArticle(k.internal);
              }}
            >
              <Inline tokens={k.c} onOpenArticle={onOpenArticle} />
            </a>
          );
        }
        return (
          <a key={i} href={k.href} target="_blank" rel="noreferrer">
            <Inline tokens={k.c} onOpenArticle={onOpenArticle} />
          </a>
        );
      default:
        return null;
    }
  });
}

function Table({ block, onOpenArticle }) {
  const wide = block.header.length >= 5;
  const [cards, setCards] = useState(false);
  const labels = useMemo(() => block.header.map(inlineText), [block]);

  return (
    <div className="md-tableblock">
      {wide && (
        <div className="tabletoggle">
          <button
            type="button"
            className={"chip" + (cards ? "" : " active")}
            aria-pressed={!cards}
            onClick={() => setCards(false)}
          >
            Table
          </button>
          <button
            type="button"
            className={"chip" + (cards ? " active" : "")}
            aria-pressed={cards}
            onClick={() => setCards(true)}
          >
            Cards
          </button>
        </div>
      )}
      {cards ? (
        <div className="md-cards">
          {block.rows.map((row, ri) => (
            <dl key={ri} className="md-card">
              {row.map((cell, ci) =>
                cell.length === 0 ? null : (
                  <div key={ci} className={ci === 0 ? "md-card-head" : "md-card-row"}>
                    <dt>{labels[ci]}</dt>
                    <dd>
                      <Inline tokens={cell} onOpenArticle={onOpenArticle} />
                    </dd>
                  </div>
                )
              )}
            </dl>
          ))}
        </div>
      ) : (
        <div className="tablewrap" tabIndex={0} role="region" aria-label={labels.join(", ")}>
          <table className={"md-table" + (wide ? " wide" : "")}>
            <thead>
              <tr>
                {block.header.map((c, j) => (
                  <th key={j} style={block.align[j] ? { textAlign: block.align[j] } : undefined}>
                    <Inline tokens={c} onOpenArticle={onOpenArticle} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((c, ci) => (
                    <td key={ci} style={block.align[ci] ? { textAlign: block.align[ci] } : undefined}>
                      <Inline tokens={c} onOpenArticle={onOpenArticle} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ListBlock({ block, onOpenArticle }) {
  const items = block.items.map((it, j) => (
    <li key={j}>
      <Inline tokens={it.inl} onOpenArticle={onOpenArticle} />
      {it.blocks.length > 0 && <Blocks blocks={it.blocks} onOpenArticle={onOpenArticle} />}
    </li>
  ));
  if (block.ordered) return <ol start={block.start !== 1 ? block.start : undefined}>{items}</ol>;
  return <ul>{items}</ul>;
}

function Block({ b, onOpenArticle }) {
  switch (b.type) {
    case "heading": {
      const Tag = `h${Math.min(b.level, 6)}`;
      return (
        <Tag id={b.id}>
          <Inline tokens={b.inl} onOpenArticle={onOpenArticle} />
        </Tag>
      );
    }
    case "hr":
      return <hr />;
    case "blockquote":
      return (
        <blockquote>
          <Blocks blocks={b.blocks} onOpenArticle={onOpenArticle} />
        </blockquote>
      );
    case "code":
      return (
        <pre className="md-code">
          <code>{b.content}</code>
        </pre>
      );
    case "list":
      return <ListBlock block={b} onOpenArticle={onOpenArticle} />;
    case "table":
      return <Table block={b} onOpenArticle={onOpenArticle} />;
    default:
      return (
        <p>
          <Inline tokens={b.inl} onOpenArticle={onOpenArticle} />
        </p>
      );
  }
}

export const Blocks = memo(function Blocks({ blocks, onOpenArticle }) {
  return blocks.map((b, idx) => <Block key={idx} b={b} onOpenArticle={onOpenArticle} />);
});

export function Markdown({ text, onOpenArticle }) {
  const blocks = useMemo(() => parseCached(text), [text]);
  return (
    <div className="md-content">
      <Blocks blocks={blocks} onOpenArticle={onOpenArticle} />
    </div>
  );
}
