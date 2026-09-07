import { NextRequest, NextResponse } from "next/server";
import { createClient, authConfigured } from "@/lib/supabase/server";
import { hasRole, type Profile, type Role } from "@/lib/roles";
import {
  githubConfigured,
  listDir,
  openPullRequest,
  readFile,
  type FileChange,
} from "@/lib/github";
import type { Division } from "@/lib/curriculum";
import type { BankProblem } from "@/lib/problems";

export const dynamic = "force-dynamic";

const LESSONS = "src/content/lessons";
const CURRICULUM = "src/content/curriculum.json";
const PROBLEMS = "src/content/problems.json";
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,60}$/;

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function fail(e: unknown) {
  if (e instanceof ApiError)
    return NextResponse.json({ error: e.message }, { status: e.status });
  const message = e instanceof Error ? e.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}

async function requireRole(...roles: Role[]): Promise<Profile> {
  if (!authConfigured) throw new ApiError(503, "Supabase is not configured.");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new ApiError(401, "Sign in to edit content.");

  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, roles")
    .eq("id", user.id)
    .maybeSingle();

  const profile: Profile = {
    id: user.id,
    email: data?.email ?? user.email ?? null,
    display_name: data?.display_name ?? null,
    roles: (data?.roles ?? []) as Role[],
  };
  if (!hasRole(profile, ...roles))
    throw new ApiError(403, `This action needs: ${roles.join(" or ")}.`);
  return profile;
}

function requireGithub() {
  if (!githubConfigured)
    throw new ApiError(
      503,
      "GitHub is not configured on the server. Set GITHUB_REPO and GITHUB_TOKEN so edits can open pull requests."
    );
}

const authorOf = (p: Profile) => ({
  name: p.display_name || p.email?.split("@")[0] || "usapho-editor",
  email: p.email || "editor@usapho.guide",
});

/**
 * GET ?resource=lessons                 -> lesson slugs
 * GET ?resource=lesson&slug=x           -> one lesson's MDX
 * GET ?resource=curriculum | problems   -> the JSON content files
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole("course_writer", "problem_writer");
    requireGithub();
    const resource = req.nextUrl.searchParams.get("resource");

    if (resource === "lessons") {
      const files = await listDir(LESSONS);
      return NextResponse.json({
        slugs: files
          .filter((f) => f.endsWith(".mdx"))
          .map((f) => f.replace(/\.mdx$/, ""))
          .sort(),
      });
    }
    if (resource === "lesson") {
      const slug = req.nextUrl.searchParams.get("slug") ?? "";
      if (!SLUG_RE.test(slug)) throw new ApiError(400, "Invalid slug");
      return NextResponse.json({
        slug,
        content: await readFile(`${LESSONS}/${slug}.mdx`),
      });
    }
    if (resource === "curriculum")
      return NextResponse.json({ curriculum: JSON.parse(await readFile(CURRICULUM)) });
    if (resource === "problems")
      return NextResponse.json({ problems: JSON.parse(await readFile(PROBLEMS)) });

    throw new ApiError(400, "Unknown resource");
  } catch (e) {
    return fail(e);
  }
}

/**
 * POST { action, ... } -> opens a pull request with the change.
 *
 *  saveLesson    { slug, content }            course_writer
 *  deleteLesson  { slug }                     course_writer
 *  saveProblems  { problems }                 problem_writer
 *  saveCurriculum{ curriculum }               admin
 */
export async function POST(req: NextRequest) {
  try {
    requireGithub();
    const body = await req.json();
    const { action } = body;

    let profile: Profile;
    let changes: FileChange[];
    let title: string;
    let summary: string;

    switch (action) {
      case "saveLesson": {
        profile = await requireRole("course_writer");
        const { slug, content } = body;
        if (!SLUG_RE.test(slug ?? "")) throw new ApiError(400, "Invalid slug");
        if (typeof content !== "string" || content.length > 200_000)
          throw new ApiError(400, "Lesson content missing or too large");
        changes = [
          {
            path: `${LESSONS}/${slug}.mdx`,
            content: content.endsWith("\n") ? content : content + "\n",
          },
        ];
        title = `content: update lesson ${slug}`;
        summary = `Edits the lesson \`${slug}.mdx\`.`;
        break;
      }

      case "deleteLesson": {
        profile = await requireRole("course_writer");
        const { slug } = body;
        if (!SLUG_RE.test(slug ?? "")) throw new ApiError(400, "Invalid slug");
        const curriculum = JSON.parse(await readFile(CURRICULUM)) as Division[];
        for (const d of curriculum)
          for (const s of d.sections)
            for (const m of s.modules) if (m.slug === slug) m.hasContent = false;
        changes = [
          { path: `${LESSONS}/${slug}.mdx`, content: null },
          { path: CURRICULUM, content: JSON.stringify(curriculum, null, 2) + "\n" },
        ];
        title = `content: remove lesson ${slug}`;
        summary = `Deletes \`${slug}.mdx\` and clears its \`hasContent\` flag.`;
        break;
      }

      case "saveProblems": {
        profile = await requireRole("problem_writer");
        const problems = body.problems as BankProblem[];
        if (!Array.isArray(problems)) throw new ApiError(400, "problems must be an array");
        const seen = new Set<string>();
        for (const p of problems) {
          if (!p.id || !p.name) throw new ApiError(400, "Every problem needs an id and a name");
          if (seen.has(p.id)) throw new ApiError(400, `Duplicate problem id: ${p.id}`);
          seen.add(p.id);
        }
        changes = [{ path: PROBLEMS, content: JSON.stringify(problems, null, 2) + "\n" }];
        title = "content: update problem bank";
        summary = `Updates the problem bank (${problems.length} problems).`;
        break;
      }

      case "saveCurriculum": {
        profile = await requireRole("admin");
        const curriculum = body.curriculum as Division[];
        if (!Array.isArray(curriculum)) throw new ApiError(400, "curriculum must be an array");
        const slugs = new Set<string>();
        for (const d of curriculum) {
          if (!d.id || !d.name) throw new ApiError(400, "Every course needs an id and a name");
          for (const s of d.sections)
            for (const m of s.modules) {
              if (!SLUG_RE.test(m.slug)) throw new ApiError(400, `Invalid module slug: ${m.slug}`);
              if (slugs.has(m.slug)) throw new ApiError(400, `Duplicate module slug: ${m.slug}`);
              slugs.add(m.slug);
            }
        }
        changes = [{ path: CURRICULUM, content: JSON.stringify(curriculum, null, 2) + "\n" }];
        title = "content: update course structure";
        summary = `Updates courses, sections and modules (${curriculum.length} courses).`;
        break;
      }

      default:
        throw new ApiError(400, "Unknown action");
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    const pr = await openPullRequest(
      changes,
      message || title,
      summary,
      authorOf(profile)
    );
    return NextResponse.json({
      ok: true,
      prUrl: pr.url,
      prNumber: pr.number,
      branch: pr.branch,
      message: `Pull request #${pr.number} opened for review.`,
    });
  } catch (e) {
    return fail(e);
  }
}
