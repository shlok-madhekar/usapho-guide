import Link from "next/link";
import Nav from "@/components/Nav";
import { DIVISIONS, allModules } from "@/lib/curriculum";
import { TOTAL_SOLVABLE } from "@/lib/problem-counts";

export default function Home() {
  const modules = allModules();
  const withLessons = modules.filter((m) => m.module.hasContent).length;
  const units = DIVISIONS.reduce((n, d) => n + d.sections.length, 0);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-16">
        <h1 className="text-[2.6rem] font-semibold leading-[1.1] tracking-tight text-[var(--ink-strong)]">
          A physics olympiad
          <br />
          course you can work through
        </h1>

        <div className="prose mt-7 text-[1.03rem]">
          <p>
            Preparing for F=ma or the USAPhO usually means stitching together a
            textbook chapter here, a handout there, and twenty years of past
            exams with no obvious order. This is an attempt at the missing
            middle: the topics in the order they build on each other, with the
            problems worth doing attached to each one.
          </p>
          <p>
            The full path is {units} units and {modules.length} lessons, from
            your first vector to a complete free-response solution.{" "}
            {withLessons} lessons are written so far and {TOTAL_SOLVABLE} problems can
            be worked and checked right here. Problems taken from real exams are
            cited rather than copied, so you always know what you are looking at.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/guide" className="btn">
            Start reading
          </Link>
          <Link href="/problems" className="btn-plain">
            Problem bank
          </Link>
          <Link href="/edit" className="btn-plain">
            Write for it
          </Link>
        </div>

        <hr className="mt-14" />

        <section className="mt-8">
          <h2 className="label">Contents</h2>
          <div className="mt-5 space-y-8">
            {DIVISIONS.map((course, i) => (
              <div key={course.id}>
                <h3 className="text-lg font-semibold text-[var(--ink-strong)]">
                  <span className="tabular mr-2 text-[var(--ink-faint)]">
                    {i + 1}
                  </span>
                  {course.name}
                </h3>
                <p className="mt-0.5 text-sm text-[var(--ink-soft)]">
                  {course.tagline}.
                </p>
                <ol className="mt-3">
                  {course.sections.map((section, si) => (
                    <li
                      key={section.id}
                      className="flex items-baseline gap-3 border-b border-[var(--rule)] py-2 last:border-0"
                    >
                      <span className="tabular w-8 shrink-0 text-sm text-[var(--ink-faint)]">
                        {i + 1}.{si + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/guide/${section.modules[0]?.slug ?? ""}`}
                          className="font-medium text-[var(--ink)] hover:text-[var(--accent)]"
                        >
                          {section.title}
                        </Link>
                        {section.blurb && (
                          <p className="text-[0.9rem] leading-snug text-[var(--ink-soft)]">
                            {section.blurb}
                          </p>
                        )}
                      </div>
                      <span className="label shrink-0">
                        {section.modules.length} lessons
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <hr className="mt-14" />

        <footer className="mt-6 text-sm text-[var(--ink-soft)]">
          <p>
            Free and open source. Anyone can write a lesson, add a problem or
            build a simulation from{" "}
            <Link href="/edit" className="link">
              the editor
            </Link>
            : changes arrive as a pull request under your own GitHub account,
            reviewed before they go live. Plain pull requests on{" "}
            <a
              href="https://github.com/shlok-madhekar/usapho-guide"
              className="link"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>{" "}
            work just as well. Structured after the{" "}
            <a href="https://usaco.guide" className="link">
              USACO Guide
            </a>
            . Not affiliated with AAPT.
          </p>
        </footer>
      </main>
    </>
  );
}
