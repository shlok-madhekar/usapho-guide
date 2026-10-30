import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import { CONTRIBUTORS_REPO, FOUNDER, getContributors } from "@/lib/contributors";

export const metadata: Metadata = {
  title: "Contributors",
  alternates: { canonical: "/contributors" },
  description: "The people who write the lessons, problems and code behind the USAPhO Guide.",
};

// GitHub's list is refreshed at most once an hour
export const revalidate = 3600;

export default async function ContributorsPage() {
  const contributors = await getContributors();
  const repoUrl = `https://github.com/${CONTRIBUTORS_REPO}`;
  const total = contributors?.reduce((n, c) => n + c.commits, 0) ?? 0;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
        <h1 className="text-3xl font-bold text-[var(--ink-strong)]">
          Contributors
        </h1>

        <section className="mt-8">
          <h2 className="label border-b border-[var(--rule-strong)] pb-1.5">
            Team
          </h2>
          <a
            href={FOUNDER.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 border-b border-[var(--rule)] py-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://github.com/${FOUNDER.login}.png?s=112`}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-full border border-[var(--rule)]"
            />
            <span className="min-w-0">
              <span className="sans block text-[0.95rem] font-semibold text-[var(--ink-strong)] group-hover:text-[var(--accent)]">
                {FOUNDER.name}
              </span>
              <span className="sans block text-xs text-[var(--ink-soft)]">
                {FOUNDER.role} &middot; @{FOUNDER.login}
              </span>
            </span>
          </a>
        </section>

        <h2 className="label mt-12">Other contributors</h2>
        <p className="sans mt-2 text-sm text-[var(--ink-soft)]">
          Everyone with a merged change on{" "}
          <a href={repoUrl} className="link" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          , pulled live from the repository.
          {contributors && contributors.length > 0 && (
            <>
              {" "}
              {contributors.length}{" "}
              {contributors.length === 1 ? "person" : "people"}, {total}{" "}
              {total === 1 ? "commit" : "commits"}.
            </>
          )}
        </p>

        {contributors === null ? (
          <p className="sans mt-10 text-sm text-[var(--ink-soft)]">
            Could not reach GitHub right now. The full list is on{" "}
            <a href={`${repoUrl}/graphs/contributors`} className="link">
              the repository
            </a>
            .
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-1 border-t border-[var(--rule)] sm:grid-cols-2">
            {contributors.map((c, i) => (
              <li key={c.login} className="border-b border-[var(--rule)]">
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 py-3 pr-4"
                >
                  <span className="tabular sans w-6 shrink-0 text-xs text-[var(--ink-faint)]">
                    {i + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${c.avatar}${c.avatar.includes("?") ? "&" : "?"}s=80`}
                    alt=""
                    width={36}
                    height={36}
                    loading="lazy"
                    className="h-9 w-9 shrink-0 rounded-full border border-[var(--rule)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="sans block truncate text-sm font-medium text-[var(--ink-strong)] group-hover:text-[var(--accent)]">
                      {c.login}
                    </span>
                    <span className="tabular sans block text-xs text-[var(--ink-soft)]">
                      {c.commits} {c.commits === 1 ? "commit" : "commits"}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}

        <hr className="mt-14" />

        <section className="mt-6 text-sm text-[var(--ink-soft)]">
          <p>
            Want your name here? Write a lesson, add a problem or fix a typo from{" "}
            <Link prefetch={false} href="/edit" className="link">
              the editor
            </Link>{" "}
            or open a pull request on{" "}
            <a href={repoUrl} className="link" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            . You show up once your change is merged. Contributions are released
            under the guide&apos;s license,{" "}
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              className="link"
              target="_blank"
              rel="noopener noreferrer"
            >
              CC BY-NC-SA 4.0
            </a>
            .
          </p>
        </section>
      </main>
    </>
  );
}
