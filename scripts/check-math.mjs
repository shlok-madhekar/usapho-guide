// Parses every formula in the lessons and the problem bank with KaTeX and
// fails if any of them would not render.
//
// The site renders with throwOnError: false, so a bad formula does not break
// the build: it shows up on the page as red source text instead (for example
// "\theta^\*" printed a red "\*" in the relativistic energy lesson). This
// check turns that into a failed pull request rather than a published page.
//
// Run with: node scripts/check-math.mjs

import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createProcessor } from "@mdx-js/mdx";
import remarkMath from "remark-math";

const require = createRequire(import.meta.url);
// Lessons go through rehype-katex, problems through the KaTeX the app
// imports directly; each is checked with the copy that renders it.
const lessonKatex = createRequire(require.resolve("rehype-katex"))("katex");
const problemKatex = require("katex");

const failures = [];
const report = (where, tex, err) =>
  failures.push(`${where}\n    ${tex.trim().slice(0, 120)}\n    ${err.message.split("\n")[0]}`);

function tryRender(katex, where, tex, displayMode) {
  try {
    katex.renderToString(tex, { throwOnError: true, displayMode });
  } catch (err) {
    report(where, tex, err);
  }
}

// lessons: parsed with the same MDX + remark-math setup as next.config.mjs,
// so only what the site treats as math is checked
const mdx = createProcessor({ remarkPlugins: [remarkMath] });
const LESSONS = "src/content/lessons/";
let lessonCount = 0;
function walk(node, file) {
  if (node.type === "math" || node.type === "inlineMath") {
    lessonCount++;
    tryRender(lessonKatex, `${LESSONS}${file}:${node.position.start.line}`, node.value, node.type === "math");
  }
  for (const child of node.children ?? []) walk(child, file);
}
for (const file of readdirSync(LESSONS).filter((f) => f.endsWith(".mdx"))) {
  walk(mdx.parse(readFileSync(LESSONS + file, "utf8")), file);
}

// problems: the same $...$ and $$...$$ split as Markish in components/Katex.tsx
const bank = JSON.parse(readFileSync("src/content/problems.json", "utf8"));
let problemCount = 0;
for (const p of bank) {
  for (const field of ["statement", "solution"]) {
    for (const paragraph of (p[field] ?? "").split(/\n{2,}/)) {
      const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
      let m;
      while ((m = re.exec(paragraph))) {
        problemCount++;
        tryRender(problemKatex, `problem ${p.id} (${field})`, m[1] ?? m[2], Boolean(m[1]));
      }
    }
  }
}

if (failures.length) {
  console.error(`${failures.length} formula(s) would render as red error text:\n`);
  for (const p of failures) console.error(`  ${p}\n`);
  process.exit(1);
}
console.log(`All ${lessonCount} lesson formulas and ${problemCount} problem formulas render.`);
