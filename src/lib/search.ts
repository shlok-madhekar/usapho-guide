/**
 * Lesson search: the index format, the heading anchors it links to, and the
 * ranking. Shared by the build-time index route, the MDX heading components
 * and the search dialog, so an anchor in the index always exists on the page.
 */

export interface SearchHeading {
  text: string;
  /** null when the heading has markup (math, code), which gets no anchor */
  id: string | null;
}

export interface SearchEntry {
  slug: string;
  title: string;
  description: string;
  course: string;
  section: string;
  headings: SearchHeading[];
}

/** "Worked example 2: inside a ball" -> "worked-example-2-inside-a-ball" */
export const headingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Headings written as plain text get an anchor; ones with markup do not. */
export const isPlainHeading = (raw: string) => !/[$`*_<>{}[\]]/.test(raw);

const words = (s: string) =>
  s.toLowerCase().replace(/['’]/g, "").split(/[^a-z0-9]+/).filter(Boolean);

/**
 * A word matches a query term it starts with ("kep" finds "kepler"), or, for
 * longer terms, one sharing all but its last two letters, so word endings do
 * not matter: "capacitor" finds "capacitance", "lenses" finds "lens".
 */
function matches(word: string, term: string) {
  if (word.startsWith(term)) return true;
  if (term.length < 5) return false;
  let n = 0;
  while (n < word.length && word[n] === term[n]) n++;
  return n >= term.length - 2;
}

/** "lenses" -> "lens", "pulleys" -> "pulley"; short words are left alone. */
const singular = (term: string) =>
  term.length > 4 && term.endsWith("es")
    ? term.slice(0, -2)
    : term.length > 3 && term.endsWith("s")
      ? term.slice(0, -1)
      : term;

/**
 * Filter test for the problem bank: every query word must start some word of
 * the text, allowing for a plural, so "gauss sphere" and "lenses" match in any
 * order. Stricter than lesson search's ending rule, which ranks its results;
 * a filter has no ranking, and "pulley" should not bring in "pulling".
 */
export function matchesQuery(text: string, query: string) {
  const have = words(text);
  return words(query).every((term) => {
    const stem = singular(term);
    return have.some((w) => w.startsWith(term) || w.startsWith(stem));
  });
}

export interface SearchResult {
  entry: SearchEntry;
  heading: SearchHeading | null;
  score: number;
}

/**
 * Every query word must match some word in the lesson. Matches in the title
 * count most, then headings, then the description, then the course and
 * section names.
 */
export function search(index: SearchEntry[], query: string, limit = 8): SearchResult[] {
  const terms = words(query);
  if (terms.length === 0) return [];
  const hits = (field: string[], term: string) => field.some((w) => matches(w, term));

  const results: SearchResult[] = [];
  for (const entry of index) {
    const title = words(entry.title);
    const description = words(entry.description);
    const place = words(`${entry.course} ${entry.section}`);
    const headings = entry.headings.map((h) => words(h.text));

    let score = 0;
    let all = true;
    for (const term of terms) {
      const weight = hits(title, term)
        ? 8
        : headings.some((h) => hits(h, term))
          ? 4
          : hits(description, term)
            ? 2
            : hits(place, term)
              ? 1
              : 0;
      if (weight === 0) {
        all = false;
        break;
      }
      score += weight;
    }
    if (!all) continue;
    if (entry.title.toLowerCase().includes(query.trim().toLowerCase())) score += 4;

    // point at a section when the title alone does not explain the match
    let heading: SearchHeading | null = null;
    if (!terms.every((t) => hits(title, t))) {
      let best = 0;
      entry.headings.forEach((h, i) => {
        const n = terms.filter((t) => hits(headings[i], t)).length;
        if (n > best) {
          best = n;
          heading = h;
        }
      });
    }
    results.push({ entry, heading, score });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
