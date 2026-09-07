import type { ComponentType } from "react";

/**
 * Lesson registry, built automatically from every .mdx file in this folder.
 * The key is the filename without extension and must match a module slug in
 * src/content/curriculum.json.
 *
 * Adding a lesson = drop in `<slug>.mdx` (via /edit or a git push).
 * No imports to maintain here.
 */
const files = require.context("./", false, /\.mdx$/);

export const LESSONS: Record<string, ComponentType> = Object.fromEntries(
  files
    .keys()
    .map((key) => [
      key.replace(/^\.\//, "").replace(/\.mdx$/, ""),
      files(key).default as ComponentType,
    ])
);

export function hasLesson(slug: string): boolean {
  return slug in LESSONS;
}
