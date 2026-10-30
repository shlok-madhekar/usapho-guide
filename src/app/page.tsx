import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Sim from "@/components/Sim";
import { DIVISIONS } from "@/lib/curriculum";
import { LESSONS } from "@/content/lessons";
import { TOTAL_SOLVABLE } from "@/lib/problem-counts";

const REPO = "https://github.com/shlok-madhekar/usapho-guide";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/** Counted at build time from the files themselves, so it never goes stale. */
function simCount() {
  try {
    return fs
      .readdirSync(path.join(process.cwd(), "public", "sims"))
      .filter((f) => f.endsWith(".json")).length;
  } catch {
    return 0;
  }
}

const fmt = (n: number) => n.toLocaleString("en-US");

export default function Home() {
  const lessons = Object.keys(LESSONS).length;
  const sims = simCount();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 pb-24">
        <section className="grid items-start gap-10 pt-14 md:grid-cols-[1fr_1.05fr] md:gap-12 md:pt-20">
          <div>
            <h1 className="text-[clamp(2rem,1.4rem+2.2vw,2.9rem)] font-bold leading-[1.1] text-[var(--ink-strong)]">
              Free notes and problems for F=ma and USAPhO
            </h1>
            <p className="mt-5 text-[1.08em] leading-relaxed">
              {lessons} lessons, {sims} simulations you can play with, and{" "}
              {fmt(TOTAL_SOLVABLE)} problems that check your answer on the spot.
              It&apos;s all free, and the source is on GitHub, so if something
              is wrong you can fix it.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link prefetch={false} href="/guide" className="btn">
                Start with F=ma
              </Link>
              <Link prefetch={false} href="/problems" className="btn-plain">
                Problem bank
              </Link>
            </div>
          </div>

          <figure className="border border-[var(--rule-strong)] p-4">
            <Sim id="projectile" />
            <figcaption className="mt-3 text-[0.88em] leading-snug">
              <b>Try it.</b> Drag the sliders. Every lesson has a few of these
              next to the math.
            </figcaption>
          </figure>
        </section>

        <section className="mt-20">
          <h2 className="text-2xl font-bold text-[var(--ink-strong)]">Contents</h2>
          <div className="mt-6 grid gap-x-14 gap-y-10 md:grid-cols-2">
            {DIVISIONS.map((course, ci) => (
              <div key={course.id}>
                <h3 className="text-lg font-bold text-[var(--ink-strong)]">
                  Part {ci + 1}. {course.name}
                </h3>
                <p className="mt-1 text-[0.92em] text-[var(--ink-soft)]">
                  {course.tagline}.
                </p>
                <ol className="mt-4">
                  {course.sections.map((section, si) => (
                    <li key={section.id} className="py-1.5">
                      <Link prefetch={false}
                        href={`/guide/${section.modules[0]?.slug ?? ""}`}
                        className="group flex items-baseline gap-2"
                      >
                        <span className="tabular w-6 shrink-0 font-bold">
                          {si + 1}
                        </span>
                        <span className="font-bold text-[var(--ink-strong)] group-hover:text-[var(--accent)]">
                          {section.title.replace(/:.*$/, "")}
                        </span>
                        <span
                          aria-hidden
                          className="mx-1 flex-1 translate-y-[-0.25em] border-b border-dotted border-[var(--ink-faint)]"
                        />
                        <span className="tabular shrink-0 text-[0.92em] text-[var(--ink-soft)]">
                          {section.modules.length}
                        </span>
                      </Link>
                      {section.blurb && (
                        <p className="ml-8 text-[0.9em] leading-snug text-[var(--ink-soft)]">
                          {section.blurb}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-20 border-t border-[var(--rule)] pt-6 text-[0.9em] text-[var(--ink-soft)]">
          <p>
            Anyone can add a lesson or a problem from{" "}
            <Link prefetch={false} href="/edit" className="link">
              the editor
            </Link>{" "}
            or a pull request on{" "}
            <a href={REPO} className="link" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            . Found a mistake?{" "}
            <a href={`${REPO}/issues`} className="link" target="_blank" rel="noopener noreferrer">
              Open an issue
            </a>
            . See{" "}
            <Link prefetch={false} href="/contributors" className="link">
              who&apos;s helped
            </Link>
            .
          </p>
          <p className="mt-2">
            Licensed under{" "}
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              className="link"
              target="_blank"
              rel="noopener noreferrer"
            >
              CC BY-NC-SA 4.0
            </a>
            : share and adapt it non-commercially, credit the USAPhO Guide
            (usapho.one), and keep adaptations under the same license. Past
            exam problems are cited, not copied. Not affiliated with AAPT.
          </p>
        </footer>
      </main>
    </>
  );
}
