"use client";

import Link from "next/link";
import { useState } from "react";
import Nav from "@/components/Nav";
import { DIVISIONS } from "@/lib/curriculum";
import { MODULE_STATUS_META, useProgress } from "@/lib/progress";
import { countFor } from "@/lib/problem-counts";

const problemCount = (slug: string) => countFor(slug).total;

export default function GuideIndex({ written }: { written: string[] }) {
  const hasLesson = new Set(written);
  const [courseId, setCourseId] = useState(DIVISIONS[0]?.id ?? "");
  const course = DIVISIONS.find((d) => d.id === courseId) ?? DIVISIONS[0];
  const { modules } = useProgress();

  if (!course) return null;

  const all = course.sections.flatMap((s) => s.modules);
  const done = all.filter((m) => modules[m.slug] === "complete").length;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-3xl font-bold text-[var(--ink-strong)]">
            {course.name}
          </h1>
          <div className="flex gap-4">
            {DIVISIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => setCourseId(d.id)}
                className={`sans text-sm ${
                  d.id === course.id
                    ? "font-medium text-[var(--ink-strong)] underline underline-offset-4"
                    : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-2 text-[var(--ink-soft)]">
          {course.tagline}.{" "}
          {done > 0 && (
            <span>
              You&apos;ve finished {done} of {all.length}.
            </span>
          )}
        </p>

        {course.sections.map((section, si) => (
          <section key={section.id} className="mt-10">
            <h2 className="text-xl font-bold text-[var(--ink-strong)]">
              <span className="tabular mr-3">{si + 1}</span>
              {section.title}
            </h2>
            {section.blurb && (
              <p className="mt-0.5 text-[0.95em] text-[var(--ink-soft)]">
                {section.blurb}
              </p>
            )}
            <ul className="mt-3 border-t border-[var(--rule)]">
              {section.modules.map((m, mi) => {
                const st = modules[m.slug];
                const started = st && st !== "not-started";
                return (
                  <li key={m.slug} className="border-b border-[var(--rule)]">
                    <Link prefetch={false}
                      href={`/guide/${m.slug}`}
                      className="group flex items-baseline gap-3 py-2.5"
                    >
                      <span className="tabular w-9 shrink-0 text-[var(--ink-soft)]">
                        {si + 1}.{mi + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-[var(--ink-strong)] group-hover:text-[var(--accent)]">
                        {m.title}
                        {!hasLesson.has(m.slug) && (
                          <span className="label ml-2">(notes coming)</span>
                        )}
                      </span>
                      {started && (
                        <span
                          className="sans shrink-0 text-xs"
                          style={{ color: MODULE_STATUS_META[st].color }}
                        >
                          {MODULE_STATUS_META[st].label}
                        </span>
                      )}
                      <span className="label tabular hidden w-40 shrink-0 text-right sm:inline">
                        {m.minutes} min · {problemCount(m.slug)} problems
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>
    </>
  );
}
