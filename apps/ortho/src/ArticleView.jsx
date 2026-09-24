import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "@shared/ui.jsx";
import { useBackGuard } from "@shared/useHistoryNav.js";
import { getArticle, formatDate, peekBody, loadBody } from "./content.js";
import { Blocks, parseCached } from "./markdown.jsx";
import { splitSections, inlineText } from "./mdparse.js";
import { setReadingPos, setFontSize, FONT_SIZES } from "./storage.js";
import { TopBar, StarButton, Chips, ArticleRow } from "./ui.jsx";

const LONG_CHARS = 5000;
const HEADER_OFFSET = 60;
const FONT_LABELS = { S: "Small", M: "Medium", L: "Large" };

const Section = memo(function Section({ index, section, open, collapsible, onToggle, onOpenArticle }) {
  const h = section.heading;
  const text = inlineText(h.inl);
  if (!collapsible) {
    return (
      <>
        <h2 id={h.id}>{text}</h2>
        <Blocks blocks={section.blocks} onOpenArticle={onOpenArticle} />
      </>
    );
  }
  return (
    <section className={"md-section" + (open ? " open" : "")}>
      <h2 id={h.id} className="sec-head">
        <button
          type="button"
          className="sec-toggle"
          aria-expanded={open}
          aria-controls={`${h.id}--body`}
          onClick={() => onToggle(index)}
        >
          <span className="sec-title">{text}</span>
          <span className="sec-chev" aria-hidden="true">
            ›
          </span>
        </button>
      </h2>
      <div id={`${h.id}--body`} hidden={!open}>
        {open && <Blocks blocks={section.blocks} onOpenArticle={onOpenArticle} />}
      </div>
    </section>
  );
});

function CompactHeader({ title, bodyRef, onBack, onToc }) {
  const [state, setState] = useState({ show: false, section: "", progress: 0 });

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 1;
      let section = "";
      const heads = bodyRef.current ? bodyRef.current.querySelectorAll("h2[id]") : [];
      for (const h of heads) {
        if (h.getBoundingClientRect().top <= HEADER_OFFSET + 4) section = h.textContent.replace(/›$/, "").trim();
        else break;
      }
      const show = y > 140;
      setState((s) =>
        s.show === show && s.section === section && Math.abs(s.progress - progress) < 0.002
          ? s
          : { show, section, progress }
      );
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    measure();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [bodyRef]);

  return (
    <div className={"compactbar" + (state.show ? " show" : "")} aria-hidden={!state.show}>
      <div className="compactbar-inner">
        <IconButton label="Back" onClick={onBack} tabIndex={state.show ? 0 : -1}>
          ←
        </IconButton>
        <div className="compactbar-text">
          <div className="compactbar-section">{state.section || title}</div>
          {state.section && <div className="compactbar-title">{title}</div>}
        </div>
        <IconButton label="Contents and text size" onClick={onToc} tabIndex={state.show ? 0 : -1}>
          ☰
        </IconButton>
      </div>
      <div className="progress" role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.progress * 100)}>
        <div className="progress-fill" style={{ transform: `scaleX(${state.progress})` }} />
      </div>
    </div>
  );
}

function TocSheet({ open, entries, fontSize, onFontSize, onPick, onClose }) {
  const sheetRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    sheetRef.current?.querySelector("button")?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previous && previous.isConnected && typeof previous.focus === "function") previous.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div
      className="sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={sheetRef} className="sheet tocsheet" role="dialog" aria-modal="true" aria-labelledby="toc-title">
        <div className="tocsheet-head">
          <h3 id="toc-title">Contents</h3>
          <IconButton label="Close" onClick={onClose}>
            ✕
          </IconButton>
        </div>
        <div className="setrow">
          <span className="setlabel">Text size</span>
          <div className="segmented" role="group" aria-label="Text size">
            {FONT_SIZES.map((f) => (
              <button
                type="button"
                key={f}
                className={"chip" + (fontSize === f ? " sel" : "")}
                aria-pressed={fontSize === f}
                aria-label={FONT_LABELS[f]}
                onClick={() => onFontSize(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {entries.length > 0 ? (
          <nav className="toclist" aria-label="Table of contents">
            {entries.map((e) => (
              <button
                type="button"
                key={e.id}
                className={"tocitem lvl" + e.level}
                onClick={() => onPick(e)}
              >
                {e.text}
              </button>
            ))}
          </nav>
        ) : (
          <p className="hint small">This article has no sections.</p>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function ArticleView({ articleId, store, setStore, onToggleFavorite, onView, onOpenArticle, onEdit, onBack }) {
  const local = store.localArticles;
  const article = getArticle(articleId, local);
  const bodyRef = useRef(null);
  const yRef = useRef(0);
  const [saved] = useState(() => store.readingPos[articleId] || null);
  const [loaded, setLoaded] = useState(() => peekBody(article));
  const [failed, setFailed] = useState(false);
  const body = article ? (article.local ? article.body : loaded) : null;
  const ready = body !== null;

  useEffect(() => {
    if (!article || article.local || loaded !== null || failed) return undefined;
    let alive = true;
    loadBody(article).then(
      (b) => alive && setLoaded(b),
      () => alive && setFailed(true)
    );
    return () => {
      alive = false;
    };
  }, [article, loaded, failed]);

  const blocks = useMemo(() => (ready ? parseCached(body) : []), [ready, body]);
  const { intro, sections } = useMemo(() => splitSections(blocks), [blocks]);
  const long = ready && body.length > LONG_CHARS && sections.length >= 2;

  const [open, setOpen] = useState(() => {
    if (Array.isArray(saved?.open)) return new Set(saved.open);
    return new Set([0]);
  });
  const openRef = useRef(open);
  openRef.current = open;
  const [tocOpen, setTocOpen] = useState(false);
  const [jump, setJump] = useState(null);

  const toc = useMemo(() => {
    const out = [];
    for (const b of intro) if (b.type === "heading") out.push({ id: b.id, text: inlineText(b.inl), level: b.level, section: -1 });
    sections.forEach((s, i) => {
      out.push({ id: s.heading.id, text: inlineText(s.heading.inl), level: 2, section: i });
      for (const b of s.blocks) {
        if (b.type === "heading" && b.level === 3) out.push({ id: b.id, text: inlineText(b.inl), level: 3, section: i });
      }
    });
    return out;
  }, [intro, sections]);

  const referencedBy = useMemo(
    () =>
      (article?.referencedBy || [])
        .map((id) => getArticle(id, local))
        .filter(Boolean)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [article, local]
  );

  const shownId = article?.id;
  useEffect(() => {
    if (shownId) onView(shownId);
  }, [shownId, onView]);

  useLayoutEffect(() => {
    const y = ready ? saved?.y || 0 : 0;
    if (ready) yRef.current = y;
    window.scrollTo(0, y);
  }, [saved, ready]);

  useEffect(() => {
    if (!ready) return undefined;
    const onScroll = () => {
      yRef.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ready]);

  const exists = !!article && ready;
  useEffect(() => {
    if (!exists) return undefined;
    const save = () =>
      setStore((s) =>
        setReadingPos(s, articleId, { y: Math.round(yRef.current), ...(long ? { open: [...openRef.current] } : {}) })
      );
    const onVis = () => {
      if (document.visibilityState === "hidden") save();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      save();
    };
  }, [articleId, long, setStore, exists]);

  useEffect(() => {
    if (!jump) return undefined;
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(jump);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET);
      setJump(null);
    });
    return () => cancelAnimationFrame(raf);
  }, [jump]);

  useBackGuard(tocOpen, () => setTocOpen(false));

  const onToggle = useCallback((i) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  const allOpen = open.size >= sections.length;
  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(sections.map((_, i) => i)));

  const pick = (entry) => {
    setTocOpen(false);
    if (long && entry.section >= 0 && !open.has(entry.section)) {
      setOpen((prev) => new Set(prev).add(entry.section));
    }
    setJump(entry.id);
  };

  if (!article) {
    return (
      <div className="page">
        <TopBar title="Not found" onBack={onBack} />
        <p className="hint">This article no longer exists.</p>
      </div>
    );
  }

  const isFav = store.favorites.includes(article.id);
  const fontSize = store.settings.fontSize;
  const subtitle = article.categoryLabel + (article.updated ? ` · Updated ${formatDate(article.updated)}` : "");

  return (
    <div className="page">
      {long && <CompactHeader title={article.title} bodyRef={bodyRef} onBack={onBack} onToc={() => setTocOpen(true)} />}
      <TopBar
        title={article.title}
        subtitle={subtitle}
        onBack={onBack}
        right={
          <>
            {article.local && (
              <button type="button" className="linkbtn" onClick={onEdit}>
                Edit
              </button>
            )}
            <IconButton label="Contents and text size" onClick={() => setTocOpen(true)}>
              ☰
            </IconButton>
            <StarButton active={isFav} onToggle={() => onToggleFavorite(article.id)} />
          </>
        }
      />
      <Chips tags={article.tags} />
      {long && (
        <div className="readbar">
          <span className="hint small">
            {sections.length} sections
          </span>
          <button type="button" className="linkbtn" onClick={toggleAll} aria-pressed={allOpen}>
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>
      )}
      {!ready && (
        <div className={`card articlebody fs-${fontSize}`}>
          {failed ? (
            <>
              <p className="warn">Could not load this article. Check your connection and try again.</p>
              <button type="button" className="linkbtn" onClick={() => setFailed(false)}>
                Retry
              </button>
            </>
          ) : (
            <p className="hint" aria-live="polite">
              Loading…
            </p>
          )}
        </div>
      )}
      {ready && (
        <div ref={bodyRef} className={`card articlebody fs-${fontSize}`} lang={article.lang || undefined}>
          <div className="md-content">
            <Blocks blocks={intro} onOpenArticle={onOpenArticle} />
            {sections.map((s, i) => (
              <Section
                key={s.heading.id}
                index={i}
                section={s}
                open={!long || open.has(i)}
                collapsible={long}
                onToggle={onToggle}
                onOpenArticle={onOpenArticle}
              />
            ))}
          </div>
        </div>
      )}

      {referencedBy.length > 0 && (
        <>
          <h2>Referenced by</h2>
          {referencedBy.map((a) => (
            <ArticleRow key={a.id} article={a} onOpen={onOpenArticle} meta={a.categoryLabel} />
          ))}
        </>
      )}

      <TocSheet
        open={tocOpen}
        entries={toc}
        fontSize={fontSize}
        onFontSize={(f) => setStore((s) => setFontSize(s, f))}
        onPick={pick}
        onClose={() => setTocOpen(false)}
      />
    </div>
  );
}
