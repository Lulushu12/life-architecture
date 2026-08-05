import { useState } from "react";
import { CATEGORY_KEYS, categories } from "./content.js";
import { newId } from "./storage.js";
import { Markdown } from "./markdown.jsx";
import { TopBar } from "./ui.jsx";

// In-app article editor for on-device articles. Bundled (repo) articles are
// read-only here — they're edited as Markdown files in the repository.
export default function Editor({ article, defaultCategory, onSave, onDelete, onCancel }) {
  const [title, setTitle] = useState(article?.title || "");
  const [category, setCategory] = useState(article?.category || defaultCategory || CATEGORY_KEYS[0]);
  const [tags, setTags] = useState((article?.tags || []).join(", "));
  const [body, setBody] = useState(article?.body || "");
  const [preview, setPreview] = useState(false);
  const cats = categories([]);

  const save = () =>
    onSave({
      id: article?.id || `local/${newId()}`,
      category,
      title: title.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      body,
    });

  return (
    <div className="page">
      <TopBar
        title={article ? "Edit article" : "New article"}
        subtitle="Stored on this device"
        onBack={onCancel}
        right={
          <button className="linkbtn" onClick={() => setPreview((p) => !p)}>
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
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="chips">
            {cats.map((c) => (
              <button
                key={c.key}
                className={"chip choice" + (category === c.key ? " sel" : "")}
                onClick={() => setCategory(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <input
            className="input"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <textarea
            className="input editorbody"
            rows={16}
            placeholder={"Markdown body…\n\n# Heading\n**bold**, *italic*, `code`\n- lists\n| tables | work |"}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </>
      )}

      <div className="btnrow">
        {article && onDelete && (
          <button
            className="linkbtn danger"
            onClick={() => {
              if (confirm("Delete this article?")) onDelete(article.id);
            }}
          >
            Delete
          </button>
        )}
        <button className="bigbtn" disabled={!title.trim() || !body.trim()} onClick={save}>
          Save
        </button>
      </div>
    </div>
  );
}
