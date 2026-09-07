"use client";

import { DIFFICULTY_COLOR, Problem } from "@/lib/curriculum";
import { ProblemStatus, useProgress } from "@/lib/progress";

const STATUS_META: Record<ProblemStatus, { label: string; color: string; fill: boolean }> = {
  none: { label: "Not attempted", color: "var(--line-bright)", fill: false },
  attempted: { label: "Attempted", color: "var(--status-practicing)", fill: false },
  solved: { label: "Solved", color: "var(--status-complete)", fill: true },
  reviewed: { label: "Reviewed", color: "var(--teal)", fill: true },
};

function StatusDot({ status, onClick }: { status: ProblemStatus; onClick: () => void }) {
  const m = STATUS_META[status];
  return (
    <button
      onClick={onClick}
      title={`${m.label} (click to cycle)`}
      className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
    >
      <span
        className="flex h-4.5 w-4.5 h-[18px] w-[18px] items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all"
        style={{
          borderColor: m.color,
          background: m.fill ? m.color : "transparent",
          color: "var(--void)",
        }}
      >
        {status === "solved" && "✓"}
        {status === "reviewed" && "★"}
        {status === "attempted" && (
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
        )}
      </span>
    </button>
  );
}

export default function ProblemTable({ problems }: { problems: Problem[] }) {
  const { problems: statuses, cycleProblem } = useProgress();
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--line)] bg-[var(--panel-2)] text-left text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
            <th className="px-4 py-3 font-normal">Status</th>
            <th className="px-2 py-3 font-normal">Source</th>
            <th className="px-2 py-3 font-normal">Problem</th>
            <th className="px-2 py-3 font-normal">Difficulty</th>
            <th className="hidden px-4 py-3 font-normal md:table-cell">Tags</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((p) => (
            <tr
              key={p.id}
              className="border-b border-[var(--line)] last:border-0 transition-colors hover:bg-[color:var(--panel-2)]/60"
            >
              <td className="px-4 py-2.5">
                <StatusDot
                  status={statuses[p.id] ?? "none"}
                  onClick={() => cycleProblem(p.id)}
                />
              </td>
              <td className="whitespace-nowrap px-2 py-2.5 text-xs text-[var(--text-dim)]">
                {p.source}
              </td>
              <td className="px-2 py-2.5 text-[var(--text)]">
                {p.starred && (
                  <span className="mr-1.5 text-[var(--brass)]" title="Essential problem">
                    ★
                  </span>
                )}
                {p.name}
              </td>
              <td className="whitespace-nowrap px-2 py-2.5">
                <span
                  className="rounded-full border px-2 py-0.5 text-[0.7rem] font-medium"
                  style={{
                    color: DIFFICULTY_COLOR[p.difficulty],
                    borderColor: "color-mix(in srgb, " + DIFFICULTY_COLOR[p.difficulty] + " 40%, transparent)",
                  }}
                >
                  {p.difficulty}
                </span>
              </td>
              <td className="hidden px-4 py-2.5 md:table-cell">
                <span className="flex flex-wrap gap-1.5">
                  {p.tags?.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-[var(--panel-2)] px-1.5 py-0.5 text-[0.7rem] text-[var(--text-dim)]"
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
