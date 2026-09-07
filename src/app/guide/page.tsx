"use client";

import Link from "next/link";
import { useState } from "react";
import Nav from "@/components/Nav";
import { DIVISIONS } from "@/lib/curriculum";
import { FreqMeter, StatusPicker } from "@/components/ModuleBits";
import { useProgress } from "@/lib/progress";

export default function GuidePage() {
  const [divId, setDivId] = useState(DIVISIONS[0].id);
  const division = DIVISIONS.find((d) => d.id === divId)!;
  const { modules } = useProgress();

  const all = division.sections.flatMap((s) => s.modules);
  const done = all.filter((m) => modules[m.slug] === "complete").length;
  const pct = Math.round((done / all.length) * 100);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-strong)]">
            Guide
          </h1>
          {/* division switcher */}
          <div className="flex rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-0.5">
            {DIVISIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDivId(d.id)}
                className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
                  d.id === divId
                    ? "border border-[var(--line)] bg-white font-medium text-[var(--text-strong)] shadow-sm"
                    : "text-[var(--text-dim)] hover:text-[var(--text)]"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-2 max-w-xl text-[var(--text-dim)]">{division.tagline}.</p>

        {/* division progress */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--panel-2)]">
            <div
              className="h-full rounded-full bg-[var(--status-complete)] transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-mono-num text-xs text-[var(--text-dim)]">
            {done}/{all.length} complete
          </span>
        </div>

        {division.sections.map((section) => (
          <section key={section.id} className="mt-10">
            <h2 className="border-b border-[var(--line)] pb-2 text-lg font-semibold text-[var(--text-strong)]">
              {section.title}
            </h2>

            <div className="mt-4 space-y-2">
              {section.modules.map((m) => (
                <Link
                  key={m.slug}
                  href={`/guide/${m.slug}`}
                  className="panel panel-hover flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-medium text-[var(--text-strong)]">
                        {m.title}
                      </h3>
                      {m.hasContent && (
                        <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[0.65rem] font-medium text-[var(--teal)]">
                          interactive
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-[var(--text-dim)]">
                      {m.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                      <FreqMeter f={m.frequency} />
                      <span className="text-xs text-[var(--ink-faint)]">
                        {m.minutes} min · {m.problems.length} problems
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StatusPicker slug={m.slug} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
