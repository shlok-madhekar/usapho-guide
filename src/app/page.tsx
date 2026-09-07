import Link from "next/link";
import Nav from "@/components/Nav";
import ProblemTable from "@/components/ProblemTable";
import ProblemSolver from "@/components/ProblemSolver";
import { K, KBlock } from "@/components/Katex";
import { DIVISIONS, allModules } from "@/lib/curriculum";

const SAMPLE_PROBLEMS = [
  {
    id: "p1",
    source: "F=ma 2018/8",
    name: "Cliff Launch",
    difficulty: "Easy" as const,
    tags: ["projectiles"],
  },
  {
    id: "p2",
    source: "F=ma 2015/14",
    name: "Range on an Incline",
    difficulty: "Normal" as const,
    tags: ["inclines"],
    starred: true,
  },
  {
    id: "e2",
    source: "F=ma 2020/20",
    name: "Ballistic Pendulum",
    difficulty: "Normal" as const,
    tags: ["collisions"],
    starred: true,
  },
  {
    id: "g1",
    source: "USAPhO 2015/A1",
    name: "Charged Hemisphere",
    difficulty: "Hard" as const,
    tags: ["gauss"],
  },
];

function FeatureRow({
  title,
  body,
  demo,
  flip,
}: {
  title: string;
  body: string;
  demo: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-8 lg:items-center ${
        flip ? "lg:flex-row-reverse" : "lg:flex-row"
      }`}
    >
      <div className="lg:w-2/5">
        <h3 className="text-2xl font-bold tracking-tight text-[var(--text-strong)]">
          {title}
        </h3>
        <p className="mt-3 text-[var(--text-dim)]">{body}</p>
      </div>
      <div className="min-w-0 lg:w-3/5">{demo}</div>
    </div>
  );
}

export default function Landing() {
  const mods = allModules();
  const problemCount = mods.reduce((n, m) => n + m.module.problems.length, 0);

  return (
    <>
      <Nav />
      <main>
        {/* hero */}
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto max-w-3xl px-5 pb-20 pt-20 text-center">
            <h1 className="rise rise-1 text-5xl font-bold tracking-tight text-[var(--text-strong)] sm:text-6xl">
              USAPhO <span className="text-[var(--link)]">Guide</span>
            </h1>
            <p className="rise rise-2 mx-auto mt-5 max-w-xl text-lg text-[var(--text-dim)]">
              A free collection of curated, high-quality resources to take you
              from F=ma to USAPhO and beyond.
            </p>
            <div className="rise rise-3 mt-8 flex justify-center gap-3">
              <Link href="/guide" className="btn-brass">
                Get Started
              </Link>
              <Link href="/guide/projectile-motion" className="btn-ghost">
                Sample module
              </Link>
            </div>
            <p className="rise rise-4 mt-6 text-sm text-[var(--ink-faint)]">
              Written by olympiad students, for olympiad students.
            </p>
          </div>
        </section>

        {/* intro */}
        <section className="mx-auto max-w-3xl px-5 pt-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-strong)]">
            Learn olympiad physics. Efficiently.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--text-dim)]">
            Stop hunting through textbooks, handouts, and twenty years of past
            exams. The USAPhO Guide organizes everything into a roadmap you can
            work through in order, with the best problems for each topic
            already picked out. Available to everyone, for free.
          </p>
        </section>

        {/* features */}
        <section className="mx-auto max-w-5xl space-y-24 px-5 py-20">
          <FeatureRow
            title="Curated problem sets"
            body="Every module ends with problems chosen from real F=ma, USAPhO, and IPhO exams, ordered by difficulty. Starred problems are the ones worth doing first. Click a status dot to track where you stand."
            demo={<ProblemTable problems={SAMPLE_PROBLEMS} />}
          />

          <FeatureRow
            flip
            title="Solve problems right here"
            body="Many modules include problems you can answer on the page. Type a number, check it, and read a full worked solution when you're done. Correct answers are saved to your progress automatically."
            demo={
              <ProblemSolver
                id="np-demo-1"
                number={1}
                title="Warmup"
                difficulty="Easy"
                statement={
                  <p>
                    A stone dropped from rest falls for 3 seconds. Using{" "}
                    <K>g = 10</K> m/s², how far does it fall, in meters?
                  </p>
                }
                answer={45}
                unit="m"
                hint={<span>Free fall from rest: distance grows as the square of time.</span>}
                solution={
                  <KBlock>{String.raw`d = \tfrac12 g t^2 = \tfrac12 (10)(3^2) = 45 \text{ m}`}</KBlock>
                }
              />
            }
          />

          <FeatureRow
            title="Track your progress"
            body="Mark modules as reading, practicing, or complete, and cycle each problem through attempted, solved, and reviewed. Everything is stored in your browser. No account needed."
            demo={
              <div className="panel p-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">
                  Modules progress
                </div>
                <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                  {[
                    ["6", "Completed", "var(--status-complete)"],
                    ["3", "In progress", "var(--status-practicing)"],
                    ["2", "Skipped", "var(--status-skipped)"],
                    ["1", "Not started", "var(--line-bright)"],
                  ].map(([n, label, color]) => (
                    <div key={label}>
                      <div
                        className="text-3xl font-bold"
                        style={{ color: color as string }}
                      >
                        {n}
                      </div>
                      <div className="mt-1 text-[0.7rem] font-medium uppercase tracking-wide text-[var(--ink-faint)]">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-[var(--panel-2)]">
                  <div className="w-1/2 bg-[var(--status-complete)]" />
                  <div className="w-1/4 bg-[var(--status-practicing)]" />
                  <div className="w-1/6 bg-[var(--status-skipped)]" />
                </div>
                <div className="mt-2 text-right text-xs text-[var(--ink-faint)]">
                  12 total
                </div>
              </div>
            }
          />
        </section>

        {/* stats */}
        <section className="border-y border-[var(--line)] bg-[var(--ink)]">
          <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 px-5 py-12 text-center">
            {[
              [String(mods.length), "Modules"],
              [String(problemCount), "Curated problems"],
              ["100%", "Free"],
            ].map(([n, label]) => (
              <div key={label}>
                <div className="text-4xl font-bold text-[var(--text-strong)]">{n}</div>
                <div className="mt-1 text-sm text-[var(--text-dim)]">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* table of contents */}
        <section className="mx-auto max-w-4xl px-5 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-strong)]">
            What&apos;s inside
          </h2>
          <div className="mt-8 grid gap-10 sm:grid-cols-2">
            {DIVISIONS.map((d) => (
              <div key={d.id}>
                <h3 className="text-lg font-semibold text-[var(--text-strong)]">
                  {d.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-dim)]">{d.tagline}</p>
                <ul className="mt-4 space-y-3">
                  {d.sections.map((s) => (
                    <li key={s.id}>
                      <div className="text-sm font-medium text-[var(--text-strong)]">
                        {s.title}
                      </div>
                      <div className="mt-0.5 text-sm leading-relaxed">
                        {s.modules.map((m, i) => (
                          <span key={m.slug}>
                            <Link href={`/guide/${m.slug}`} className="text-link">
                              {m.title}
                            </Link>
                            {i < s.modules.length - 1 && (
                              <span className="text-[var(--ink-faint)]"> · </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/guide" className="btn-brass">
              View the full guide
            </Link>
          </div>
        </section>

        <footer className="border-t border-[var(--line)]">
          <div className="mx-auto flex max-w-4xl flex-col gap-2 px-5 py-8 text-sm text-[var(--ink-faint)] sm:flex-row sm:justify-between">
            <p>
              Inspired by the{" "}
              <a href="https://usaco.guide" className="text-link">
                USACO Guide
              </a>
              . Not affiliated with AAPT.
            </p>
            <p>Progress is stored locally in your browser.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
