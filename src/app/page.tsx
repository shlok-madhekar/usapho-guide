import Link from "next/link";
import Nav from "@/components/Nav";
import { DIVISIONS, allModules } from "@/lib/curriculum";
import { PROBLEMS, isSolvable } from "@/lib/problems";

export default function Home() {
  const modules = allModules();
  const solvable = PROBLEMS.filter(isSolvable).length;
  const withLessons = modules.filter((m) => m.module.hasContent).length;

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
            {withLessons} modules are written so far, and {solvable} problems can
            be worked and checked on the site. Problems taken from real exams
            are cited rather than copied, so you always know what you are
            looking at.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/guide" className="btn">
            Start reading
          </Link>
          <Link href="/problems" className="btn-plain">
            Problem bank
          </Link>
        </div>

        <hr className="mt-14" />

        <section className="mt-8">
          <h2 className="label">Contents</h2>
          <div className="mt-5 space-y-9">
            {DIVISIONS.map((course, i) => (
              <div key={course.id}>
                <h3 className="text-lg font-semibold text-[var(--ink-strong)]">
                  <span className="tabular mr-2 text-[var(--ink-faint)]">
                    {i + 1}
                  </span>
                  {course.name}
                </h3>
                <p className="mt-0.5 text-sm text-[var(--ink-soft)]">
                  {course.tagline}
                </p>
                <div className="mt-3 space-y-2.5">
                  {course.sections.map((section, si) => (
                    <div key={section.id} className="text-[0.97rem]">
                      <span className="tabular mr-2 text-sm text-[var(--ink-faint)]">
                        {i + 1}.{si + 1}
                      </span>
                      <span className="font-medium text-[var(--ink)]">
                        {section.title}
                      </span>
                      <span className="text-[var(--ink-faint)]"> — </span>
                      {section.modules.map((m, mi) => (
                        <span key={m.slug}>
                          <Link href={`/guide/${m.slug}`} className="link">
                            {m.title}
                          </Link>
                          {mi < section.modules.length - 1 && (
                            <span className="text-[var(--ink-faint)]">, </span>
                          )}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="mt-14" />

        <footer className="mt-6 text-sm text-[var(--ink-soft)]">
          <p>
            Free and open source. Corrections and new material are welcome by
            pull request on{" "}
            <a
              href="https://github.com/shlok-madhekar/usapho-guide"
              className="link"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            . Structured after the{" "}
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
