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

export const DIFFICULTY_VAR: Record<Difficulty, string> = {
  Easy: "var(--diff-1)",
  Normal: "var(--diff-2)",
  Hard: "var(--diff-3)",
  "Very Hard": "var(--diff-4)",
  Insane: "var(--diff-5)",
};

export const ORIGIN_LABEL: Record<Origin, string> = {
  original: "Written for this guide",
  exam: "Past exam",
  textbook: "Textbook",
};
