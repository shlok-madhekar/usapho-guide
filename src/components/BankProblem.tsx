"use client";

import { useState } from "react";
import { K, Markish } from "@/components/Katex";
import { useProgress } from "@/lib/progress";
import {
  BankProblem as Problem,
  DIFFICULTY_VAR,
  ORIGIN_LABEL,
  isSolvable,
} from "@/lib/problem-types";

/**
 * Accepts the ways people actually write numbers: 3.75e10, 3.75E10,
 * 3.75x10^10, 3.75 × 10^10, and thousands separators.
 */
function parseAnswer(raw: string): number | null {
  const text = raw.trim().replace(/,/g, "").replace(/\s+/g, "");
  if (!text) return null;

  const sci = text.match(/^([+-]?\d*\.?\d+)[x×*]10\^?([+-]?\d+)$/i);
  if (sci) return Number(sci[1]) * Math.pow(10, Number(sci[2]));

  const val = Number(text);
  return Number.isFinite(val) ? val : null;
}

function Meta({ p }: { p: Problem }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span
        className="label"
        style={{ color: DIFFICULTY_VAR[p.difficulty] }}
      >
        {p.difficulty}
      </span>
      <span className="label">{ORIGIN_LABEL[p.origin]}</span>
      {p.origin !== "original" && (
        <cite className="sans text-xs not-italic text-[var(--ink-soft)]">
          {p.source}
        </cite>
      )}
      {p.tags.map((t) => (
        <span key={t} className="sans text-xs text-[var(--ink-faint)]">
          {t}
        </span>
      ))}
    </div>
  );
}

/**
 * One problem in the bank. Problems written for this guide are solvable in
 * place; past-exam problems are cited and linked rather than reproduced.
 */
export default function BankProblem({
  problem: p,
  index,
}: {
  problem: Problem;
  index?: number;
}) {
  const { problems, setProblem } = useProgress();
  const status = problems[p.id] ?? "none";
  const solved = status === "solved" || status === "reviewed";

  const [input, setInput] = useState("");
  const [verdict, setVerdict] = useState<"right" | "wrong" | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const check = () => {
    const val = parseAnswer(input);
    if (val === null || p.answer === null) return;
    // 2% relative, with an absolute floor so answers of exactly zero are not
    // judged against a zero-width window
    const tolerance = Math.max(Math.abs(p.answer) * 0.02, 1e-9);
    const ok = Math.abs(val - p.answer) <= tolerance;
    setVerdict(ok ? "right" : "wrong");
    if (ok && !solved) setProblem(p.id, "solved");
  };

  return (
    <article className="border-t border-[var(--rule)] py-6 first:border-t-0">
      <header className="flex items-baseline gap-3">
        {index != null && (
          <span className="tabular sans shrink-0 text-sm text-[var(--ink-faint)]">
            {index}.
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-[1.05rem] font-semibold text-[var(--ink-strong)]">
            {p.name}
            {p.starred && (
              <span
                title="Start with this one"
                className="ml-1.5 text-[var(--accent)]"
              >
                ★
              </span>
            )}
          </h3>
          <div className="mt-1">
            <Meta p={p} />
          </div>
        </div>
        {solved && (
          <span className="sans shrink-0 text-xs font-medium text-[var(--ok)]">
            {status === "reviewed" ? "Reviewed" : "Solved"}
          </span>
        )}
      </header>

      {isSolvable(p) ? (
        <div className="mt-3">
          <div className="prose max-w-none text-[0.97rem]">
            <Markish text={p.statement} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setVerdict(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && check()}
              placeholder="Answer"
              title="Scientific notation is fine: 3.75e10 or 3.75x10^10"
              className="w-32"
              style={
                verdict === "right"
                  ? { borderColor: "var(--ok)", background: "var(--ok-bg)" }
                  : verdict === "wrong"
                  ? { borderColor: "var(--bad)", background: "var(--bad-bg)" }
                  : undefined
              }
            />
            {p.unit && (
              <span className="sans text-sm text-[var(--ink-soft)]">{p.unit}</span>
            )}
            <button onClick={check} className="btn">
              Check
            </button>
            {verdict === "right" && (
              <span className="sans text-sm font-medium text-[var(--ok)]">
                Correct
              </span>
            )}
            {verdict === "wrong" && (
              <span className="sans text-sm text-[var(--bad)]">Not that</span>
            )}
            <button
              onClick={() => setShowSolution((v) => !v)}
              className="sans ml-auto text-sm text-[var(--accent)] underline underline-offset-2"
            >
              {showSolution ? "Hide solution" : "Solution"}
            </button>
          </div>

          {showSolution && (
            <div className="aside mt-4">
              <span className="aside-label">Solution</span>
              <div className="prose max-w-none text-[0.95rem]">
                <Markish text={p.solution} />
              </div>
              {!solved && (
                <button
                  onClick={() => setProblem(p.id, "reviewed")}
                  className="sans mt-2 text-sm text-[var(--accent)] underline underline-offset-2"
                >
                  Mark as reviewed
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-[0.95rem] text-[var(--ink-soft)]">
            Official exam text is not reproduced here.{" "}
            {p.url ? (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                Read it on the official exam archive
              </a>
            ) : (
              <>Find it in {p.source}.</>
            )}
          </p>
          <button
            onClick={() =>
              setProblem(p.id, solved ? "none" : "solved")
            }
            className="btn-plain sans ml-auto text-xs"
          >
            {solved ? "Unmark" : "Mark solved"}
          </button>
        </div>
      )}
    </article>
  );
}

export { K };
