import { NextResponse } from "next/server";
import { PROBLEM_INDEX } from "@/lib/problems";
import type { ProblemSearchEntry } from "@/lib/search";

// built once with the site, like the lesson index beside it
export const dynamic = "force-static";

/** Names, lessons and tags of every problem, for the header search. */
export function GET() {
  const index: ProblemSearchEntry[] = PROBLEM_INDEX.map((p) => ({
    id: p.id,
    name: p.name,
    module: p.module,
    difficulty: p.difficulty,
    tags: p.tags,
  }));
  return NextResponse.json(index);
}
