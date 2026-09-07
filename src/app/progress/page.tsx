"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import { DIVISIONS, allModules } from "@/lib/curriculum";
import {
  MODULE_STATUS_META,
  ModuleStatus,
  useProgress,
} from "@/lib/progress";

function Ring({ pct, size = 150 }: { pct: number; size?: number }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--panel-2)"
        strokeWidth="8"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--status-complete)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        style={{ transition: "stroke-dashoffset 1s var(--ease-out-expo)" }}
      />
    </svg>
  );
}

const STATUSES: ModuleStatus[] = ["reading", "practicing", "complete", "skipped"];

export default function ProgressPage() {
  const { modules, problems, reset, ready } = useProgress();
  const mods = allModules();
  const totalProblems = mods.reduce((n, m) => n + m.module.problems.length, 0);
  const solved = Object.values(problems).filter(
    (s) => s === "solved" || s === "reviewed"
  ).length;
  const complete = mods.filter((m) => modules[m.module.slug] === "complete").length;
  const pct = Math.round((complete / mods.length) * 100);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 pb-28 pt-14">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-strong)]">
          My progress
        </h1>

        {ready && (
          <>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div className="panel flex items-center gap-6 p-6 md:col-span-1">
                <div className="relative">
                  <Ring pct={pct} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-[var(--text-strong)]">
                      {pct}%
                    </span>
                    <span className="text-[0.65rem] font-medium uppercase tracking-wide text-[var(--ink-faint)]">
                      complete
                    </span>
                  </div>
                </div>
              </div>
              <div className="panel p-6">
                <div className="text-xs font-medium text-[var(--text-dim)]">
                  Modules complete
                </div>
                <div className="mt-2 text-4xl font-bold text-[var(--text-strong)]">
                  {complete}
                  <span className="text-2xl text-[var(--ink-faint)]"> / {mods.length}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {STATUSES.map((s) => {
                    const n = mods.filter((m) => modules[m.module.slug] === s).length;
                    return (
                      <span
                        key={s}
                        className="flex items-center gap-1.5 text-xs text-[var(--text-dim)]"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: MODULE_STATUS_META[s].color }}
                        />
                        {n} {MODULE_STATUS_META[s].label.toLowerCase()}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="panel p-6">
                <div className="text-xs font-medium text-[var(--text-dim)]">
                  Problems solved
                </div>
                <div className="mt-2 text-4xl font-bold text-[var(--text-strong)]">
                  {solved}
                  <span className="text-2xl text-[var(--ink-faint)]"> / {totalProblems}</span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--panel-2)]">
                  <div
                    className="h-full rounded-full bg-[var(--status-complete)] transition-[width] duration-700"
                    style={{ width: `${(solved / totalProblems) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* per-division heatmap */}
            {DIVISIONS.map((d) => (
              <section key={d.id} className="mt-12">
                <h2 className="text-lg font-semibold text-[var(--text-strong)]">
                  {d.name}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {d.sections.flatMap((s) =>
                    s.modules.map((m) => {
                      const st = modules[m.slug] ?? "not-started";
                      return (
                        <Link
                          key={m.slug}
                          href={`/guide/${m.slug}`}
                          title={`${m.title}: ${MODULE_STATUS_META[st].label}`}
                          className="group flex h-10 w-10 items-center justify-center rounded-lg border transition-transform hover:scale-110"
                          style={{
                            borderColor:
                              st === "not-started"
                                ? "var(--line)"
                                : MODULE_STATUS_META[st].color,
                            background:
                              st === "not-started"
                                ? "var(--panel)"
                                : `color-mix(in srgb, ${MODULE_STATUS_META[st].color} 18%, var(--panel))`,
                          }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: MODULE_STATUS_META[st].color }}
                          />
                        </Link>
                      );
                    })
                  )}
                </div>
              </section>
            ))}

            <button
              onClick={() => {
                if (confirm("Reset all local progress? This cannot be undone.")) reset();
              }}
              className="mt-14 text-xs text-[var(--ink-faint)] transition-colors hover:text-[var(--diff-insane)]"
            >
              ✕ Reset all progress
            </button>
          </>
        )}
      </main>
    </>
  );
}
