"use client";

import Link from "next/link";
import { useState } from "react";
import Nav from "@/components/Nav";
import { DIVISIONS } from "@/lib/curriculum";
import { FreqMeter, StatusPicker } from "@/components/ModuleBits";
import { useProgress } from "@/lib/progress";
import { problemsForModule } from "@/lib/problems";
import { LESSONS } from "@/content/lessons";

export default function GuidePage() {
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
          <div>
            <p className="label">Course</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">
              {course.name}
            </h1>
          </div>
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

        <p className="mt-2 text-[var(--ink-soft)]">{course.tagline}.</p>
        <p className="sans mt-4 text-sm text-[var(--ink-faint)]">
          {done} of {all.length} modules marked complete
        </p>

        {course.sections.map((section, si) => (
          <section key={section.id} className="mt-10">
            <h2 className="border-b border-[var(--rule-strong)] pb-1.5 text-lg font-semibold text-[var(--ink-strong)]">
              <span className="tabular mr-2 text-[var(--ink-faint)]">{si + 1}</span>
              {section.title}
            </h2>
            <ul>
              {section.modules.map((m, mi) => (
                <li key={m.slug} className="border-b border-[var(--rule)]">
                  <div className="flex items-baseline gap-3 py-3.5">
                    <span className="tabular sans w-8 shrink-0 text-sm text-[var(--ink-faint)]">
                      {si + 1}.{mi + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/guide/${m.slug}`}
                        className="font-medium text-[var(--ink-strong)] hover:text-[var(--accent)]"
                      >
                        {m.title}
                      </Link>
                      {!LESSONS[m.slug] && (
                        <span className="label ml-2">notes pending</span>
                      )}
                      {m.description && (
                        <p className="mt-0.5 text-[0.93rem] leading-snug text-[var(--ink-soft)]">
                          {m.description}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1">
                        <FreqMeter f={m.frequency} />
                        <span className="label">{m.minutes} min</span>
                        <span className="label">
                          {problemsForModule(m.slug).length} problems
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <StatusPicker slug={m.slug} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </>
  );
}
