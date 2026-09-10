"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import { DIVISIONS, allModules } from "@/lib/curriculum";
import { MODULE_STATUS_META, ModuleStatus, useProgress } from "@/lib/progress";
import { TOTAL_PROBLEMS, TOTAL_SOLVABLE } from "@/lib/problem-counts";
import { useAuth } from "@/lib/auth";

const STATUSES: ModuleStatus[] = ["reading", "practicing", "complete", "skipped"];

export default function ProgressPage() {
  const { modules, problems, reset, ready, synced, syncing } = useProgress();
  const { configured, session } = useAuth();
  const mods = allModules();

  const solved = Object.values(problems).filter(
    (s) => s === "solved" || s === "reviewed"
  ).length;
  const complete = mods.filter((m) => modules[m.module.slug] === "complete").length;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
        <p className="label">Progress</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">
          Where you are
        </h1>

        <p className="sans mt-3 text-sm text-[var(--ink-soft)]">
          {synced ? (
            syncing ? (
              "Syncing with your account."
            ) : (
              "Saved to your account and available on any device you sign in from."
            )
          ) : configured && !session ? (
            <>
              Saved in this browser only.{" "}
              <Link href="/login" className="link">
                Sign in
              </Link>{" "}
              to keep it across devices.
            </>
          ) : (
            "Saved in this browser."
          )}
        </p>

        {ready && (
          <>
            <dl className="mt-8 grid grid-cols-2 gap-y-6 border-y border-[var(--rule)] py-6 sm:grid-cols-3">
              <Stat label="Modules complete" value={`${complete}`} of={`${mods.length}`} />
              <Stat label="Problems solved" value={`${solved}`} of={`${TOTAL_PROBLEMS}`} />
              <Stat label="Solvable on site" value={`${TOTAL_SOLVABLE}`} of={`${TOTAL_PROBLEMS}`} />
            </dl>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
              {STATUSES.map((s) => (
                <span key={s} className="sans flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: MODULE_STATUS_META[s].color }}
                  />
                  {mods.filter((m) => modules[m.module.slug] === s).length}{" "}
                  {MODULE_STATUS_META[s].label.toLowerCase()}
                </span>
              ))}
            </div>

            {DIVISIONS.map((course) => (
              <section key={course.id} className="mt-10">
                <h2 className="label border-b border-[var(--rule-strong)] pb-1.5">
                  {course.name}
                </h2>
                <ul className="mt-3">
                  {course.sections.flatMap((s) =>
                    s.modules.map((m) => {
                      const st = modules[m.slug] ?? "not-started";
                      return (
                        <li
                          key={m.slug}
                          className="flex items-baseline gap-3 border-b border-[var(--rule)] py-2"
                        >
                          <span
                            className="inline-block h-2 w-2 shrink-0 rounded-full"
                            style={{ background: MODULE_STATUS_META[st].color }}
                          />
                          <Link
                            href={`/guide/${m.slug}`}
                            className="min-w-0 flex-1 truncate text-[0.97rem] hover:text-[var(--accent)]"
                          >
                            {m.title}
                          </Link>
                          <span className="label shrink-0">
                            {MODULE_STATUS_META[st].label}
                          </span>
                        </li>
                      );
                    })
                  )}
                </ul>
              </section>
            ))}

            <button
              onClick={() => {
                if (confirm("Clear all progress? This cannot be undone.")) reset();
              }}
              className="sans mt-10 text-sm text-[var(--ink-faint)] hover:text-[var(--bad)]"
            >
              Clear all progress
            </button>
          </>
        )}
      </main>
    </>
  );
}

function Stat({ label, value, of }: { label: string; value: string; of: string }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="tabular mt-1 text-3xl font-semibold text-[var(--ink-strong)]">
        {value}
        <span className="text-lg font-normal text-[var(--ink-faint)]"> / {of}</span>
      </dd>
    </div>
  );
}
