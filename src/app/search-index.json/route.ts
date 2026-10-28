import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { allModules } from "@/lib/curriculum";
import { headingId, isPlainHeading, type SearchEntry } from "@/lib/search";

// built once with the site, so the index always matches the lessons shipped
export const dynamic = "force-static";

const LESSONS = path.join(process.cwd(), "src/content/lessons");

function headings(slug: string) {
  const file = path.join(LESSONS, `${slug}.mdx`);
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .map((line) => line.match(/^#{2,3}\s+(.+?)\s*$/)?.[1])
    .filter((raw): raw is string => Boolean(raw))
    .map((raw) => ({
      text: raw.replace(/[$`*_{}]/g, ""),
      id: isPlainHeading(raw) ? headingId(raw) : null,
    }));
}

export function GET() {
  const index: SearchEntry[] = allModules().map(({ module, division, section }) => ({
    slug: module.slug,
    title: module.title,
    description: module.description,
    course: division.name,
    section: section.title,
    headings: headings(module.slug),
  }));
  return NextResponse.json(index);
}
