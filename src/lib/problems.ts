import problemsData from "@/content/problems.json";
import type { Difficulty } from "@/lib/curriculum";

/**
 * Where a problem came from. This drives attribution and whether we can show
 * the statement: official exam text stays on AAPT's site, so those entries are
 * references with a citation and a link. Everything written for this guide is
 * solvable inline.
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

export const PROBLEMS: BankProblem[] = problemsData as BankProblem[];

export const isSolvable = (p: BankProblem) =>
  p.answer !== null && p.statement.trim() !== "";

export const problemsForModule = (slug: string) =>
  PROBLEMS.filter((p) => p.module === slug);

export const findProblem = (id: string) => PROBLEMS.find((p) => p.id === id);

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

export function allTags(): string[] {
  return Array.from(new Set(PROBLEMS.flatMap((p) => p.tags))).sort();
}
