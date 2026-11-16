import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import BankProblem from "@/components/BankProblem";
import { findModule } from "@/lib/curriculum";
import { findProblem, problemsForModule } from "@/lib/problems";
import { DIFFICULTY_VAR, isSolvable } from "@/lib/problem-types";

/**
 * usapho.one/problems/<id>: one problem on its own page, so it can be linked
 * from Discord or a message ("how do you do this one?") without sending
 * someone to scroll the bank. Built the first time it is asked for.
 */
export const revalidate = false;

export function generateStaticParams() {
  return [];
}

/** How many other problems from the same lesson are listed underneath. */
const MORE = 5;

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const p = findProblem(params.id);
  if (!p) return {};
  const lesson = findModule(p.module)?.module.title;
  return {
    title: p.name,
    description: lesson
      ? `A ${p.difficulty.toLowerCase()} practice problem on ${lesson}, for F=ma and USAPhO.`
      : `A ${p.difficulty.toLowerCase()} practice problem for F=ma and USAPhO.`,
    alternates: { canonical: `/problems/${p.id}` },
    openGraph: { title: p.name },
  };
}

export default function ProblemPage({ params }: { params: { id: string } }) {
  const p = findProblem(params.id);
  if (!p) notFound();
  const found = findModule(p.module);
  const more = problemsForModule(p.module)
    .filter((q) => q.id !== p.id && isSolvable(q) === isSolvable(p))
    .slice(0, MORE);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
        {/* the card's own heading is an h3, as it is in the bank */}
        <h1 className="sr-only">{p.name}</h1>
        <p className="sans text-sm text-[var(--ink-soft)]">
          <Link prefetch={false} href="/problems" className="link">
            Problems
          </Link>
          {found && (
            <>
              {" · "}
              <Link prefetch={false} href={`/guide/${found.module.slug}`} className="link">
                {found.module.title}
              </Link>
            </>
          )}
        </p>

        <div className="mt-4 border-y border-[var(--rule)]">
          <BankProblem problem={p} />
        </div>

        {found && (
          <p className="sans mt-4 text-sm text-[var(--ink-soft)]">
            Stuck? The lesson on{" "}
            <Link prefetch={false} href={`/guide/${found.module.slug}`} className="link">
              {found.module.title}
            </Link>{" "}
            has the ideas you need.
          </p>
        )}

        {more.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-bold text-[var(--ink-strong)]">
              More from {found?.module.title ?? "this topic"}
            </h2>
            <ol className="mt-3">
              {more.map((q) => (
                <li key={q.id} className="border-b border-[var(--rule)] py-2">
                  <Link
                    prefetch={false}
                    href={`/problems/${q.id}`}
                    className="group flex flex-wrap items-baseline gap-x-3"
                  >
                    <span className="font-semibold text-[var(--ink-strong)] group-hover:text-[var(--accent)]">
                      {q.name}
                    </span>
                    <span className="label" style={{ color: DIFFICULTY_VAR[q.difficulty] }}>
                      {q.difficulty}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
    </>
  );
}
