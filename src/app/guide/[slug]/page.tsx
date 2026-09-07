import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import ProblemTable from "@/components/ProblemTable";
import { FreqMeter, StatusPicker } from "@/components/ModuleBits";
import { allModules, findModule } from "@/lib/curriculum";
import { LESSONS } from "@/content/lessons";
import ModuleSidebar from "@/components/ModuleSidebar";

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

  return (
    <>
      <Nav />
      <div className="mx-auto flex max-w-7xl gap-10 px-6">
        <ModuleSidebar activeSlug={mod.slug} divisionId={division.id} />

        <main className="min-w-0 flex-1 pb-28 pt-12">
          {/* breadcrumb */}
          <p className="text-xs text-[var(--ink-faint)]">
            <Link href="/guide" className="hover:text-[var(--brass)]">
              {division.name}
            </Link>
            <span className="mx-2">/</span>
            {section.title}
          </p>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-[var(--text-strong)]">
              {mod.title}
            </h1>
            <StatusPicker slug={mod.slug} />
          </div>

          <p className="mt-3 max-w-2xl text-[var(--text-dim)]">
            {mod.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-6 border-y border-[var(--line)] py-4">
            <FreqMeter f={mod.frequency} />
            <span className="text-xs text-[var(--ink-faint)]">~{mod.minutes} min read</span>
            {mod.prereqs?.length ? (
              <span className="flex items-center gap-2 text-xs text-[var(--ink-faint)]">
                Prereqs:
                {mod.prereqs.map((p) => (
                  <Link
                    key={p}
                    href={`/guide/${p}`}
                    className="text-link"
                  >
                    {allModules().find((x) => x.module.slug === p)?.module.title ?? p}
                  </Link>
                ))}
              </span>
            ) : null}
          </div>

          {/* content */}
          <article className="prose-phys mt-4">
            {Lesson ? (
              <Lesson />
            ) : (
              <div className="callout mt-8">
                <div className="callout-label">Coming soon</div>
                <p>
                  Full interactive content for this module is being written.
                  The curated problem set below is ready, so start there and use
                  the sources listed as your reading.
                </p>
              </div>
            )}
          </article>

          {/* problems */}
          <section className="mt-14">
            <div className="flex items-baseline gap-4">
              <h2 className="text-xl font-semibold text-[var(--text-strong)]">
                Practice problems
              </h2>
              <span className="text-xs text-[var(--ink-faint)]">★ = do these first · click a dot to track</span>
            </div>
            <div className="mt-5">
              <ProblemTable problems={mod.problems} />
            </div>
          </section>

          {/* prev / next */}
          <nav className="mt-14 grid gap-4 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/guide/${prev.slug}`}
                className="panel panel-hover p-5"
              >
                <span className="text-xs text-[var(--ink-faint)]">← Previous</span>
                <div className="mt-1 font-medium text-[var(--text-strong)]">
                  {prev.title}
                </div>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`/guide/${next.slug}`}
                className="panel panel-hover p-5 text-right"
              >
                <span className="text-xs text-[var(--ink-faint)]">Next →</span>
                <div className="mt-1 font-medium text-[var(--text-strong)]">
                  {next.title}
                </div>
              </Link>
            )}
          </nav>
        </main>
      </div>
    </>
  );
}
