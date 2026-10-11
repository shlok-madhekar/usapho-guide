import "server-only";

/**
 * Contributors, straight from GitHub.
 *
 * Read on the server and cached with the page (see `revalidate` on
 * /contributors), so the unauthenticated API limit is never a concern and
 * nobody's browser talks to GitHub. GITHUB_TOKEN, when set, only raises the
 * rate limit; the endpoint is public.
 */

export const CONTRIBUTORS_REPO =
  process.env.GITHUB_REPO || "shlok-madhekar/usapho-guide";

export interface Contributor {
  login: string;
  avatar: string;
  url: string;
  commits: number;
}

interface GitHubContributor {
  login?: string;
  avatar_url?: string;
  html_url?: string;
  contributions: number;
  type: string;
}

const isBot = (c: GitHubContributor) =>
  c.type === "Bot" || (c.login ?? "").endsWith("[bot]");

export async function getContributors(): Promise<Contributor[] | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const all: GitHubContributor[] = [];
  try {
    // 100 per page; a handful of pages covers any realistic team
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(
        `https://api.github.com/repos/${CONTRIBUTORS_REPO}/contributors?per_page=100&page=${page}`,
        { headers, next: { revalidate: 3600 } }
      );
      if (!res.ok) return all.length ? toContributors(all) : null;
      const batch = (await res.json()) as GitHubContributor[];
      all.push(...batch);
      if (batch.length < 100) break;
    }
  } catch {
    return all.length ? toContributors(all) : null;
  }
  return toContributors(all);
}

function toContributors(list: GitHubContributor[]): Contributor[] {
  return list
    .filter((c) => c.login && !isBot(c))
    .map((c) => ({
      login: c.login!,
      avatar: c.avatar_url ?? `https://github.com/${c.login}.png`,
      url: c.html_url ?? `https://github.com/${c.login}`,
      commits: c.contributions,
    }))
    .sort((a, b) => b.commits - a.commits);
}
