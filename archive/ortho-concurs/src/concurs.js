// Exam-prep ("Concurs") content and scheduling.
//
// Content: every src/content/concurs/<id>.md is one tematica topic written
// against a fixed template (see the tematica in tematica.js). The body is
// split on its three H2 headings into: recap (read), script (present out
// loud, graded per ### section) and questions (### Î1. / **R:** pairs).
//
// Scheduling: every gradable item (a script section or a question) carries
// an SM-2 style state in the store under concurs.items[key]. Grades are
// 0 again, 1 hard, 2 good, 3 easy. Intervals are capped at 7 days because
// the exams are weeks away, not months.

import { TOPICS, getTopic } from "./tematica.js";

const rawModules = import.meta.glob("./content/concurs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function parseFrontMatter(raw) {
  const meta = {};
  let body = raw.replace(/^﻿/, "");
  if (body.startsWith("---")) {
    const end = body.indexOf("\n---", 3);
    if (end !== -1) {
      const block = body.slice(3, end).trim();
      body = body.slice(end + 4).replace(/^\r?\n/, "");
      for (const line of block.split("\n")) {
        const i = line.indexOf(":");
        if (i === -1) continue;
        meta[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
      }
    }
  }
  return { meta, body };
}

const H2_RECAP = /^##\s+Recapitulare\s*$/m;
const H2_SCRIPT = /^##\s+Script (de prezentare|operator)[^\n]*$/m;
const H2_QUESTIONS = /^##\s+Întrebările comisiei\s*$/m;

// Slices the body into the three named sections, tolerant of order and of a
// missing section (returns "" for it).
function splitSections(body) {
  const marks = [
    { key: "recap", re: H2_RECAP },
    { key: "script", re: H2_SCRIPT },
    { key: "questions", re: H2_QUESTIONS },
  ]
    .map((m) => {
      const match = body.match(m.re);
      return match ? { key: m.key, start: match.index, headEnd: match.index + match[0].length } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);
  const out = { recap: "", script: "", questions: "" };
  marks.forEach((m, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].start : body.length;
    out[m.key] = body.slice(m.headEnd, end).trim();
  });
  return out;
}

// "### 1. Anamneză (2 min)" -> { title: "Anamneză", seconds: 120 }
function parseSectionHeading(text) {
  let title = text.trim();
  let seconds = 0;
  const t = title.match(/\((\d+(?:[.,]\d+)?)\s*(min|s|sec)\)\s*$/i);
  if (t) {
    const n = parseFloat(t[1].replace(",", "."));
    seconds = Math.round(/^min/i.test(t[2]) ? n * 60 : n);
    title = title.slice(0, t.index).trim();
  }
  const num = title.match(/^(\d+)\.\s*(.*)$/);
  return { title: num ? num[2] : title, number: num ? parseInt(num[1], 10) : null, seconds };
}

// Splits the script on ### headings. Numbered headings become timed steps;
// the trailing "Fraze-cheie" / "Ce trebuie neapărat să știi" blocks are
// kept as extras shown after the drill.
function parseScript(md) {
  const steps = [];
  const extras = [];
  const parts = md.split(/^###\s+/m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    const heading = nl === -1 ? part : part.slice(0, nl);
    const content = nl === -1 ? "" : part.slice(nl + 1).trim();
    const h = parseSectionHeading(heading);
    if (h.number !== null) steps.push({ ...h, content });
    else extras.push({ title: h.title, content });
  }
  return { steps, extras, intro: parts[0].trim() };
}

// "### Î3. question\n**R:** answer..." pairs.
function parseQuestions(md) {
  const out = [];
  const parts = md.split(/^###\s+/m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim();
    const rest = nl === -1 ? "" : part.slice(nl + 1).trim();
    const q = heading.replace(/^Î\s*\d+\.\s*/i, "").trim();
    const a = rest.replace(/^\*\*R:?\*\*:?\s*/i, "").trim();
    if (q) out.push({ q, a });
  }
  return out;
}

function buildTopics() {
  const byId = {};
  for (const [path, raw] of Object.entries(rawModules)) {
    const m = path.match(/^\.\/content\/concurs\/([^/]+)\.md$/);
    if (!m || m[1].startsWith("_")) continue;
    const id = m[1];
    const { meta, body } = parseFrontMatter(raw);
    const sections = splitSections(body);
    byId[id] = {
      id,
      title: meta.title || id,
      tags: (meta.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      related: (meta.related || "").split(",").map((t) => t.trim()).filter(Boolean),
      region: meta.region || "",
      specialty: meta.specialty || "",
      recap: sections.recap,
      script: parseScript(sections.script),
      questions: parseQuestions(sections.questions),
    };
  }
  return byId;
}

export const CONTENT = buildTopics();

// Every tematica topic, with its content attached when the file exists.
export function topicList(probeKey) {
  return TOPICS.filter((t) => !probeKey || t.probe === probeKey).map((t) => ({
    ...t,
    content: CONTENT[t.id] || null,
  }));
}

export function topicWithContent(id) {
  const t = getTopic(id);
  return t ? { ...t, content: CONTENT[id] || null } : null;
}

// ---- scheduling ----

export const GRADES = [
  { value: 0, label: "Din nou", hint: "nu am știut" },
  { value: 1, label: "Greu", hint: "cu lacune" },
  { value: 2, label: "Bine", hint: "corect" },
  { value: 3, label: "Ușor", hint: "fluent" },
];

const DAY = 86400000;
const MAX_INTERVAL_DAYS = 7;

export function itemKey(topicId, kind, index) {
  return `${topicId}#${kind}${index}`;
}

export function getItemState(store, key) {
  return (store.concurs && store.concurs.items && store.concurs.items[key]) || null;
}

export function isDue(state, now = Date.now()) {
  return Boolean(state && state.due <= now);
}

// SM-2 style update. Returns the new state for the item.
export function gradeItem(prev, grade, now = Date.now()) {
  const s = prev || { reps: 0, ease: 2.5, interval: 0, lapses: 0, due: now, seen: 0, last: null };
  let { reps, ease, interval, lapses } = s;
  let due;
  if (grade === 0) {
    reps = 0;
    interval = 0;
    lapses += 1;
    ease = Math.max(1.3, ease - 0.2);
    due = now + 10 * 60000;
  } else {
    if (grade === 1) {
      interval = Math.max(1, interval * 1.2);
      ease = Math.max(1.3, ease - 0.15);
    } else if (grade === 2) {
      interval = reps === 0 ? 1 : reps === 1 ? 3 : interval * ease;
    } else {
      interval = reps === 0 ? 3 : interval * ease * 1.3;
      ease = ease + 0.15;
    }
    interval = Math.min(MAX_INTERVAL_DAYS, interval);
    reps += 1;
    due = now + interval * DAY;
  }
  return { reps, ease, interval, lapses, due, seen: s.seen + 1, last: grade, at: now };
}

export function updateItem(store, key, grade, now = Date.now()) {
  const concurs = store.concurs || { items: {}, sessions: [] };
  const items = { ...concurs.items, [key]: gradeItem(concurs.items[key], grade, now) };
  return { ...store, concurs: { ...concurs, items } };
}

export function recordSession(store, session) {
  const concurs = store.concurs || { items: {}, sessions: [] };
  const sessions = [...concurs.sessions, session].slice(-500);
  return { ...store, concurs: { ...concurs, sessions } };
}

// Summary for a topic: counts of seen / due items and the last presentation.
export function topicProgress(store, topic, now = Date.now()) {
  const c = topic.content;
  const items = (store.concurs && store.concurs.items) || {};
  const sessions = (store.concurs && store.concurs.sessions) || [];
  const q = c ? c.questions.length : 0;
  const s = c ? c.script.steps.length : 0;
  let qSeen = 0;
  let qDue = 0;
  let sSeen = 0;
  let sDue = 0;
  let weak = 0;
  for (let i = 0; i < q; i++) {
    const st = items[itemKey(topic.id, "q", i)];
    if (st) {
      qSeen++;
      if (st.due <= now) qDue++;
      if (st.last !== null && st.last <= 1) weak++;
    }
  }
  for (let i = 0; i < s; i++) {
    const st = items[itemKey(topic.id, "s", i)];
    if (st) {
      sSeen++;
      if (st.due <= now) sDue++;
      if (st.last !== null && st.last <= 1) weak++;
    }
  }
  const presentations = sessions.filter((x) => x.topicId === topic.id && x.mode === "present");
  const last = presentations[presentations.length - 1] || null;
  return { q, qSeen, qDue, s, sSeen, sDue, weak, presentations: presentations.length, last };
}

// Builds a drill queue of questions across the given topics: due first
// (oldest due first), then never-seen, then the rest by soonest due.
export function questionQueue(store, topics, now = Date.now(), limit = Infinity) {
  const items = (store.concurs && store.concurs.items) || {};
  const due = [];
  const fresh = [];
  const rest = [];
  for (const t of topics) {
    if (!t.content) continue;
    t.content.questions.forEach((qa, i) => {
      const key = itemKey(t.id, "q", i);
      const st = items[key];
      const entry = { key, topicId: t.id, topicTitle: t.title, index: i, ...qa, state: st || null };
      if (!st) fresh.push(entry);
      else if (st.due <= now) due.push(entry);
      else rest.push(entry);
    });
  }
  due.sort((a, b) => a.state.due - b.state.due);
  rest.sort((a, b) => a.state.due - b.state.due);
  return [...due, ...fresh, ...rest].slice(0, limit);
}

export function daysUntil(dateStr, now = Date.now()) {
  const d = new Date(dateStr + "T09:00:00");
  return Math.ceil((d.getTime() - now) / DAY);
}

export function formatSeconds(sec) {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
