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

/**
 * The reader's status for a module, as a menu button: arrow keys, Home and End
 * move through the options, Escape closes and hands focus back, and the menu
 * closes when focus or a click goes elsewhere.
 */
export function StatusPicker({ slug }: { slug: string }) {
  const { modules, setModuleStatus } = useProgress();
  const status = modules[slug] ?? "not-started";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // opening puts focus on the current choice, as a menu of options expects
  useEffect(() => {
    if (open) items.current[ORDER.indexOf(status)]?.focus();
  }, [open, status]);

  const shut = () => {
    setOpen(false);
    button.current?.focus();
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
      shut();
    } else if (e.key === "Tab") setOpen(false);
  };

  const meta = MODULE_STATUS_META[status];

  return (
    <div
      className="relative"
      ref={ref}
      // Tab or a click elsewhere moves focus out: nothing should stay open
      onBlur={(e) => {
        if (open && !ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Your status for this module: ${meta.label}`}
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
        className="sans flex items-center gap-1.5 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: meta.color }}
          aria-hidden
        />
        {meta.label}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Module status"
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
                shut();
              }}
              className={`sans flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-[var(--paper-2)] focus:bg-[var(--paper-2)] ${
                s === status ? "text-[var(--ink-strong)]" : "text-[var(--ink-soft)]"
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
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
