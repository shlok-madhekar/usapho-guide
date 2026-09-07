"use client";

import { RefObject } from "react";

export function Slider({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="sans flex justify-between text-xs text-[var(--ink-soft)]">
        {label}
        <span className="tabular text-[var(--ink-strong)]">
          {value} {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2"
      />
    </label>
  );
}

/** Reads themed colors so canvases follow light/dark. */
export function simColors() {
  if (typeof window === "undefined")
    return { ink: "#1f1d1a", rule: "#ded9cf", accent: "#7b2d26", figure: "#2f4858", faint: "#8d8779", paper: "#fbfaf7" };
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return {
    ink: v("--ink-strong"),
    rule: v("--rule"),
    accent: v("--accent"),
    figure: v("--figure"),
    faint: v("--ink-faint"),
    paper: v("--paper"),
  };
}

export function SimShell({
  title,
  note,
  canvasRef,
  canvasClass = "h-60 w-full",
  controls,
  footer,
}: {
  title: string;
  note?: React.ReactNode;
  canvasRef: RefObject<HTMLCanvasElement>;
  canvasClass?: string;
  controls: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="my-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="label">{title}</span>
        {note && <span className="tabular sans text-xs text-[var(--ink-soft)]">{note}</span>}
      </div>
      <canvas ref={canvasRef} className={`mt-2 ${canvasClass}`} />
      <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-3">{controls}</div>
      {footer}
    </div>
  );
}
