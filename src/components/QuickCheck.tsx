"use client";

import { useRef, useState } from "react";

/**
 * A single multiple-choice check. Plain strings so lesson MDX stays readable,
 * with no JSX in the attributes. Props are unchanged from the original, so
 * lessons and the editor's Question button work as before.
 *
 * Flow: pick an option, press Check, read the result. Nothing is revealed
 * until Check is pressed, so the reader cannot see the answer just by
 * clicking through the options.
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
  const [checked, setChecked] = useState(false);

  const correct = checked && picked === answer;
  const letter = (i: number) => String.fromCharCode(65 + i);

  // A radiogroup is expected to move selection with the arrow keys, with only
  // the chosen option in the tab order (a "roving tabindex"). Without this the
  // keyboard lands on every option in turn and arrows do nothing.
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pickAndFocus = (i: number) => {
    const n = ((i % options.length) + options.length) % options.length;
    setPicked(n);
    optionRefs.current[n]?.focus();
  };
  const onOptionKey = (e: React.KeyboardEvent, i: number) => {
    if (checked) return;
    // move relative to the focused option (i), so one arrow press always steps
    // to a neighbour even when nothing is selected yet
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      pickAndFocus(i + 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      pickAndFocus(i - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      pickAndFocus(0);
    } else if (e.key === "End") {
      e.preventDefault();
      pickAndFocus(options.length - 1);
    }
  };

  return (
    <section className="my-8 border border-[var(--rule-strong)] p-4 sm:p-5">
      <p className="sans text-sm font-semibold text-[var(--ink-strong)]">Quick check</p>
      <p className="mt-2 text-[var(--ink)]">{question}</p>

      <div role="radiogroup" aria-label="Answers" className="mt-4 grid gap-2">
        {options.map((opt, i) => {
          const isPicked = picked === i;
          const isAnswer = checked && i === answer;
          const isWrongPick = checked && isPicked && i !== answer;
          const border = isAnswer
            ? "var(--ok)"
            : isWrongPick
            ? "var(--bad)"
            : isPicked
            ? "var(--ink-strong)"
            : "var(--rule-strong)";
          return (
            <button
              key={i}
              ref={(el) => {
                optionRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isPicked}
              // roving tabindex: one stop into the group, then arrows move within
              tabIndex={isPicked || (picked === null && i === 0) ? 0 : -1}
              disabled={checked}
              onClick={() => setPicked(i)}
              onKeyDown={(e) => onOptionKey(e, i)}
              className="sans flex w-full items-center gap-3 border bg-transparent px-3 py-2.5 text-left text-[0.95rem] text-[var(--ink)] transition-colors hover:bg-[var(--paper-2)] disabled:cursor-default disabled:hover:bg-transparent"
              style={{ borderColor: border }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
                style={{
                  borderColor: border,
                  background: isPicked ? border : "transparent",
                  color: isPicked ? "var(--paper)" : "var(--ink-soft)",
                }}
                aria-hidden
              >
                {letter(i)}
              </span>
              <span className="min-w-0 flex-1">{opt}</span>
              {isAnswer && (
                <span className="sans text-sm font-semibold text-[var(--ok)]">Correct</span>
              )}
              {isWrongPick && (
                <span className="sans text-sm font-semibold text-[var(--bad)]">Not this one</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!checked ? (
          <>
            <button
              type="button"
              className="btn sans"
              disabled={picked === null}
              onClick={() => setChecked(true)}
            >
              Check answer
            </button>
            {picked === null && (
              <span className="sans text-sm text-[var(--ink-soft)]">Pick one option first.</span>
            )}
          </>
        ) : (
          <button
            type="button"
            className="btn-plain sans"
            onClick={() => {
              setChecked(false);
              setPicked(null);
            }}
          >
            Try again
          </button>
        )}
      </div>

      {checked && (
        <div
          className="mt-4 border-l-2 pl-4 text-[0.95rem] text-[var(--ink-soft)]"
          style={{ borderColor: correct ? "var(--ok)" : "var(--bad)" }}
        >
          <p
            className="sans mb-1 text-sm font-semibold"
            style={{ color: correct ? "var(--ok)" : "var(--bad)" }}
          >
            {correct ? "That's right." : `Not quite. The answer is ${letter(answer)}.`}
          </p>
          {explanation}
        </div>
      )}

      {/* on paper nothing can be clicked, so the answer is printed instead */}
      <p className="sans mt-3 hidden text-[0.85rem] text-[var(--ink-soft)] print:block">
        <span className="font-medium text-[var(--ink-strong)]">Answer: {letter(answer)}.</span>{" "}
        {explanation}
      </p>
    </section>
  );
}
