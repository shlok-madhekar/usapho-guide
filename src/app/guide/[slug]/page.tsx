import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import BankProblem from "@/components/BankProblem";
import { FreqMeter, StatusPicker } from "@/components/ModuleBits";
import ModuleSidebar from "@/components/ModuleSidebar";
import { allModules, findModule } from "@/lib/curriculum";
import { LESSONS } from "@/content/lessons";
import { problemsForModule, isSolvable } from "@/lib/problems";

export function generateStaticParams() {
  return allModules().map(({ module }) => ({ slug: module.slug }));
}

export default function ModulePage({ params }: { params: { slug: string } }) {
  const found = findModule(params.slug);
  if (!found) notFound();
  const { module: mod, division, section } = found;

  const flat = allModules().filter((x) => x.division.id === division.id);
  const idx = flat.findIndex((x) => x.module.slug === mod.slug);
  const prev = flat[idx - 1]?.module;
  const next = flat[idx + 1]?.module;
  const Lesson = LESSONS[mod.slug];

  const problems = problemsForModule(mod.slug);
  const solvable = problems.filter(isSolvable);
  const references = problems.filter((p) => !isSolvable(p));

  return (
    <>
      <Nav />
      <div className="mx-auto flex max-w-6xl gap-12 px-6">
        <ModuleSidebar activeSlug={mod.slug} divisionId={division.id} />

        <main className="min-w-0 flex-1 pb-24 pt-10">
          <p className="label">
            <Link href="/guide" className="hover:text-[var(--ink)]">
              {division.name}
            </Link>
            <span className="mx-2">/</span>
            {section.title}
          </p>

          <div className="mt-3 flex items-start justify-between gap-6">
            <h1 className="max-w-[30rem] text-[2.1rem] font-semibold leading-[1.15] tracking-tight text-[var(--ink-strong)]">
              {mod.title}
            </h1>
            <div className="pt-2">
              <StatusPicker slug={mod.slug} />
            </div>
          </div>

          <p className="prose mt-3 text-[var(--ink-soft)]">{mod.description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-[var(--rule)] py-2.5">
            <FreqMeter f={mod.frequency} />
            <span className="label">{mod.minutes} min read</span>
            <span className="label">{problems.length} problems</span>
            {mod.prereqs?.length ? (
              <span className="label">
                after{" "}
                {mod.prereqs.map((p) => (
                  <Link key={p} href={`/guide/${p}`} className="link normal-case">
                    {allModules().find((x) => x.module.slug === p)?.module.title ?? p}
                  </Link>
                ))}
              </span>
            ) : null}
          </div>

          <article className="prose mt-8">
            {Lesson ? (
              <Lesson />
            ) : (
              <p className="text-[var(--ink-soft)]">
                This module has no written notes yet. The problems below are
                still worth working through.
              </p>
            )}
          </article>

          {solvable.length > 0 && (
            <section className="mt-14">
              <h2 className="text-xl font-semibold text-[var(--ink-strong)]">
                Problems
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                Work these on paper, then check your answer here.
              </p>
              <div className="mt-4 border-t border-[var(--rule-strong)]">
                {solvable.map((p, i) => (
                  <BankProblem key={p.id} problem={p} index={i + 1} />
                ))}
              </div>
            </section>
          )}

          {references.length > 0 && (
            <section className="mt-12">
              <h2 className="label">Also worth doing</h2>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                Problems from past exams and textbooks, cited rather than
                reproduced.
              </p>
              <div className="mt-3 border-t border-[var(--rule-strong)]">
                {references.map((p) => (
                  <BankProblem key={p.id} problem={p} />
                ))}
              </div>
            </section>
          )}

          <nav className="mt-16 flex justify-between gap-6 border-t border-[var(--rule)] pt-5 text-sm">
            {prev ? (
              <Link href={`/guide/${prev.slug}`} className="group">
                <span className="label block">Previous</span>
                <span className="text-[var(--ink)] group-hover:text-[var(--accent)]">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/guide/${next.slug}`} className="group text-right">
                <span className="label block">Next</span>
                <span className="text-[var(--ink)] group-hover:text-[var(--accent)]">
                  {next.title}
                </span>
              </Link>
            )}
          </nav>
        </main>
      </div>
    </>
  );
}
