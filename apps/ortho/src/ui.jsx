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
    <button
      className={"iconbtn starbtn" + (active ? " on" : "")}
      onClick={onToggle}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={active}
    >
      {active ? "★" : "☆"}
    </button>
  );
}

export function TopBar({ title, subtitle, onBack, right }) {
  return (
    <div className="topbar">
      <button className="iconbtn" onClick={onBack} aria-label="Back">
        ←
      </button>
      <div>
        <div className="tb-title">{title}</div>
        {subtitle && <div className="tb-sub">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function ArticleRow({ article, onOpen }) {
  return (
    <div className="card articlerow" onClick={() => onOpen(article.id)}>
      <div className="articlerow-title">{article.title}</div>
      {article.tags.length > 0 && (
        <div className="articlerow-tags">{article.tags.join(" · ")}</div>
      )}
    </div>
  );
}
