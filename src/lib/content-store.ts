import "server-only";

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export const REPO_ROOT = process.cwd();
export const LESSONS_DIR = path.join(REPO_ROOT, "src/content/lessons");
export const CURRICULUM_FILE = path.join(REPO_ROOT, "src/content/curriculum.json");

/** Editing is only possible where the checkout lives (local dev / a VM), not on Vercel. */
export const editingEnabled = process.env.CONTENT_EDITING === "on";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,60}$/;

export function assertSlug(slug: string) {
  if (!SLUG_RE.test(slug)) {
    throw new Error(
      "Invalid slug: use lowercase letters, numbers and hyphens only."
    );
  }
}

export function lessonPath(slug: string) {
  assertSlug(slug);
  const p = path.join(LESSONS_DIR, `${slug}.mdx`);
  // defense in depth: the resolved path must stay inside the lessons dir
  if (!p.startsWith(LESSONS_DIR + path.sep)) throw new Error("Invalid path");
  return p;
}

export async function listLessons(): Promise<string[]> {
  const entries = await fs.readdir(LESSONS_DIR);
  return entries
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""))
    .sort();
}

export async function readLesson(slug: string): Promise<string> {
  return fs.readFile(lessonPath(slug), "utf8");
}

export async function writeLesson(slug: string, content: string) {
  await fs.writeFile(lessonPath(slug), content.endsWith("\n") ? content : content + "\n");
}

export async function deleteLesson(slug: string) {
  await fs.rm(lessonPath(slug));
}

export async function readCurriculum() {
  return JSON.parse(await fs.readFile(CURRICULUM_FILE, "utf8"));
}

export async function writeCurriculum(data: unknown) {
  await fs.writeFile(CURRICULUM_FILE, JSON.stringify(data, null, 2) + "\n");
}

async function git(args: string[]) {
  return run("git", args, { cwd: REPO_ROOT, timeout: 60_000 });
}

export interface CommitResult {
  committed: boolean;
  pushed: boolean;
  commit?: string;
  message: string;
}

/**
 * Stage the given paths, commit them with authorship attributed to the editor,
 * and push when a remote is configured. A failed push is reported, not thrown:
 * the edit is already safely committed locally.
 */
export async function commitPaths(
  paths: string[],
  message: string,
  author: { name: string; email: string }
): Promise<CommitResult> {
  await git(["add", "--", ...paths]);

  const { stdout: staged } = await git(["diff", "--cached", "--name-only"]);
  if (!staged.trim()) {
    return { committed: false, pushed: false, message: "No changes to commit" };
  }

  await git([
    "-c",
    `user.name=${author.name}`,
    "-c",
    `user.email=${author.email}`,
    "commit",
    "-m",
    message,
  ]);
  const { stdout: sha } = await git(["rev-parse", "--short", "HEAD"]);
  const commit = sha.trim();

  const { stdout: remotes } = await git(["remote"]);
  if (!remotes.trim()) {
    return {
      committed: true,
      pushed: false,
      commit,
      message: `Committed ${commit} (no git remote configured, nothing to push)`,
    };
  }

  try {
    const { stdout: branch } = await git(["rev-parse", "--abbrev-ref", "HEAD"]);
    await git(["push", "origin", `HEAD:${branch.trim()}`]);
    return { committed: true, pushed: true, commit, message: `Committed and pushed ${commit}` };
  } catch (e) {
    const detail = e instanceof Error ? e.message.split("\n")[0] : String(e);
    return {
      committed: true,
      pushed: false,
      commit,
      message: `Committed ${commit} locally, but push failed: ${detail}`,
    };
  }
}
