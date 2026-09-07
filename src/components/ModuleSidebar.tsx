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
  const division = DIVISIONS.find((d) => d.id === divisionId);
  if (!division) return null;

  return (
    <aside className="sticky top-14 hidden max-h-[calc(100vh-3.5rem)] w-52 shrink-0 overflow-y-auto py-10 lg:block">
      <p className="label">{division.name}</p>
      {division.sections.map((s, si) => (
        <div key={s.id} className="mt-5">
          <p className="sans text-xs font-medium text-[var(--ink-soft)]">
            {si + 1}. {s.title}
          </p>
          <ul className="mt-1.5 space-y-1">
            {s.modules.map((m) => {
              const st = modules[m.slug] ?? "not-started";
              const active = m.slug === activeSlug;
              return (
                <li key={m.slug} className="flex items-baseline gap-2">
                  <span
                    className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: MODULE_STATUS_META[st].color }}
                  />
                  <Link
                    href={`/guide/${m.slug}`}
                    className={`sans text-[0.82rem] leading-snug ${
                      active
                        ? "font-medium text-[var(--ink-strong)]"
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {m.title}
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
