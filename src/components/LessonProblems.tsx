"use client";

import { useState } from "react";
import BankProblem from "@/components/BankProblem";
import { useProgress } from "@/lib/progress";
import type { BankProblem as Problem } from "@/lib/problem-types";

/**
 * A lesson's solvable problems, with how many the reader has solved and a
 * switch to hide those, so coming back to a lesson with 30+ problems starts
 * at the ones still to do. Hidden cards stay mounted, keeping anything typed
 * into them, and still print.
 */
export default function LessonProblems({ problems }: { problems: Problem[] }) {
  const { problems: status, ready } = useProgress();
  const [hideSolved, setHideSolved] = useState(false);
  const isSolved = (id: string) => status[id] === "solved" || status[id] === "reviewed";
  const solved = problems.filter((p) => isSolved(p.id)).length;
  const allHidden = hideSolved && solved === problems.length;

  return (
    <>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-[var(--ink-soft)]">
        <p>Work these on paper, then check your answer here.</p>
        {ready && solved > 0 && (
          <p className="sans no-print ml-auto flex items-baseline gap-3">
            <span className="tabular">
              {solved} of {problems.length} solved
            </span>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={hideSolved}
                onChange={(e) => setHideSolved(e.target.checked)}
              />
              Hide solved
            </label>
          </p>
        )}
      </div>
      <div className="mt-4 border-t border-[var(--rule-strong)]">
        {problems.map((p, i) => (
          <div key={p.id} className={`border-t border-[var(--rule)] first:border-t-0 ${
              hideSolved && isSolved(p.id) ? "hidden print:block" : ""
            }`}>
            <BankProblem problem={p} index={i + 1} />
          </div>
        ))}
        {allHidden && (
          <p className="sans no-print py-6 text-sm text-[var(--ink-soft)]">
            You&apos;ve solved every problem in this lesson.
          </p>
        )}
      </div>
    </>
  );
}
