import { NextRequest, NextResponse } from "next/server";
import { ApiError, authorFor, requireRole } from "@/lib/api-auth";
import {
  CURRICULUM_FILE,
  commitPaths,
  readCurriculum,
  writeCurriculum,
} from "@/lib/content-store";
import type { Division, Module, Problem } from "@/lib/curriculum";

export const dynamic = "force-dynamic";

function fail(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  const message = e instanceof Error ? e.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}

function findModule(curriculum: Division[], slug: string): Module | undefined {
  for (const d of curriculum)
    for (const s of d.sections)
      for (const m of s.modules) if (m.slug === slug) return m;
  return undefined;
}

export async function GET() {
  try {
    await requireRole("problem_writer", "course_writer");
    return NextResponse.json({ curriculum: await readCurriculum() });
  } catch (e) {
    return fail(e);
  }
}

/**
 * PATCH /api/content/curriculum
 *   { slug, problems }  -> replace one module's problem set  (problem_writer)
 *   { slug, meta }      -> update a module's metadata        (course_writer)
 *   { curriculum }      -> replace the whole structure       (admin)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.curriculum) {
      const profile = await requireRole("admin");
      await writeCurriculum(body.curriculum);
      const result = await commitPaths(
        [CURRICULUM_FILE],
        body.message?.trim() || "content: update curriculum structure",
        authorFor(profile)
      );
      return NextResponse.json({ ok: true, ...result });
    }

    const { slug, problems, meta } = body;
    if (typeof slug !== "string") throw new ApiError(400, "slug is required");

    const isProblemEdit = Array.isArray(problems);
    const profile = await requireRole(
      isProblemEdit ? "problem_writer" : "course_writer"
    );

    const curriculum = (await readCurriculum()) as Division[];
    const mod = findModule(curriculum, slug);
    if (!mod) throw new ApiError(404, `No module named ${slug}`);

    if (isProblemEdit) {
      const seen = new Set<string>();
      for (const p of problems as Problem[]) {
        if (!p.id || !p.name) throw new ApiError(400, "Each problem needs an id and a name");
        if (seen.has(p.id)) throw new ApiError(400, `Duplicate problem id: ${p.id}`);
        seen.add(p.id);
      }
      mod.problems = problems as Problem[];
    }
    if (meta && typeof meta === "object") {
      Object.assign(mod, meta as Partial<Module>);
    }

    await writeCurriculum(curriculum);
    const result = await commitPaths(
      [CURRICULUM_FILE],
      body.message?.trim() ||
        `content: update ${isProblemEdit ? "problems" : "metadata"} for ${slug}`,
      authorFor(profile)
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return fail(e);
  }
}
