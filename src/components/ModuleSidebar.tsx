"use client";

import Link from "next/link";
import { DIVISIONS } from "@/lib/curriculum";
import { MODULE_STATUS_META, useProgress } from "@/lib/progress";

export default function ModuleSidebar({
  activeSlug,
  divisionId,
}: {
  activeSlug: string;
  divisionId: string;
}) {
  const { modules } = useProgress();
  const division = DIVISIONS.find((d) => d.id === divisionId)!;

  return (
    <aside className="sticky top-16 hidden max-h-[calc(100vh-4rem)] w-60 shrink-0 overflow-y-auto border-r border-[var(--line)] py-10 pr-5 lg:block">
      <p className="text-xs font-semibold text-[var(--text-dim)]">
        {division.name}
      </p>
      {division.sections.map((s) => (
        <div key={s.id} className="mt-6">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            {s.title}
          </p>
          <ul className="mt-2 space-y-0.5">
            {s.modules.map((m) => {
              const st = modules[m.slug] ?? "not-started";
              const active = m.slug === activeSlug;
              return (
                <li key={m.slug}>
                  <Link
                    href={`/guide/${m.slug}`}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[0.82rem] transition-colors ${
                      active
                        ? "bg-[var(--panel-2)] font-medium text-[var(--text-strong)]"
                        : "text-[var(--text-dim)] hover:bg-[var(--panel)] hover:text-[var(--text)]"
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: MODULE_STATUS_META[st].color }}
                    />
                    <span className="truncate">{m.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}
