export type Difficulty = "Easy" | "Normal" | "Hard" | "Very Hard" | "Insane";
export type Frequency = 0 | 1 | 2 | 3 | 4; // rare → very frequent

export interface Problem {
  id: string;
  source: string; // e.g. "F=ma 2019/12"
  name: string;
  difficulty: Difficulty;
  tags?: string[];
  starred?: boolean;
}

export interface Module {
  slug: string;
  title: string;
  description: string;
  frequency: Frequency;
  minutes: number; // est. reading time
  prereqs?: string[]; // slugs
  problems: Problem[];
  hasContent?: boolean; // full authored content exists
}

export interface Section {
  id: string;
  title: string;
  modules: Module[];
}

export interface Division {
  id: string;
  label: string;
  name: string;
  tagline: string;
  accent: string; // css color
  sections: Section[];
}

import curriculumData from "@/content/curriculum.json";

// Content lives in src/content/curriculum.json so it can be edited in-app
// (see /edit) or via a plain git push. This module adds types and helpers.
export const DIVISIONS: Division[] = curriculumData as Division[];

export function allModules(): { module: Module; division: Division; section: Section }[] {
  return DIVISIONS.flatMap((d) =>
    d.sections.flatMap((s) => s.modules.map((m) => ({ module: m, division: d, section: s })))
  );
}

export function findModule(slug: string) {
  return allModules().find((x) => x.module.slug === slug);
}

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Easy: "var(--diff-easy)",
  Normal: "var(--diff-normal)",
  Hard: "var(--diff-hard)",
  "Very Hard": "var(--diff-vhard)",
  Insane: "var(--diff-insane)",
};
