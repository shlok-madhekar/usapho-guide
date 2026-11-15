import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Sim from "@/components/Sim";
import { Markish } from "@/components/Katex";
import ContinueReading from "@/components/ContinueReading";
import DiscordLink from "@/components/DiscordLink";
import { DIVISIONS } from "@/lib/curriculum";
import { LESSONS } from "@/content/lessons";
import { TOTAL_SOLVABLE } from "@/lib/problem-counts";
import { DIFFICULTY_VAR } from "@/lib/problem-types";
import { dailyLesson, dailyProblem, dailyToday, formatDailyDate } from "@/lib/daily";

const REPO = "https://github.com/shlok-madhekar/usapho-guide";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// rebuilt every few minutes, so the problem of the day turns over soon after
// midnight Pacific
export const revalidate = 300;

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

const STEPS = [
  {
    title: "Read",
    body: "Each lesson builds one idea from the start, with worked examples at the level of the exam.",
  },
  {
    title: "Play",
    body: "Simulations sit next to the math. Drag a slider and watch a formula do what it says before you trust it.",
  },
  {
    title: "Check",
    body: "Every lesson ends with 30 or more problems, easiest first. Type an answer, get a verdict, then read the full solution.",
  },
];

export default function Home() {
  const lessons = Object.keys(LESSONS).length;
  const sims = simCount();
  const today = dailyToday();
  const daily = dailyProblem(today);
  const dailyFrom = daily && dailyLesson(daily);

  const stats = [
    { value: String(lessons), label: "lessons, F=ma through USAPhO" },
    { value: String(sims), label: "simulations to play with" },
    { value: fmt(TOTAL_SOLVABLE), label: "problems checked on the page" },
    { value: "Free", label: "and open source, with no ads" },
  ];

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
              A full course for the physics olympiad, from units and vectors
              through E&amp;M, thermodynamics, optics and relativity. Every
              problem checks your answer on the spot. It&apos;s all free, and
              the source is on GitHub, so if something is wrong you can fix it.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link prefetch={false} href="/guide" className="btn">
                Start with F=ma
              </Link>
              <Link prefetch={false} href="/daily" className="btn-plain">
                Today&apos;s problem
              </Link>
              <Link prefetch={false} href="/problems" className="btn-plain">
                Problem bank
              </Link>
            </div>
            <ContinueReading />
          </div>

          <figure className="border border-[var(--rule-strong)] p-4">
            <Sim id="projectile" />
            <figcaption className="mt-3 text-[0.88em] leading-snug">
              <b>Try it.</b> Drag the sliders. Every lesson has a few of these
              next to the math.
            </figcaption>
          </figure>
        </section>

        <dl className="mt-14 grid grid-cols-2 gap-px border-y border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse justify-end bg-[var(--paper)] px-1 py-5 sm:px-4 sm:first:pl-0">
              <dt className="sans mt-2 text-[0.85em] leading-snug text-[var(--ink-soft)]">
                {s.label}
              </dt>
              <dd className="tabular text-[1.9rem] font-bold leading-none text-[var(--ink-strong)]">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>

        {daily && (
          <section className="mt-16 grid gap-6 md:grid-cols-[15rem_1fr] md:gap-12">
            <div>
              <h2 className="text-2xl font-bold text-[var(--ink-strong)]">
                Problem of the day
              </h2>
              <p className="sans mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                {formatDailyDate(today)}. The same problem for everyone, new
                each day at midnight Pacific.
              </p>
            </div>
            <article className="border border-[var(--rule-strong)] p-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-[1.1rem] font-semibold text-[var(--ink-strong)]">
                  {daily.name}
                </h3>
                <span className="label" style={{ color: DIFFICULTY_VAR[daily.difficulty] }}>
                  {daily.difficulty}
                </span>
                {dailyFrom && (
                  <span className="sans text-xs text-[var(--ink-faint)]">
                    {dailyFrom.title}
                  </span>
                )}
              </div>
              <div className="prose mt-3 max-w-none text-[0.97rem]">
                <Markish text={daily.statement} />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link prefetch={false} href="/daily" className="btn">
                  Solve it
                </Link>
                <span className="sans text-sm text-[var(--ink-soft)]">
                  Checked on the page, with a full solution.
                </span>
              </div>
            </article>
          </section>
        )}

        <section className="mt-20">
          <h2 className="text-2xl font-bold text-[var(--ink-strong)]">How it works</h2>
          <ol className="mt-6 grid gap-8 md:grid-cols-3 md:gap-10">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t-2 border-[var(--ink-strong)] pt-4">
                <p className="sans tabular text-sm font-semibold text-[var(--ink-soft)]">
                  {i + 1}
                </p>
                <h3 className="mt-1 text-lg font-bold text-[var(--ink-strong)]">{step.title}</h3>
                <p className="mt-2 text-[0.95em] leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="sans mt-6 text-sm text-[var(--ink-soft)]">
            Mark lessons as you go, and{" "}
            <Link prefetch={false} href="/progress" className="link">
              your progress
            </Link>{" "}
            is saved in this browser, or on every device once you sign in.
          </p>
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

        <section className="mt-20 grid gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-2">
          <div className="bg-[var(--paper)] p-6">
            <h2 className="text-xl font-bold text-[var(--ink-strong)]">Study with others</h2>
            <p className="mt-2 text-[0.95em] leading-relaxed">
              Ask about a problem you&apos;re stuck on, find study partners and
              talk through past exams with other F=ma and USAPhO students.
            </p>
            <DiscordLink from="home_community" className="btn-plain mt-4 inline-flex">
              Join the Discord
            </DiscordLink>
          </div>
          <div className="bg-[var(--paper)] p-6">
            <h2 className="text-xl font-bold text-[var(--ink-strong)]">Help write it</h2>
            <p className="mt-2 text-[0.95em] leading-relaxed">
              Fix a mistake, add a problem or write a lesson in the editor,
              right in your browser. Everyone who helps is listed on the{" "}
              <Link prefetch={false} href="/contributors" className="link">
                contributors page
              </Link>
              .
            </p>
            <Link prefetch={false} href="/edit" className="btn-plain mt-4 inline-flex">
              Open the editor
            </Link>
          </div>
        </section>

        <footer className="mt-16 border-t border-[var(--rule)] pt-6 text-[0.9em] text-[var(--ink-soft)]">
          <p>
            The source is on{" "}
            <a href={REPO} className="link" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            . Found a mistake?{" "}
            <a href={`${REPO}/issues`} className="link" target="_blank" rel="noopener noreferrer">
              Open an issue
            </a>
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
          <p className="mt-2">
            <Link prefetch={false} href="/privacy" className="link">
              Privacy
            </Link>
            {" · "}
            <Link prefetch={false} href="/terms" className="link">
              Terms
            </Link>
          </p>
        </footer>
      </main>
    </>
  );
}
