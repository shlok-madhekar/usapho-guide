import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import BankProblem from "@/components/BankProblem";
import { FreqMeter, StatusPicker } from "@/components/ModuleBits";
import ModuleSidebar from "@/components/ModuleSidebar";
import ExportPdfButton from "@/components/ExportPdfButton";
import { Markish } from "@/components/Katex";
import { allModules, findModule } from "@/lib/curriculum";
import { LESSONS } from "@/content/lessons";
import { problemsForModule, isSolvable } from "@/lib/problems";

// Every module is built ahead of time, so an unknown slug can answer 404 at
// once instead of starting a server render that only ends in notFound().
export const dynamicParams = false;

export function generateStaticParams() {
  return allModules().map(({ module }) => ({ slug: module.slug }));
}

// every tab used to read "USAPhO Guide", and so did every search result
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const found = findModule(params.slug);
  if (!found) return {};
  const { module: mod } = found;
  return {
    title: mod.title,
    description: mod.description,
    alternates: { canonical: `/guide/${mod.slug}` },
    openGraph: { title: mod.title, description: mod.description },
  };
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
      <div className="mx-auto flex max-w-[calc(var(--measure)_+_22rem)] gap-12 px-6">
        <ModuleSidebar activeSlug={mod.slug} divisionId={division.id} />

        <main className="lesson-print min-w-0 max-w-[var(--measure)] flex-1 pb-24 pt-10">
          <p className="print-masthead">
            <span>USAPhO Guide</span>
            <span>usapho.one/guide/{mod.slug} · CC BY-NC-SA 4.0</span>
          </p>
          <p className="label">
            <Link href="/guide" className="hover:text-[var(--ink)]">
              {division.name}
            </Link>
            <span className="mx-2">/</span>
            {section.title}
          </p>

          <div className="mt-3 flex items-start justify-between gap-6">
            <h1 className="text-[clamp(1.7rem,1.15rem+1.7vw,2.5rem)] font-bold leading-[1.15] text-[var(--ink-strong)]">
              {mod.title}
            </h1>
            <div className="no-print pt-2">
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
            <span className="ml-auto">
              <ExportPdfButton title={mod.title} />
            </span>
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
              <h2 className="text-xl font-bold text-[var(--ink-strong)]">
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
              <h2 className="text-xl font-bold text-[var(--ink-strong)]">Also worth doing</h2>
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

          {solvable.length > 0 && (
            <section className="print-only print-solutions">
              <h2 className="text-xl font-semibold text-[var(--ink-strong)]">
                Solutions
              </h2>
              {solvable.map((p, i) => (
                <div key={p.id} className="print-solution">
                  <p className="sans text-sm">
                    <span className="font-semibold text-[var(--ink-strong)]">
                      {i + 1}. {p.name}
                    </span>
                    <span className="text-[var(--ink-soft)]">
                      {"  "}Answer: {formatAnswer(p.answer)}
                      {p.unit && p.unit !== "dimensionless" ? ` ${p.unit}` : ""}
                    </span>
                  </p>
                  <div className="prose mt-1 max-w-none text-[0.95rem]">
                    <Markish text={p.solution} />
                  </div>
                </div>
              ))}
            </section>
          )}

          <nav className="no-print mt-16 flex justify-between gap-6 border-t border-[var(--rule)] pt-5 text-sm">
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

/** Plain numbers stay as written; very large or small ones get an exponent. */
function formatAnswer(n: number | null) {
  if (n === null) return "";
  const a = Math.abs(n);
  if (a !== 0 && (a >= 1e6 || a < 1e-3)) {
    const [m, e] = n.toExponential(3).split("e");
    return `${Number(m)} × 10^${Number(e)}`;
  }
  return String(Number(n.toPrecision(6)));
}
