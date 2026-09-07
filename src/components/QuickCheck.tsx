"use client";

import { useState } from "react";

export default function QuickCheck({
  question,
  options,
  answer,
  explanation,
}: {
  question: React.ReactNode;
  options: React.ReactNode[];
  answer: number;
  explanation: React.ReactNode;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div className="panel my-8 overflow-hidden">
      <div className="border-b border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--text-strong)]">
        Check your understanding
      </div>
      <div className="p-5">
        <div className="text-[var(--text)]">{question}</div>
        <div className="mt-4 grid gap-2">
          {options.map((opt, i) => {
            const isPicked = picked === i;
            const revealed = picked !== null;
            const correct = i === answer;
            let border = "var(--line)";
            let bg = "transparent";
            if (revealed && correct) {
              border = "var(--status-complete)";
              bg = "color-mix(in srgb, var(--status-complete) 8%, transparent)";
            } else if (isPicked && !correct) {
              border = "var(--diff-insane)";
              bg = "color-mix(in srgb, var(--diff-insane) 8%, transparent)";
            }
            return (
              <button
                key={i}
                onClick={() => setPicked(i)}
                disabled={picked !== null}
                className="flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm text-[var(--text-dim)] transition-all enabled:hover:border-[var(--line-bright)] enabled:hover:text-[var(--text)]"
                style={{ borderColor: border, background: bg }}
              >
                <span className="font-mono text-xs text-[var(--text-dim)]">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
                {revealed && correct && (
                  <span className="ml-auto text-[var(--status-complete)]">✓</span>
                )}
                {isPicked && !correct && (
                  <span className="ml-auto text-[var(--diff-insane)]">✕</span>
                )}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="rise mt-4 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-4 text-sm text-[var(--text-dim)]">
            <span className="mr-2 text-xs font-semibold uppercase text-[var(--teal)]">
              Why
            </span>
            {explanation}
            <button
              onClick={() => setPicked(null)}
              className="mt-3 block text-xs font-medium text-[var(--link)] hover:underline"
            >
              ↻ try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
