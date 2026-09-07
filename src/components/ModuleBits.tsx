"use client";

import { Frequency } from "@/lib/curriculum";
import {
  MODULE_STATUS_META,
  ModuleStatus,
  useProgress,
} from "@/lib/progress";
import { useEffect, useRef, useState } from "react";

const FREQ_LABEL: Record<Frequency, string> = {
  0: "Rare",
  1: "Occasional",
  2: "Sometimes",
  3: "Frequent",
  4: "Very Frequent",
};

export function FreqMeter({ f }: { f: Frequency }) {
  return (
    <span className="flex items-center gap-1.5" title={`Appears: ${FREQ_LABEL[f]}`}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="freq-dot"
          style={{
            background: i < f ? "var(--brass)" : "var(--line-bright)",
          }}
        />
      ))}
      <span className="ml-1 text-xs text-[var(--ink-faint)]">{FREQ_LABEL[f]}</span>
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
        className="flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--text-dim)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--text)]"
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: meta.color }}
        />
        {meta.label}
        <span className="text-[var(--ink-faint)]">▾</span>
      </button>
      {open && (
        <div className="panel absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden p-1">
          {ORDER.map((s) => (
            <button
              key={s}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModuleStatus(slug, s);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--panel-2)] ${
                s === status ? "text-[var(--text-strong)]" : "text-[var(--text-dim)]"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: MODULE_STATUS_META[s].color }}
              />
              {MODULE_STATUS_META[s].label}
              {s === status && <span className="ml-auto text-[var(--brass)]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
