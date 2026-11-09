import type { Difficulty } from "@/lib/curriculum";

/**
 * Types and small constants about problems, deliberately free of any import
 * of the problem data itself.
 *
 * Client components import from here. Importing `@/lib/problems` instead
 * would pull the entire problem set into the JavaScript bundle, which is
 * megabytes once every lesson is filled in.
 */

export type Origin = "original" | "exam" | "textbook";

export interface BankProblem {
  id: string;
  name: string;
  module: string;
  difficulty: Difficulty;
  tags: string[];
  starred: boolean;
  origin: Origin;
  source: string;
  url?: string;
  /** exam/textbook only: a link to the official solution, shown beside the source */
  solutionUrl?: string;
  statement: string;
  answer: number | null;
  unit: string;
  solution: string;
}

/** Metadata only: enough to list, filter and count without the problem text. */
export interface ProblemSummary {
  id: string;
  name: string;
  module: string;
  difficulty: Difficulty;
  tags: string[];
  starred: boolean;
  origin: Origin;
  source: string;
  solvable: boolean;
}

export const isSolvable = (p: { answer: number | null; statement: string }) =>
  p.answer !== null && p.statement.trim() !== "";

export const DIFFICULTY_ORDER: Difficulty[] = [
  "Easy",
  "Normal",
  "Hard",
  "Very Hard",
  "Insane",
];

/** Sort comparator, easiest first; Array.sort is stable, so ties keep their order. */
export const byDifficulty = (a: { difficulty: Difficulty }, b: { difficulty: Difficulty }) =>
  DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty);

export const DIFFICULTY_VAR: Record<Difficulty, string> = {
  Easy: "var(--diff-1)",
  Normal: "var(--diff-2)",
  Hard: "var(--diff-3)",
  "Very Hard": "var(--diff-4)",
  Insane: "var(--diff-5)",
};

/** What each level means, on one scale for originals and past exams (SETUP.md). */
export const DIFFICULTY_MEANING: Record<Difficulty, string> = {
  Easy: "One idea, a standard formula used directly. Below the F=ma exam.",
  Normal: "A few routine steps. About an early-to-middle F=ma problem.",
  Hard: "Needs a non-obvious idea or careful setup. Late F=ma, easiest USAPhO.",
  "Very Hard": "Multi-stage reasoning or real modeling. A typical USAPhO problem.",
  Insane: "The hardest USAPhO problems and IPhO.",
};

export const ORIGIN_LABEL: Record<Origin, string> = {
  original: "Written for this guide",
  exam: "Past exam",
  textbook: "Textbook",
};
