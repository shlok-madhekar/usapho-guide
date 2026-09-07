"use client";

import { useEffect, useRef, useState } from "react";
import { Frequency } from "@/lib/curriculum";
import { MODULE_STATUS_META, ModuleStatus, useProgress } from "@/lib/progress";

const FREQ_LABEL: Record<Frequency, string> = {
  0: "Rare",
  1: "Occasional",
  2: "Sometimes",
  3: "Frequent",
  4: "Very frequent",
};

/** How often the topic shows up on real exams. */
export function FreqMeter({ f }: { f: Frequency }) {
  return (
    <span className="label" title={`Appears: ${FREQ_LABEL[f]}`}>
      {FREQ_LABEL[f]} on exams
    </span>
  );
}

const ORDER: ModuleStatus[] = [
  "not-started",
  "reading",
  "practicing",
  "complete",
  "skipped",
];

export function StatusPicker({ slug }: { slug: string }) {
  const { modules, setModuleStatus } = useProgress();
  const status = modules[slug] ?? "not-started";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const meta = MODULE_STATUS_META[status];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="sans flex items-center gap-1.5 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: meta.color }}
        />
        {meta.label}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-40 border border-[var(--rule-strong)] bg-[var(--panel)] py-1">
          {ORDER.map((s) => (
            <button
              key={s}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModuleStatus(slug, s);
                setOpen(false);
              }}
              className={`sans flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-[var(--paper-2)] ${
                s === status ? "text-[var(--ink-strong)]" : "text-[var(--ink-soft)]"
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: MODULE_STATUS_META[s].color }}
              />
              {MODULE_STATUS_META[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
