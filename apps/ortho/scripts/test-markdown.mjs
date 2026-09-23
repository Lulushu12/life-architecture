import assert from "node:assert/strict";
import { parseBlocks, parseInline, inlineText } from "../src/mdparse.js";

let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}\n     ${e.message.split("\n").join("\n     ")}`);
  }
}

test("bold line followed by a list without a blank line", () => {
  const blocks = parseBlocks("**Indications**\n- first item\n- second item\n\nAfter.");
  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].type, "p");
  assert.equal(blocks[0].text, "**Indications**");
  assert.equal(blocks[0].inl[0].t, "strong");
  assert.equal(blocks[1].type, "list");
  assert.equal(blocks[1].ordered, false);
  assert.deepEqual(blocks[1].items.map((it) => it.text), ["first item", "second item"]);
  assert.equal(blocks[2].text, "After.");
});

test("paragraph stops at heading, table, quote and fence", () => {
  const blocks = parseBlocks("Text\n## Head\nMore\n| a | b |\n|---|---|\n| 1 | 2 |\nLine\n> quoted\nLine\n```\ncode\n```");
  assert.deepEqual(
    blocks.map((b) => b.type),
    ["p", "heading", "p", "table", "p", "blockquote", "p", "code"]
  );
});

test("ordered list interrupted by nested bullets keeps numbering", () => {
  const md = [
    "1. First",
    "2. Second:",
    "   - **Option A**: detail",
    "   - *Option B*: detail",
    "3. Third",
    "",
    "4. Fourth after a blank line",
  ].join("\n");
  const blocks = parseBlocks(md);
  assert.equal(blocks.length, 1);
  const list = blocks[0];
  assert.equal(list.ordered, true);
  assert.equal(list.start, 1);
  assert.equal(list.items.length, 4);
  const nested = list.items[1].blocks[0];
  assert.equal(nested.type, "list");
  assert.equal(nested.ordered, false);
  assert.equal(nested.items.length, 2);
  assert.equal(inlineText(nested.items[0].inl), "Option A: detail");
  assert.equal(list.items[2].text, "Third");
});

test("ordered list resuming after an unindented block emits start", () => {
  const blocks = parseBlocks("1. One\n2. Two\n- aside\n3. Three\n4. Four");
  assert.deepEqual(
    blocks.map((b) => [b.type, b.ordered, b.start]),
    [
      ["list", true, 1],
      ["list", false, 1],
      ["list", true, 3],
    ]
  );
  assert.equal(blocks[2].items.length, 2);
});

test("table with header, alignment and ragged rows", () => {
  const md = "| Grade | Description | Treatment |\n|:---|:---:|---:|\n| I | Nondisplaced | Cast |\n| II | Displaced \\| angulated |\n";
  const [t] = parseBlocks(md);
  assert.equal(t.type, "table");
  assert.deepEqual(t.header.map(inlineText), ["Grade", "Description", "Treatment"]);
  assert.deepEqual(t.align, [null, "center", "right"]);
  assert.equal(t.rows.length, 2);
  assert.deepEqual(t.rows[1].map(inlineText), ["II", "Displaced | angulated", ""]);
});

test("internal link and external link", () => {
  const toks = parseInline("See [Weber](classifications/weber-ankle) or [PubMed](https://pubmed.ncbi.nlm.nih.gov/1/).");
  const links = toks.filter((t) => t.t === "link");
  assert.equal(links.length, 2);
  assert.equal(links[0].internal, "classifications/weber-ankle");
  assert.equal(inlineText(links[0].c), "Weber");
  assert.equal(links[1].internal, null);
});

test("link nested in emphasis and href with parentheses", () => {
  const toks = parseInline('*Full context: [Hip OA](diagnoses/hip-oa) in the Diagnoses section.*');
  assert.equal(toks.length, 1);
  assert.equal(toks[0].t, "em");
  assert.equal(toks[0].c[1].internal, "diagnoses/hip-oa");
  const p = parseInline("[x](https://a.org/S0883-5403(24)00001-2)");
  assert.equal(p[0].href, "https://a.org/S0883-5403(24)00001-2");
});

test("image", () => {
  const toks = parseInline("![Lateral view](img/lat.png)");
  assert.deepEqual(toks, [{ t: "img", alt: "Lateral view", src: "img/lat.png" }]);
});

test("heading ids are unique slugs without diacritics", () => {
  const blocks = parseBlocks("## Tratament ortopedic\n## Tratament ortopedic\n### Clasificare Tönnis");
  assert.deepEqual(blocks.map((b) => b.id), ["tratament-ortopedic", "tratament-ortopedic-2", "clasificare-tonnis"]);
});

if (failed) {
  console.log(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nall markdown tests passed");
