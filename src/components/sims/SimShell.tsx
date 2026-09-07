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
      <span className="flex justify-between text-xs font-medium text-[var(--text-dim)]">
        {label}
        <span className="text-[var(--text-strong)]">
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
    <div className="panel my-8 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-5 py-3">
        <span className="text-sm font-semibold text-[var(--text-strong)]">{title}</span>
        {note && <span className="font-mono-num text-xs text-[var(--text-dim)]">{note}</span>}
      </div>
      <canvas ref={canvasRef} className={canvasClass} />
      <div className="grid gap-5 border-t border-[var(--line)] p-5 sm:grid-cols-3">
        {controls}
      </div>
      {footer}
    </div>
  );
}
