import counts from "@/content/problem-counts.json";

/**
 * How many problems each lesson has, and how many are solvable in place.
 * A few kilobytes, so client components can show counts without importing
 * the problems themselves.
 */
export interface LessonCount {
  total: number;
  solvable: number;
}

export const PROBLEM_COUNTS = counts as Record<string, LessonCount>;

export const countFor = (slug: string): LessonCount =>
  PROBLEM_COUNTS[slug] ?? { total: 0, solvable: 0 };

export const TOTAL_PROBLEMS = Object.values(PROBLEM_COUNTS).reduce(
  (n, c) => n + c.total,
  0
);

export const TOTAL_SOLVABLE = Object.values(PROBLEM_COUNTS).reduce(
  (n, c) => n + c.solvable,
  0
);
