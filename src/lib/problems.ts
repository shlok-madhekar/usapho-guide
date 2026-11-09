import problemsData from "@/content/problems.json";
import summaryData from "@/content/problem-index.json";
import { byDifficulty, type BankProblem, type ProblemSummary } from "@/lib/problem-types";

export * from "@/lib/problem-types";

/**
 * The full problem set, statements and solutions included.
 *
 * Only import this from Server Components. A client component that imports it
 * ships every problem in the JavaScript bundle; use `@/lib/problem-types` for
 * types and `PROBLEM_INDEX` for anything that only needs metadata.
 */
export const PROBLEMS: BankProblem[] = problemsData as BankProblem[];

/** Metadata for every problem: safe to use anywhere, a fraction of the size. */
export const PROBLEM_INDEX: ProblemSummary[] = summaryData as ProblemSummary[];

/** A module's problems, easiest first, so a lesson's list ramps up. */
export const problemsForModule = (slug: string) =>
  PROBLEMS.filter((p) => p.module === slug).sort(byDifficulty);

export const findProblem = (id: string) => PROBLEMS.find((p) => p.id === id);
