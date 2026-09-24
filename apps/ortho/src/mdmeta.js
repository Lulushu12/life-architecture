export const CATEGORY_LABELS = {
  classifications: "Classifications",
  techniques: "Techniques",
  checklists: "Checklists",
  notes: "Notes",
  diagnoses: "Diagnoses",
};

export const TRAILER_RE = /\*Full context: "([^"]+)" in the Diagnoses section\.\*/;

export function parseFrontMatter(raw) {
  const meta = { title: "", tags: [], region: "", specialty: "", updated: "", lang: "" };
  let body = raw;
  const trimmed = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  body = trimmed;
  if (trimmed.startsWith("---")) {
    const end = trimmed.indexOf("\n---", 3);
    if (end !== -1) {
      const block = trimmed.slice(3, end).trim();
      body = trimmed.slice(end + 4).replace(/^\n/, "");
      for (const line of block.split("\n")) {
        const i = line.indexOf(":");
        if (i === -1) continue;
        const key = line.slice(0, i).trim().toLowerCase();
        const value = line.slice(i + 1).trim();
        if (key === "tags")
          meta.tags = value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        else if (key in meta) meta[key] = value;
      }
    }
  }
  return { meta, body };
}

export function titleCase(slug) {
  return slug
    .replace(/^_/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function fold(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function plainText(body) {
  return body
    .normalize("NFC")
    .replace(/!\[([^\]]*)\]\((?:[^()\s]|\([^()\s]*\))+\)/g, "$1")
    .replace(/\[([^\]]+)\]\((?:[^()\s]|\([^()\s]*\))+\)/g, "$1")
    .replace(/```/g, " ")
    .replace(/[#>*`|_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripTemplateIntro(body) {
  const idx = body.search(/^#{1,6}\s/m);
  return (idx > 0 ? body.slice(idx) : body).trim() + "\n";
}

export function linkTrailer(body, fullContext) {
  return body.replace(TRAILER_RE, (_, title) => `*Full context: [${title}](${fullContext}) in the Diagnoses section.*`);
}
