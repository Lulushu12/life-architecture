import { useEffect, useRef, useState } from "react";
import { useBackGuard } from "@shared/useHistoryNav.js";
import { useConfirm, useToast } from "@shared/ui.jsx";
import { copyToClipboard } from "@shared/backup.js";
import { todayKey } from "@shared/store.js";
import { CATEGORY_KEYS, categories, templateFor, fold } from "./content.js";
import { newId, setDraft } from "./storage.js";
import { Markdown } from "./markdown.jsx";
import { TopBar } from "./ui.jsx";

export const draftKey = (article) => article?.id || "new";

const FIELDS = ["title", "category", "tags", "body"];

function pick(src) {
  return {
    title: typeof src.title === "string" ? src.title : "",
    category: CATEGORY_KEYS.includes(src.category) ? src.category : CATEGORY_KEYS[0],
    tags: typeof src.tags === "string" ? src.tags : "",
    body: typeof src.body === "string" ? src.body : "",
  };
}

function baseline(article, defaultCategory) {
  const category = article?.category || defaultCategory || CATEGORY_KEYS[0];
  return {
    title: article?.title || "",
    category,
    tags: (article?.tags || []).join(", "),
    body: article ? article.body || "" : templateFor(category),
  };
}

const sameFields = (a, b) => FIELDS.every((k) => a[k] === b[k]);

function slugify(s) {
  return fold(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

function splitTags(tags) {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function Editor({ article, defaultCategory, draft, setStore, onSave, onDelete, onExit }) {
  const key = draftKey(article);
  const [base] = useState(() => baseline(article, defaultCategory));
  const [fields, setFields] = useState(() => (draft ? pick(draft) : base));
  const [preview, setPreview] = useState(false);
  const [leaving, setLeaving] = useState(null);
  const [confirm, confirmSheet] = useConfirm();
  const toast = useToast();
  const hadSentinel = useRef(false);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;
  const restored = useRef(!!draft && !sameFields(pick(draft), base));
  const toasted = useRef(false);
  const cats = categories();
  const { title, category, tags, body } = fields;

  const dirty = article
    ? !sameFields(fields, base)
    : title.trim() !== "" || tags.trim() !== "" || (body.trim() !== "" && body !== templateFor(category));

  const update = (patch) =>
    setFields((f) => {
      const next = { ...f, ...patch };
      if (!article && patch.category && patch.category !== f.category) {
        if (f.body.trim() === "" || f.body === templateFor(f.category)) next.body = templateFor(patch.category);
      }
      return next;
    });

  useEffect(() => {
    if (leaving) return;
    setStore((s) => {
      if (!dirty) return s.drafts[key] ? setDraft(s, key, null) : s;
      return setDraft(s, key, fields);
    });
  }, [fields, dirty, leaving, key, setStore]);

  useEffect(() => {
    if (!restored.current || toasted.current) return;
    toasted.current = true;
    toast("Restored your unsaved draft", {
      action: {
        label: "Discard",
        onClick: () => {
          setFields(base);
          setStore((s) => setDraft(s, key, null));
        },
      },
      duration: 6000,
    });
  }, [toast, base, key, setStore]);

  const finish = (action, payload) => {
    hadSentinel.current = window.history.state?.__backGuard != null;
    setLeaving({ action, payload });
  };

  useEffect(() => {
    if (!leaving) return undefined;
    const go = () => onExitRef.current(leaving.action, leaving.payload);
    if (!hadSentinel.current) {
      go();
      return undefined;
    }
    const onPop = () => {
      window.removeEventListener("popstate", onPop);
      go();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [leaving]);

  const askLeave = async () => {
    const ok = await confirm({
      title: "Leave the editor?",
      message: "Your unsaved changes stay as a draft on this device and come back the next time you open this editor.",
      confirmLabel: "Leave",
      cancelLabel: "Keep editing",
    });
    if (ok) finish("cancel");
  };

  useBackGuard(dirty && !leaving, askLeave);

  const onBack = () => (dirty ? askLeave() : finish("cancel"));

  const save = () => {
    const a = {
      ...(article || {}),
      id: article?.id || `local/${newId()}`,
      category,
      title: title.trim(),
      tags: splitTags(tags),
      body,
    };
    onSave(a);
    finish("saved", a);
  };

  const remove = () => {
    onDelete(article);
    finish("deleted");
  };

  const filename = `${category}/${slugify(title) || "untitled"}.md`;

  const copyMd = async () => {
    const tagList = splitTags(tags);
    const lines = ["---", `title: ${title.trim() || "Untitled"}`];
    if (tagList.length) lines.push(`tags: ${tagList.join(", ")}`);
    lines.push(`updated: ${todayKey()}`, "---", "", body.trim(), "");
    const ok = await copyToClipboard(lines.join("\n"));
    toast(ok ? `Copied. Save it as src/content/${filename}` : "Copy failed: clipboard access was blocked.", {
      duration: 6000,
    });
  };

  return (
    <div className="page">
      <TopBar
        title={article ? "Edit article" : "New article"}
        subtitle={dirty ? "Draft saved on this device" : "Stored on this device"}
        onBack={onBack}
        right={
          <button type="button" className="linkbtn" onClick={() => setPreview((p) => !p)}>
            {preview ? "Edit" : "Preview"}
          </button>
        }
      />

      {preview ? (
        <>
          <h1 className="apptitle">{title || "Untitled"}</h1>
          <div className="card articlebody">
            <Markdown text={body} />
          </div>
        </>
      ) : (
        <>
          <input
            className="input"
            aria-label="Title"
            placeholder="Title"
            value={title}
            onChange={(e) => update({ title: e.target.value })}
          />
          <div className="chips" role="group" aria-label="Category">
            {cats.map((c) => (
              <button
                type="button"
                key={c.key}
                className={"chip choice" + (category === c.key ? " sel" : "")}
                aria-pressed={category === c.key}
                onClick={() => update({ category: c.key })}
              >
                {c.label}
              </button>
            ))}
          </div>
          <input
            className="input"
            aria-label="Tags"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => update({ tags: e.target.value })}
          />
          <textarea
            className="input editorbody"
            aria-label="Markdown body"
            rows={16}
            placeholder={"Markdown body…\n\n# Heading\n**bold**, *italic*, `code`\n- lists\n| tables | work |\n[link](techniques/slug)"}
            value={body}
            onChange={(e) => update({ body: e.target.value })}
          />
        </>
      )}

      <div className="btnrow">
        {article && (
          <button type="button" className="linkbtn danger" onClick={remove}>
            Delete
          </button>
        )}
        <button type="button" className="linkbtn" disabled={!body.trim()} onClick={copyMd}>
          Copy as .md
        </button>
        <button type="button" className="bigbtn" disabled={!title.trim() || !body.trim()} onClick={save}>
          Save
        </button>
      </div>
      <p className="hint small">Suggested file: src/content/{filename}</p>
      {confirmSheet}
    </div>
  );
}
