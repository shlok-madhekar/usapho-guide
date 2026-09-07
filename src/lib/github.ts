import "server-only";

/**
 * Content edits go through the GitHub API rather than the local filesystem, so
 * the editor works from the deployed site (Vercel's filesystem is read-only)
 * and every change arrives as a pull request the repo owner reviews.
 *
 * Needs GITHUB_TOKEN (fine-grained PAT: Contents read/write, Pull requests
 * read/write on this repo) and GITHUB_REPO ("owner/name").
 */

const API = "https://api.github.com";

export const REPO = process.env.GITHUB_REPO ?? "";
const TOKEN = process.env.GITHUB_TOKEN ?? "";

export const githubConfigured = Boolean(REPO && TOKEN);

async function gh<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `GitHub ${init.method ?? "GET"} ${path} failed (${res.status}): ${detail.slice(0, 300)}`
    );
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

const enc = (s: string) => Buffer.from(s, "utf8").toString("base64");
const dec = (s: string) => Buffer.from(s, "base64").toString("utf8");

export async function defaultBranch(): Promise<string> {
  const repo = await gh<{ default_branch: string }>(`/repos/${REPO}`);
  return repo.default_branch;
}

/** Read a file's contents from the default branch. */
export async function readFile(path: string): Promise<string> {
  const file = await gh<{ content: string; encoding: string }>(
    `/repos/${REPO}/contents/${encodeURIComponent(path)}`
  );
  return dec(file.content.replace(/\n/g, ""));
}

/** List files in a directory on the default branch. */
export async function listDir(path: string): Promise<string[]> {
  const items = await gh<{ name: string; type: string }[]>(
    `/repos/${REPO}/contents/${encodeURIComponent(path)}`
  );
  return items.filter((i) => i.type === "file").map((i) => i.name);
}

export interface FileChange {
  path: string;
  /** null deletes the file */
  content: string | null;
}

export interface PullRequest {
  number: number;
  url: string;
  branch: string;
}

function branchName(author: string) {
  const who = author.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase().slice(0, 20);
  const stamp = Date.now().toString(36);
  return `edit/${who}-${stamp}`;
}

/**
 * Commit a set of file changes on a new branch and open a pull request.
 * Uses the git data API so several files land in one atomic commit.
 */
export async function openPullRequest(
  changes: FileChange[],
  title: string,
  body: string,
  author: { name: string; email: string }
): Promise<PullRequest> {
  const base = await defaultBranch();
  const branch = branchName(author.name);

  const baseRef = await gh<{ object: { sha: string } }>(
    `/repos/${REPO}/git/ref/heads/${base}`
  );
  const baseSha = baseRef.object.sha;
  const baseCommit = await gh<{ tree: { sha: string } }>(
    `/repos/${REPO}/git/commits/${baseSha}`
  );

  // build a tree: blobs for writes, null sha for deletions
  const tree = await Promise.all(
    changes.map(async (c) => {
      if (c.content === null) {
        return { path: c.path, mode: "100644", type: "blob", sha: null };
      }
      const blob = await gh<{ sha: string }>(`/repos/${REPO}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: enc(c.content), encoding: "base64" }),
      });
      return { path: c.path, mode: "100644", type: "blob", sha: blob.sha };
    })
  );

  const newTree = await gh<{ sha: string }>(`/repos/${REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }),
  });

  const commit = await gh<{ sha: string }>(`/repos/${REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: `${title}\n\n${body}`,
      tree: newTree.sha,
      parents: [baseSha],
      author: { name: author.name, email: author.email },
    }),
  });

  await gh(`/repos/${REPO}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }),
  });

  const pr = await gh<{ number: number; html_url: string }>(
    `/repos/${REPO}/pulls`,
    {
      method: "POST",
      body: JSON.stringify({
        title,
        head: branch,
        base,
        body: `${body}\n\n---\nProposed by **${author.name}** (${author.email}) from the in-app editor. Merge to publish.`,
      }),
    }
  );

  return { number: pr.number, url: pr.html_url, branch };
}
