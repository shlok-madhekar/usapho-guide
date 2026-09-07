"use client";

import { useState } from "react";

/**
 * A single multiple-choice check. Plain strings so lesson MDX stays readable,
 * with no JSX in the attributes.
 */
export default function QuickCheck({
  question,
  options,
  answer,
  explanation,
}: {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const revealed = picked !== null;

  return (
    <div className="my-8 border-y border-[var(--rule)] py-5">
      <p className="label">Check yourself</p>
      <p className="mt-2 text-[var(--ink)]">{question}</p>
      <ol className="mt-3 space-y-1.5">
        {options.map((opt, i) => {
          const correct = i === answer;
          const wrongPick = revealed && picked === i && !correct;
          return (
            <li key={i}>
              <button
                onClick={() => setPicked(i)}
                disabled={revealed}
                className="sans flex w-full items-baseline gap-2.5 text-left text-[0.92rem] disabled:cursor-default"
                style={{
                  color: revealed && correct
                    ? "var(--ok)"
                    : wrongPick
                    ? "var(--bad)"
                    : "var(--ink-soft)",
                }}
              >
                <span className="tabular w-4 shrink-0 text-[var(--ink-faint)]">
                  {String.fromCharCode(97 + i)}.
                </span>
                <span className={revealed && correct ? "font-medium" : ""}>
                  {opt}
                </span>
                {revealed && correct && <span aria-hidden>✓</span>}
                {wrongPick && <span aria-hidden>✕</span>}
              </button>
            </li>
          );
        })}
      </ol>
      {revealed && (
        <div className="mt-4 border-l-2 border-[var(--rule-strong)] pl-4 text-[0.93rem] text-[var(--ink-soft)]">
          {explanation}
          <button
            onClick={() => setPicked(null)}
            className="sans ml-2 text-[var(--accent)] underline underline-offset-2"
          >
            reset
          </button>
        </div>
      )}
    </div>
  );
}
