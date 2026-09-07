"use client";

import { useState } from "react";
import { DIFFICULTY_COLOR, Difficulty } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";

export interface SolverProps {
  id: string; // progress id, prefixed "np-" by convention
  number?: number;
  title: string;
  difficulty: Difficulty;
  statement: React.ReactNode;
  answer: number;
  unit?: string;
  tolerancePct?: number; // default 2%
  hint?: React.ReactNode;
  solution: React.ReactNode;
}

export default function ProblemSolver({
  id,
  number,
  title,
  difficulty,
  statement,
  answer,
  unit,
  tolerancePct = 2,
  hint,
  solution,
}: SolverProps) {
  const { problems, setProblem } = useProgress();
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const solved = problems[id] === "solved" || problems[id] === "reviewed";

  const check = () => {
    const val = parseFloat(input.replace(/,/g, ""));
    if (Number.isNaN(val)) return;
    const ok = Math.abs(val - answer) <= (Math.abs(answer) * tolerancePct) / 100;
    setAttempts((a) => a + 1);
    setFeedback(ok ? "correct" : "wrong");
    if (ok && !solved) setProblem(id, "solved");
  };

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] bg-[var(--panel-2)] px-5 py-3">
        <span className="text-sm font-semibold text-[var(--text-strong)]">
          {number != null ? `Problem ${number}: ` : ""}
          {title}
        </span>
        <span
          className="rounded-full border px-2 py-0.5 text-[0.7rem] font-medium"
          style={{
            color: DIFFICULTY_COLOR[difficulty],
            borderColor: `color-mix(in srgb, ${DIFFICULTY_COLOR[difficulty]} 40%, transparent)`,
          }}
        >
          {difficulty}
        </span>
        {solved && (
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--status-complete)]">
            ✓ Solved
          </span>
        )}
      </div>

      <div className="px-5 py-4">
        <div className="prose-phys text-[0.95rem]">{statement}</div>

        {/* answer row */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setFeedback(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="Your answer"
            className="w-36 rounded-lg border border-[var(--line-bright)] px-3 py-1.5 text-sm outline-none transition-colors focus:border-[var(--link)]"
            style={
              feedback === "correct"
                ? { borderColor: "var(--status-complete)", background: "#f0fdf4" }
                : feedback === "wrong"
                ? { borderColor: "var(--diff-insane)", background: "#fef2f2" }
                : undefined
            }
          />
          {unit && <span className="text-sm text-[var(--text-dim)]">{unit}</span>}
          <button
            onClick={check}
            className="rounded-lg bg-[var(--link)] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-800"
          >
            Check
          </button>
          {feedback === "correct" && (
            <span className="text-sm font-medium text-[var(--status-complete)]">
              Correct!
            </span>
          )}
          {feedback === "wrong" && (
            <span className="text-sm text-[var(--diff-insane)]">
              Not quite{attempts >= 2 && !showHint && hint ? ", try the hint" : ""}.
            </span>
          )}
        </div>

        {/* hint + solution controls */}
        <div className="mt-3 flex gap-4 text-sm">
          {hint && (
            <button
              onClick={() => setShowHint((v) => !v)}
              className="text-[var(--link)] hover:underline"
            >
              {showHint ? "Hide hint" : "Hint"}
            </button>
          )}
          <button
            onClick={() => setShowSolution((v) => !v)}
            className="text-[var(--link)] hover:underline"
          >
            {showSolution ? "Hide solution" : "Show solution"}
          </button>
        </div>

        {showHint && hint && (
          <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-4 py-3 text-sm text-[var(--text-dim)]">
            {hint}
          </div>
        )}

        {showSolution && (
          <div className="prose-phys mt-3 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-4 py-3 text-[0.92rem]">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">
              Solution
            </div>
            {solution}
            {!solved && (
              <button
                onClick={() => setProblem(id, "reviewed")}
                className="mt-2 text-sm text-[var(--link)] hover:underline"
              >
                Mark as reviewed
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
