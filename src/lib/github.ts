import "server-only";

/**
 * GitHub access for the content editor.
 *
 * Every write is performed with the *contributor's own* OAuth token, obtained
 * through the device flow, so pull requests are attributed to them and the
 * server stores no credentials. Contributors without push access get a fork
 * created for them automatically, which is the ordinary open-source flow.
 *
 * GITHUB_TOKEN remains supported as an optional fallback for a maintainer
 * running the site locally.
 */

const API = "https://api.github.com";

export const REPO = process.env.GITHUB_REPO ?? "";
export const FALLBACK_TOKEN = process.env.GITHUB_TOKEN ?? "";
export const repoConfigured = Boolean(REPO);

async function gh<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
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

export interface GitHubUser {
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export const getUser = (token: string) => gh<GitHubUser>(token, "/user");

interface RepoInfo {
  default_branch: string;
  permissions?: { push?: boolean };
}

export const getRepo = (token: string, repo = REPO) =>
  gh<RepoInfo>(token, `/repos/${repo}`);

export async function readFile(token: string, path: string): Promise<string> {
  const file = await gh<{ content: string }>(
    token,
    `/repos/${REPO}/contents/${encodeURIComponent(path)}`
  );
  return dec(file.content.replace(/\n/g, ""));
}

export async function listDir(token: string, path: string): Promise<string[]> {
  const items = await gh<{ name: string; type: string }[]>(
    token,
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
  viaFork: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Make sure the contributor has a fork of the upstream repo, waiting for
 * GitHub to finish creating it. Returns "owner/name" of the fork.
 */
async function ensureFork(token: string, login: string): Promise<string> {
  const name = REPO.split("/")[1];
  const fork = `${login}/${name}`;
  try {
    await gh(token, `/repos/${fork}`);
    return fork;
  } catch {
    // not there yet, ask GitHub to create it
  }
  await gh(token, `/repos/${REPO}/forks`, { method: "POST" });
  for (let i = 0; i < 15; i++) {
    await sleep(2000);
    try {
      await gh(token, `/repos/${fork}`);
      return fork;
    } catch {
      /* still forking */
    }
  }
  throw new Error("GitHub is still creating your fork. Try saving again shortly.");
}

/** Bring a fork's default branch up to date with upstream before branching. */
async function syncFork(token: string, fork: string, base: string) {
  try {
    await gh(token, `/repos/${fork}/merge-upstream`, {
      method: "POST",
      body: JSON.stringify({ branch: base }),
    });
  } catch {
    // a brand new fork is already current; a diverged one still branches fine
  }
}

function branchName(login: string) {
  const who = login.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase().slice(0, 20);
  return `edit/${who}-${Date.now().toString(36)}`;
}

/**
 * Commit the changes and open a pull request against the upstream default
 * branch. Uses a branch on the upstream repo when the contributor has push
 * access, and a fork otherwise.
 */
export async function openPullRequest(
  token: string,
  changes: FileChange[],
  title: string,
  body: string
): Promise<PullRequest> {
  const user = await getUser(token);
  const upstream = await getRepo(token);
  const base = upstream.default_branch;
  const canPush = Boolean(upstream.permissions?.push);

  const target = canPush ? REPO : await ensureFork(token, user.login);
  if (!canPush) await syncFork(token, target, base);

  const branch = branchName(user.login);

  // branch from upstream's current tip so the diff is minimal either way
  const baseRef = await gh<{ object: { sha: string } }>(
    token,
    `/repos/${REPO}/git/ref/heads/${base}`
  );
  const baseSha = baseRef.object.sha;
  const baseCommit = await gh<{ tree: { sha: string } }>(
    token,
    `/repos/${REPO}/git/commits/${baseSha}`
  );

  const tree = await Promise.all(
    changes.map(async (c) => {
      if (c.content === null)
        return { path: c.path, mode: "100644", type: "blob", sha: null };
      const blob = await gh<{ sha: string }>(token, `/repos/${target}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: enc(c.content), encoding: "base64" }),
      });
      return { path: c.path, mode: "100644", type: "blob", sha: blob.sha };
    })
  );

  const newTree = await gh<{ sha: string }>(token, `/repos/${target}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }),
  });

  const commit = await gh<{ sha: string }>(token, `/repos/${target}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: `${title}\n\n${body}`,
      tree: newTree.sha,
      parents: [baseSha],
    }),
  });

  await gh(token, `/repos/${target}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }),
  });

  const pr = await gh<{ number: number; html_url: string }>(token, `/repos/${REPO}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title,
      // cross-repo pull requests are addressed as "owner:branch"
      head: canPush ? branch : `${user.login}:${branch}`,
      base,
      body: `${body}\n\n---\nProposed from the in-app editor by @${user.login}. Merge to publish.`,
    }),
  });

  return { number: pr.number, url: pr.html_url, branch, viaFork: !canPush };
}
