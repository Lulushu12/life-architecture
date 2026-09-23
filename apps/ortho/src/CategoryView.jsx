import { useMemo } from "react";
import { articlesInCategory, categories } from "./content.js";
import { TopBar, ArticleRow } from "./ui.jsx";

const REGION_ORDER = [
  "Shoulder & Elbow",
  "Hand & Wrist",
  "Spine",
  "Pelvis & Hip",
  "Knee & Leg",
  "Foot & Ankle",
  "Multi-region",
];
const SPECIALTY_ORDER = [
  "Trauma",
  "Arthroplasty",
  "Sports",
  "Spine",
  "Hand & Wrist",
  "Foot & Ankle",
  "Pediatrics",
  "Oncology & Metabolic",
  "Principles & Procedures",
];

function orderedValues(articles, field, order) {
  const counts = new Map();
  for (const a of articles) {
    const v = (a[field] || "").trim();
    if (v) counts.set(v, (counts.get(v) || 0) + 1);
  }
  const known = order.filter((v) => counts.has(v));
  const extra = [...counts.keys()].filter((v) => !order.includes(v)).sort();
  return [...known, ...extra].map((v) => ({ value: v, count: counts.get(v) }));
}

function ChipRow({ label, values, active, onPick }) {
  if (values.length < 2) return null;
  return (
    <div className="filterrow" role="group" aria-label={label}>
      <span className="filterrow-label">{label}</span>
      <div className="filterrow-chips">
        <button
          type="button"
          className={"chip" + (active === "" ? " active" : "")}
          aria-pressed={active === ""}
          onClick={() => onPick("")}
        >
          All
        </button>
        {values.map(({ value, count }) => (
          <button
            type="button"
            key={value}
            className={"chip" + (active === value ? " active" : "")}
            aria-pressed={active === value}
            onClick={() => onPick(active === value ? "" : value)}
          >
            {value} <span className="chip-count">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CategoryView({ categoryKey, local, region, specialty, onFilter, onOpenArticle, onNew, onBack }) {
  const meta = categories(local).find((c) => c.key === categoryKey);
  const articles = articlesInCategory(categoryKey, local);

  const regions = useMemo(() => orderedValues(articles, "region", REGION_ORDER), [articles]);
  const specialties = useMemo(() => orderedValues(articles, "specialty", SPECIALTY_ORDER), [articles]);

  const filtered = useMemo(
    () => articles.filter((a) => (!region || a.region === region) && (!specialty || a.specialty === specialty)),
    [articles, region, specialty]
  );

  return (
    <div className="page">
      <TopBar
        title={meta ? meta.label : categoryKey}
        subtitle={`${filtered.length}${filtered.length !== articles.length ? ` of ${articles.length}` : ""} article${articles.length === 1 ? "" : "s"}`}
        onBack={onBack}
        right={
          <button type="button" className="linkbtn" onClick={onNew}>
            + New
          </button>
        }
      />
      <ChipRow label="Location" values={regions} active={region} onPick={(v) => onFilter({ region: v })} />
      <ChipRow label="Pathology" values={specialties} active={specialty} onPick={(v) => onFilter({ specialty: v })} />
      {articles.length === 0 && <p className="hint">No articles in this category yet.</p>}
      {articles.length > 0 && filtered.length === 0 && <p className="hint">No articles match the selected filters.</p>}
      {filtered.map((a) => (
        <ArticleRow key={a.id} article={a} onOpen={onOpenArticle} />
      ))}
    </div>
  );
}
