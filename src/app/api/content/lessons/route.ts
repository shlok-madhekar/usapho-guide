import { NextRequest, NextResponse } from "next/server";
import { ApiError, authorFor, requireRole } from "@/lib/api-auth";
import {
  commitPaths,
  deleteLesson,
  lessonPath,
  listLessons,
  readCurriculum,
  readLesson,
  writeCurriculum,
  writeLesson,
  assertSlug,
  CURRICULUM_FILE,
} from "@/lib/content-store";
import type { Division } from "@/lib/curriculum";

export const dynamic = "force-dynamic";

function fail(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  const message = e instanceof Error ? e.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}

/** GET /api/content/lessons?slug=x  -> one lesson's MDX, or the slug list. */
export async function GET(req: NextRequest) {
  try {
    await requireRole("course_writer");
    const slug = req.nextUrl.searchParams.get("slug");
    if (!slug) return NextResponse.json({ slugs: await listLessons() });
    return NextResponse.json({ slug, content: await readLesson(slug) });
  } catch (e) {
    return fail(e);
  }
}

/** POST /api/content/lessons  { slug, content } -> write + commit (+ push). */
export async function POST(req: NextRequest) {
  try {
    const profile = await requireRole("course_writer");
    const { slug, content, message } = await req.json();
    if (typeof slug !== "string" || typeof content !== "string") {
      throw new ApiError(400, "slug and content are required");
    }
    assertSlug(slug);
    if (content.length > 200_000) throw new ApiError(400, "Lesson is too large");

    const existed = (await listLessons()).includes(slug);
    await writeLesson(slug, content);

    const result = await commitPaths(
      [lessonPath(slug)],
      message?.trim() ||
        `${existed ? "content" : "feat"}: ${existed ? "update" : "add"} lesson ${slug}`,
      authorFor(profile)
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return fail(e);
  }
}

/**
 * DELETE /api/content/lessons?slug=x
 * Removes the MDX file and clears hasContent on the matching module.
 */
export async function DELETE(req: NextRequest) {
  try {
    const profile = await requireRole("course_writer");
    const slug = req.nextUrl.searchParams.get("slug");
    if (!slug) throw new ApiError(400, "slug is required");
    assertSlug(slug);
    if (!(await listLessons()).includes(slug)) {
      throw new ApiError(404, `No lesson named ${slug}`);
    }

    const file = lessonPath(slug);
    await deleteLesson(slug);

    const curriculum = (await readCurriculum()) as Division[];
    for (const d of curriculum)
      for (const s of d.sections)
        for (const m of s.modules) if (m.slug === slug) m.hasContent = false;
    await writeCurriculum(curriculum);

    const result = await commitPaths(
      [file, CURRICULUM_FILE],
      `content: remove lesson ${slug}`,
      authorFor(profile)
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return fail(e);
  }
}
