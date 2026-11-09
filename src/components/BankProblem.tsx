"use client";

import { memo, useState } from "react";
import { K, Markish } from "@/components/Katex";
import { useProgress } from "@/lib/progress";
import {
  BankProblem as Problem,
  DIFFICULTY_MEANING,
  DIFFICULTY_VAR,
  ORIGIN_LABEL,
  isSolvable,
} from "@/lib/problem-types";

/** A plain decimal, or scientific notation written 3.75e10 or 3.75x10^10. */
function parseScalar(text: string): number | null {
  const sci = text.match(/^([+-]?\d*\.?\d+)[x×*]10\^?([+-]?\d+)$/i);
  if (sci) return Number(sci[1]) * Math.pow(10, Number(sci[2]));
  const val = Number(text);
  return Number.isFinite(val) ? val : null;
}

/**
 * Accepts the ways people actually write a physics answer: 3.75e10,
 * 3.75x10^10, thousands separators, a fraction like 3/4, and multiples of
 * pi like pi, 2pi, pi/2 or 3pi/4 (also written π). Returns null if it is not
 * one clean number, so a wrong-format entry is never read as a stray value.
 */
function parseAnswer(raw: string): number | null {
  const text = raw
    .trim()
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .replace(/π/g, "pi")
    // a pasted typographic minus, and LaTeX-style exponents: 10^{-3}
    .replace(/\u2212/g, "-")
    .replace(/[{}]/g, "");
  if (!text) return null;

  // a multiple of pi: [coef]pi[/denom], e.g. pi, -2pi, pi/2, 3pi/4
  const pi = text.match(/^([+-]?\d*\.?\d*)pi(?:\/(\d*\.?\d+))?$/i);
  if (pi) {
    const coef = pi[1] === "" || pi[1] === "+" ? 1 : pi[1] === "-" ? -1 : Number(pi[1]);
    const denom = pi[2] ? Number(pi[2]) : 1;
    if (Number.isFinite(coef) && denom !== 0) return (coef * Math.PI) / denom;
    return null;
  }

  // a plain fraction of two scalars, e.g. 3/4 or 1.5/2
  const frac = text.match(/^([+-]?\d*\.?\d+)\/(\d*\.?\d+)$/);
  if (frac) {
    const denom = Number(frac[2]);
    return denom !== 0 ? Number(frac[1]) / denom : null;
  }

  return parseScalar(text);
}

function Meta({ p }: { p: Problem }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span
        className="label cursor-help"
        style={{ color: DIFFICULTY_VAR[p.difficulty] }}
        title={DIFFICULTY_MEANING[p.difficulty]}
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

/** Unit spellings compared loosely: m/s² = m/s^2, μF = uF, Ω = ohm, N·m = Nm. */
const unitChars = (u: string) =>
  u
    .replace(/\s+/g, "")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/[µμ]/g, "u")
    .replace(/Ω/g, "ohm")
    .replace(/[·⋅*]/g, "");

const NO_UNIT = new Set(["", "unitless", "dimensionless"]);

/** The ways a reader might write the problem's unit. */
function unitSpellings(unit: string): string[] {
  const u = unitChars(unit);
  if (["deg", "degree", "degrees", "°"].includes(u)) return ["degrees", "degree", "deg", "°"];
  if (u === "%" || u === "percent") return ["percent", "%"];
  return [u];
}

/**
 * Reads an entry for a problem whose answer is in `unit`. A trailing unit is
 * fine when it is that unit ("12 m", "-25.3 nJ", "pi/2 rad"). Any other unit
 * is refused with a note rather than read as a bare number: "12 cm" for an
 * answer in m would otherwise be judged as 12 m and marked wrong.
 */
function readAnswer(raw: string, unit: string): { value: number } | { note: string } {
  const value = parseAnswer(raw);
  if (value !== null) return { value };

  if (!NO_UNIT.has(unit)) {
    const text = unitChars(raw);
    for (const spelling of unitSpellings(unit)) {
      if (text.length > spelling.length && text.endsWith(spelling)) {
        const number = parseAnswer(text.slice(0, -spelling.length));
        if (number !== null) return { value: number };
      }
    }
  }

  // a number followed by some other unit gets told which unit to use
  const split = raw.trim().match(/^(.*\d\.?)\s*([A-Za-zµμΩ°%].*)$/);
  if (split && parseAnswer(split[1]) !== null)
    return {
      note: NO_UNIT.has(unit)
        ? "This answer has no unit; enter just the number."
        : `Enter just the number, in ${unit}.`,
    };
  return { note: "Enter one number, like 3.75e10, 3/4 or pi/2." };
}

/**
 * One problem in the bank. Problems written for this guide are solvable in
 * place; past-exam problems are cited and linked rather than reproduced.
 */
function BankProblemInner({
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
  // why an entry could not be read; pressing Check used to do nothing at all
  const [note, setNote] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const check = () => {
    if (p.answer === null || !input.trim()) return;
    const read = readAnswer(input, p.unit);
    if ("note" in read) {
      setVerdict(null);
      setNote(read.note);
      return;
    }
    setNote(null);
    const val = read.value;
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

          <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
            <input
              type="text"
              // not inputMode="decimal": the iPhone decimal pad has no minus
              // sign and no "e", so negative and 3.75e10 answers could not be typed
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setVerdict(null);
                setNote(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && check()}
              placeholder="Answer"
              aria-label={p.unit ? `Answer in ${p.unit}` : "Answer"}
              title="You can enter 3.75e10, 3.75x10^10, a fraction like 3/4, or a multiple of pi like pi/2"
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
              <span className="sans text-[0.9rem] text-[var(--ink)]">{p.unit}</span>
            )}
            <button onClick={check} className="btn">
              Check
            </button>
            {/* a live region, so the verdict is announced as well as shown */}
            <span role="status" className="sans text-sm">
              {verdict === "right" && (
                <span className="font-medium text-[var(--ok)]">Correct</span>
              )}
              {verdict === "wrong" && <span className="text-[var(--bad)]">Not that</span>}
              {note && <span className="text-[var(--ink-soft)]">{note}</span>}
            </span>
            <button
              onClick={() => setShowSolution((v) => !v)}
              className="sans ml-auto text-sm text-[var(--accent)] underline underline-offset-2"
            >
              {showSolution ? "Hide solution" : "Solution"}
            </button>
          </div>

          {showSolution && (
            <div className="aside mt-4 print:hidden">
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
              <>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  {/* the page anchor (#page=3) leaves .pdf mid-string */}
                  {p.url.toLowerCase().includes(".pdf")
                    ? `Open the ${p.source} exam (PDF)`
                    : `Find ${p.source} on the AAPT past exams page`}
                </a>
                {p.solutionUrl && (
                  <>
                    {" · "}
                    <a
                      href={p.solutionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link"
                    >
                      official solution
                    </a>
                  </>
                )}
              </>
            ) : (
              <>Find it in {p.source}.</>
            )}
          </p>
          <button
            onClick={() =>
              setProblem(p.id, solved ? "none" : "solved")
            }
            className="btn-plain sans ml-auto text-xs print:hidden"
          >
            {solved ? "Unmark" : "Mark solved"}
          </button>
        </div>
      )}
    </article>
  );
}


/**
 * Filtering the bank re-renders the visible list; a problem whose data has
 * not changed does not need to be built again.
 */
const BankProblem = memo(BankProblemInner);
BankProblem.displayName = "BankProblem";

export default BankProblem;
export { K };
