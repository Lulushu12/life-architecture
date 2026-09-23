import { IconButton } from "@shared/ui.jsx";
import { formatDate } from "./content.js";

export function Chips({ tags }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="chips">
      {tags.map((t) => (
        <span key={t} className="chip tagchip">
          {t}
        </span>
      ))}
    </div>
  );
}

export function StarButton({ active, onToggle }) {
  return (
    <IconButton
      className={"starbtn" + (active ? " on" : "")}
      onClick={onToggle}
      label={active ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={active}
    >
      {active ? "★" : "☆"}
    </IconButton>
  );
}

export function TopBar({ title, subtitle, onBack, right }) {
  return (
    <div className="topbar">
      {onBack && (
        <IconButton label="Back" onClick={onBack}>
          ←
        </IconButton>
      )}
      <div>
        <div className="tb-title">{title}</div>
        {subtitle && <div className="tb-sub">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function RowButton({ className = "", onClick, children, ...rest }) {
  return (
    <button type="button" className={"card rowbtn " + className} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}

export function ArticleRow({ article, onOpen, meta, star, children }) {
  const sub = meta ?? article.tags.join(" · ");
  return (
    <RowButton className="articlerow" onClick={() => onOpen(article.id)}>
      <span className="articlerow-title">
        {star && <span className="star-inline" aria-hidden="true">★ </span>}
        {article.title}
      </span>
      {sub && <span className="articlerow-tags">{sub}</span>}
      {article.updated && <span className="articlerow-updated">Updated {formatDate(article.updated)}</span>}
      {children}
    </RowButton>
  );
}
