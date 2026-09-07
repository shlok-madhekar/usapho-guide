import { NextRequest, NextResponse } from "next/server";
import { createClient, authConfigured } from "@/lib/supabase/server";
import { hasRole, type Profile, type Role } from "@/lib/roles";
import {
  FALLBACK_TOKEN,
  getUser,
  listDir,
  openPullRequest,
  readFile,
  repoConfigured,
  type FileChange,
} from "@/lib/github";
import type { Division } from "@/lib/curriculum";
import type { BankProblem } from "@/lib/problems";

export const dynamic = "force-dynamic";

const LESSONS = "src/content/lessons";
const CURRICULUM = "src/content/curriculum.json";
const PROBLEMS = "src/content/problems.json";
const SIMS = "src/content/sims.json";
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

/**
 * Writes are made with the contributor's own GitHub token, sent per request
 * and never stored. A maintainer running locally may instead configure
 * GITHUB_TOKEN as a fallback.
 */
function githubToken(req: NextRequest): string {
  if (!repoConfigured)
    throw new ApiError(503, "GITHUB_REPO is not set on this deployment.");
  const header = req.headers.get("x-github-token");
  const token = header || FALLBACK_TOKEN;
  if (!token)
    throw new ApiError(401, "Connect your GitHub account to read or propose changes.");
  return token;
}

/** Site sign-in is optional for proposing; roles still gate structural edits. */
async function currentProfile(): Promise<Profile | null> {
  if (!authConfigured) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, roles")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    email: data?.email ?? user.email ?? null,
    display_name: data?.display_name ?? null,
    roles: (data?.roles ?? []) as Role[],
  };
}

async function requireRole(...roles: Role[]) {
  const profile = await currentProfile();
  if (!hasRole(profile, ...roles))
    throw new ApiError(403, `This action needs the ${roles.join(" or ")} role.`);
}

/**
 * GET ?resource=lessons | lesson&slug=x | curriculum | problems
 */
export async function GET(req: NextRequest) {
  try {
    const token = githubToken(req);
    const resource = req.nextUrl.searchParams.get("resource");

    if (resource === "me") {
      const user = await getUser(token);
      return NextResponse.json({ login: user.login, avatar: user.avatar_url });
    }
    if (resource === "lessons") {
      const files = await listDir(token, LESSONS);
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
        content: await readFile(token, `${LESSONS}/${slug}.mdx`),
      });
    }
    if (resource === "curriculum")
      return NextResponse.json({
        curriculum: JSON.parse(await readFile(token, CURRICULUM)),
      });
    if (resource === "problems")
      return NextResponse.json({
        problems: JSON.parse(await readFile(token, PROBLEMS)),
      });
    if (resource === "sims")
      return NextResponse.json({ sims: JSON.parse(await readFile(token, SIMS)) });

    throw new ApiError(400, "Unknown resource");
  } catch (e) {
    return fail(e);
  }
}

/**
 * POST { action, ... } -> opens a pull request as the contributor.
 *
 *  saveLesson    { slug, content }   anyone with GitHub connected
 *  deleteLesson  { slug }            anyone with GitHub connected
 *  saveProblems  { problems }        anyone with GitHub connected
 *  saveSims      { sims }            anyone with GitHub connected
 *  saveCurriculum{ curriculum }      admin (changes the site's structure)
 */
export async function POST(req: NextRequest) {
  try {
    const token = githubToken(req);
    const body = await req.json();
    const { action } = body;

    let changes: FileChange[];
    let title: string;
    let summary: string;

    switch (action) {
      case "saveLesson": {
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
        summary = `Edits \`${slug}.mdx\`.`;
        break;
      }

      case "deleteLesson": {
        const { slug } = body;
        if (!SLUG_RE.test(slug ?? "")) throw new ApiError(400, "Invalid slug");
        const curriculum = JSON.parse(await readFile(token, CURRICULUM)) as Division[];
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
        const problems = body.problems as BankProblem[];
        if (!Array.isArray(problems))
          throw new ApiError(400, "problems must be an array");
        const seen = new Set<string>();
        for (const p of problems) {
          if (!p.id || !p.name)
            throw new ApiError(400, "Every problem needs an id and a name");
          if (seen.has(p.id))
            throw new ApiError(400, `Duplicate problem id: ${p.id}`);
          seen.add(p.id);
        }
        changes = [
          { path: PROBLEMS, content: JSON.stringify(problems, null, 2) + "\n" },
        ];
        title = "content: update problem bank";
        summary = `Updates the problem bank (${problems.length} problems).`;
        break;
      }

      case "saveSims": {
        const sims = body.sims as { id: string; title: string; draw: string }[];
        if (!Array.isArray(sims)) throw new ApiError(400, "sims must be an array");
        const ids = new Set<string>();
        for (const sim of sims) {
          if (!SLUG_RE.test(sim.id ?? ""))
            throw new ApiError(400, `Invalid simulation id: ${sim.id}`);
          if (ids.has(sim.id))
            throw new ApiError(400, `Duplicate simulation id: ${sim.id}`);
          ids.add(sim.id);
          if (typeof sim.draw !== "string" || sim.draw.length > 40_000)
            throw new ApiError(400, `Draw code missing or too large in ${sim.id}`);
        }
        changes = [{ path: SIMS, content: JSON.stringify(sims, null, 2) + "\n" }];
        title = "content: update simulations";
        summary = `Updates the simulation set (${sims.length} simulations).`;
        break;
      }

      case "saveCurriculum": {
        await requireRole("admin");
        const curriculum = body.curriculum as Division[];
        if (!Array.isArray(curriculum))
          throw new ApiError(400, "curriculum must be an array");
        const slugs = new Set<string>();
        for (const d of curriculum) {
          if (!d.id || !d.name)
            throw new ApiError(400, "Every course needs an id and a name");
          for (const s of d.sections)
            for (const m of s.modules) {
              if (!SLUG_RE.test(m.slug))
                throw new ApiError(400, `Invalid module slug: ${m.slug}`);
              if (slugs.has(m.slug))
                throw new ApiError(400, `Duplicate module slug: ${m.slug}`);
              slugs.add(m.slug);
            }
        }
        changes = [
          { path: CURRICULUM, content: JSON.stringify(curriculum, null, 2) + "\n" },
        ];
        title = "content: update course structure";
        summary = `Updates courses, sections and modules (${curriculum.length} courses).`;
        break;
      }

      default:
        throw new ApiError(400, "Unknown action");
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    const pr = await openPullRequest(token, changes, message || title, summary);
    return NextResponse.json({
      ok: true,
      prUrl: pr.url,
      prNumber: pr.number,
      branch: pr.branch,
      viaFork: pr.viaFork,
      message: pr.viaFork
        ? `Pull request #${pr.number} opened from your fork.`
        : `Pull request #${pr.number} opened for review.`,
    });
  } catch (e) {
    return fail(e);
  }
}
