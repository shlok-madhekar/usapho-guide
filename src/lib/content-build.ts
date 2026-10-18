import "server-only";
import type { FileChange } from "@/lib/github";
import type { BankProblem } from "@/lib/problem-types";

/**
 * What scripts/merge-problems.py and scripts/merge-sims.py do, for the editor.
 *
 * The site reads generated files: /problems fetches public/problems.json,
 * counts come from problem-index.json and problem-counts.json, and each lesson
 * fetches public/sims/<id>.json. Those are built from the seed and batch
 * files, and re-running a merge script rebuilds them from those sources alone.
 * So an editor change has to land in the source file the problem or sim lives
 * in, and in every generated file, or it either never reaches readers or is
 * erased the next time a script runs.
 *
 * Output must stay byte-identical to the scripts (see scripts/canonical_json.py)
 * so that running them after merging an editor pull request changes nothing.
 */

/** The one JSON layout every content file is written in. */
export const toJson = (value: unknown) => JSON.stringify(value, null, 2) + "\n";

export interface SourceFile<T> {
  path: string;
  items: T[];
}

/**
 * Put the editor's full list back into the files it was built from. Items stay
 * in the file they came from, deleted ones are dropped, and new ones go to the
 * seed (the first source). Returns the sources with their new contents.
 */
export function applyToSources<T extends { id: string }>(
  sources: SourceFile<T>[],
  edited: T[],
  unchanged: (source: T, edited: T) => boolean = (a, b) => toJson(a) === toJson(b)
): SourceFile<T>[] {
  const byId = new Map(edited.map((item) => [item.id, item]));
  const placed = new Set<string>();
  const next = sources.map(({ path, items }) => ({
    path,
    items: items
      .filter((item) => byId.has(item.id))
      .map((item) => {
        placed.add(item.id);
        const update = byId.get(item.id)!;
        // keep the source's own text when the editor only sent it back as built
        return unchanged(item, update) ? item : update;
      }),
  }));
  next[0].items.push(...edited.filter((item) => !placed.has(item.id)));
  return next;
}

/** Changes for the source files whose contents actually differ. */
export function sourceChanges<T>(
  before: SourceFile<T>[],
  after: SourceFile<T>[]
): FileChange[] {
  return after
    .filter((file, i) => toJson(file.items) !== toJson(before[i].items))
    .map((file) => ({ path: file.path, content: toJson(file.items) }));
}

/* ------------------------------- problems ------------------------------- */

const DIFFICULTIES = new Set(["Easy", "Normal", "Hard", "Very Hard", "Insane"]);
const ORIGINS = new Set(["original", "exam", "textbook"]);
const REQUIRED = [
  "id", "name", "module", "difficulty", "tags", "starred",
  "origin", "source", "statement", "answer", "unit", "solution",
];

/** The checks merge-problems.py applies to batch problems, which it drops on failure. */
export function checkBatchProblem(p: BankProblem, slugs: Set<string>): string[] {
  const missing = REQUIRED.filter((k) => !(k in p));
  if (missing.length) return [`${p.id}: missing ${missing.join(", ")}`];
  const errors: string[] = [];
  if (!slugs.has(p.module)) errors.push(`${p.id}: unknown module '${p.module}'`);
  if (!DIFFICULTIES.has(p.difficulty))
    errors.push(`${p.id}: bad difficulty '${p.difficulty}'`);
  if (!ORIGINS.has(p.origin)) errors.push(`${p.id}: bad origin '${p.origin}'`);
  if (typeof p.answer !== "number") errors.push(`${p.id}: answer must be a number`);
  if (!String(p.statement).trim()) errors.push(`${p.id}: empty statement`);
  if (!String(p.solution).trim()) errors.push(`${p.id}: empty solution`);
  if (!Array.isArray(p.tags)) errors.push(`${p.id}: tags must be a list`);
  return errors;
}

/** merge-problems.py's normalize(), plus the url it defaults for batch problems. */
export function normalizeBatchProblem(problem: BankProblem): BankProblem {
  const p = { ...problem };
  if (!("url" in p)) p.url = "";
  let solution = p.solution.trim();
  for (const opener of ["KEY IDEA:", "Key idea:", "KEY IDEA -", "Key Idea:"]) {
    if (solution.startsWith(opener)) {
      solution = solution.slice(opener.length).trimStart();
      solution = solution.slice(0, 1).toUpperCase() + solution.slice(1);
      break;
    }
  }
  p.solution = solution;
  p.statement = p.statement.trim();
  return p;
}

/** problems.json and the three files generated from it. */
export function problemOutputs(problems: BankProblem[]): FileChange[] {
  const index = problems.map((p) => ({
    id: p.id,
    name: p.name,
    module: p.module,
    difficulty: p.difficulty,
    tags: p.tags,
    starred: p.starred,
    origin: p.origin,
    source: p.source,
    solvable: p.answer !== null && String(p.statement).trim() !== "",
  }));

  const counts: Record<string, { total: number; solvable: number }> = {};
  for (const p of index) {
    const c = (counts[p.module] ??= { total: 0, solvable: 0 });
    c.total += 1;
    if (p.solvable) c.solvable += 1;
  }
  const sortedCounts = Object.fromEntries(
    Object.keys(counts)
      .sort()
      .map((m) => [m, { solvable: counts[m].solvable, total: counts[m].total }])
  );

  return [
    { path: "src/content/problems.json", content: toJson(problems) },
    { path: "src/content/problem-index.json", content: toJson(index) },
    { path: "src/content/problem-counts.json", content: toJson(sortedCounts) },
    { path: "public/problems.json", content: JSON.stringify(problems) },
  ];
}

/* ------------------------------ simulations ----------------------------- */

export interface SimSource {
  id: string;
  title?: string;
  caption?: string;
  draw?: string;
  params?: Record<string, unknown>[];
}

const SIM_REQUIRED = ["id", "title", "caption", "draw"] as const;
const PARAM_KEYS = ["key", "label", "min", "max", "step", "value"];

/** The checks merge-sims.py applies; it refuses to write anything if one fails. */
export function checkSim(sim: SimSource): string[] {
  const errors: string[] = [];
  for (const field of SIM_REQUIRED)
    if (!sim[field]) errors.push(`${sim.id ?? "?"}: missing ${field}`);
  for (const p of sim.params ?? [])
    for (const k of PARAM_KEYS)
      if (!(k in p)) errors.push(`${sim.id}: param missing ${k}`);
  // a hard-coded colour breaks dark mode, which is easy to miss in review
  if ((sim.draw ?? "").includes("#"))
    errors.push(`${sim.id}: draw uses a literal colour, use C.*`);
  return errors;
}

/** sims.json plus the per-sim files lessons fetch, only where they changed. */
export function simOutputs(previous: SimSource[], sims: SimSource[]): FileChange[] {
  const before = new Map(previous.map((s) => [s.id, JSON.stringify(s)]));
  const changes: FileChange[] = [
    { path: "src/content/sims.json", content: toJson(sims) },
  ];
  for (const sim of sims) {
    const content = JSON.stringify(sim);
    if (before.get(sim.id) !== content)
      changes.push({ path: `public/sims/${sim.id}.json`, content });
    before.delete(sim.id);
  }
  for (const removed of Array.from(before.keys()))
    changes.push({ path: `public/sims/${removed}.json`, content: null });
  return changes;
}
