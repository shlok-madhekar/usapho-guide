"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    // pointerdown rather than mousedown, so a tap outside closes it on phones
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    // keyboard users land on the current status, as in a native select
    items.current[ORDER.indexOf(status)]?.focus();
    return () => document.removeEventListener("pointerdown", close);
    // focus only when the menu opens, not on every status change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const shut = (refocus: boolean) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    const at = items.current.findIndex((el) => el === document.activeElement);
    const move = (i: number) => {
      e.preventDefault();
      items.current[(i + ORDER.length) % ORDER.length]?.focus();
    };
    if (e.key === "ArrowDown") move(at + 1);
    else if (e.key === "ArrowUp") move(at - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(ORDER.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      shut(true);
    } else if (e.key === "Tab") shut(false);
  };

  const meta = MODULE_STATUS_META[status];

  return (
    <div className="relative" ref={ref}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Your status for this lesson: ${meta.label}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="sans flex items-center gap-1.5 whitespace-nowrap text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
      >
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ background: meta.color }}
          aria-hidden
        />
        {meta.label}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Lesson status"
          onKeyDown={onMenuKey}
          className="absolute right-0 top-full z-30 mt-1.5 w-40 border border-[var(--rule-strong)] bg-[var(--panel)] py-1"
        >
          {ORDER.map((s, i) => (
            <button
              key={s}
              ref={(el) => {
                items.current[i] = el;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={s === status}
              tabIndex={-1}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModuleStatus(slug, s);
                shut(true);
              }}
              className={`sans flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-[var(--paper-2)] focus:bg-[var(--paper-2)] focus:outline-none ${
                s === status ? "text-[var(--ink-strong)]" : "text-[var(--ink-soft)]"
              }`}
            >
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ background: MODULE_STATUS_META[s].color }}
                aria-hidden
              />
              {MODULE_STATUS_META[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
