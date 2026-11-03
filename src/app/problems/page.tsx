"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import BankProblem from "@/components/BankProblem";
import { DIVISIONS, allModules, Difficulty } from "@/lib/curriculum";
import {
  DIFFICULTY_ORDER,
  type BankProblem as BankProblemT,
  type Origin,
  isSolvable,
} from "@/lib/problem-types";
import { TOTAL_PROBLEMS, TOTAL_SOLVABLE } from "@/lib/problem-counts";
import { useProgress } from "@/lib/progress";

const FILTERS = ["all", "unsolved", "solved", "starred", "solvable"] as const;
type Filter = (typeof FILTERS)[number];

/**
 * Rendering every match at once puts tens of thousands of nodes on the page
 * and makes each filter click take seconds, so results come in pages.
 */
const PAGE_SIZE = 40;

const ORIGIN_FILTERS: { key: Origin | "any"; label: string }[] = [
  { key: "any", label: "All sources" },
  { key: "original", label: "Written here" },
  { key: "exam", label: "Past exams" },
  { key: "textbook", label: "Textbooks" },
];

/**
 * The bank needs full statements and solutions, which is megabytes once every
 * lesson is filled in. Fetching the static file keeps it out of the JavaScript
 * bundle and lets the browser cache it between visits.
 */
function useAllProblems() {
  const [problems, setProblems] = useState<BankProblemT[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/problems.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((data: BankProblemT[]) => live && setProblems(data))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  return { problems, failed };
}

export default function ProblemsPage() {
  const { problems: statuses } = useProgress();
  const { problems: ALL, failed } = useAllProblems();
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState<string>("any");
  const [difficulty, setDifficulty] = useState<Difficulty | "any">("any");
  const [origin, setOrigin] = useState<Origin | "any">("any");
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE_SIZE);

  // The filters live in the URL as well, so a filtered list can be shared or
  // bookmarked, Back returns to it, and the header search can hand over ?q=
  // even when the bank is already open.
  const written = useRef<string | null>(null);
  const [readUrl, setReadUrl] = useState(false);

  const applyUrl = useCallback((search: string) => {
    if (search === written.current) return; // our own write coming back
    written.current = search;
    const params = new URLSearchParams(search);
    const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
      const value = params.get(key);
      return allowed.find((a) => a === value) ?? fallback;
    };
    setQuery(params.get("q") ?? "");
    setDivision(pick("division", DIVISIONS.map((d) => d.id), "any"));
    setDifficulty(pick<Difficulty | "any">("difficulty", DIFFICULTY_ORDER, "any"));
    setOrigin(pick("origin", ORIGIN_FILTERS.map((o) => o.key), "any"));
    setFilter(pick("show", FILTERS, "all"));
    setReadUrl(true);
  }, []);

  useEffect(() => {
    // until the URL has been read, the filters are defaults and would erase it
    if (!readUrl) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query);
    if (division !== "any") params.set("division", division);
    if (difficulty !== "any") params.set("difficulty", difficulty);
    if (origin !== "any") params.set("origin", origin);
    if (filter !== "all") params.set("show", filter);
    const search = params.toString();
    if (search === written.current) return;
    written.current = search;
    // replaceState, not router.replace: no navigation per keystroke, and
    // Next keeps useSearchParams in step with it
    window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
  }, [readUrl, query, division, difficulty, origin, filter]);

  // any change to the filters starts the list again from the top
  useEffect(() => {
    setShown(PAGE_SIZE);
  }, [query, division, difficulty, origin, filter]);

  const moduleTitle = useMemo(() => {
    const map: Record<string, { title: string; division: string }> = {};
    for (const { module, division: d } of allModules())
      map[module.slug] = { title: module.title, division: d.id };
    return map;
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (ALL ?? []).filter((p) => {
      const status = statuses[p.id] ?? "none";
      const isSolved = status === "solved" || status === "reviewed";
      if (division !== "any" && moduleTitle[p.module]?.division !== division)
        return false;
      if (difficulty !== "any" && p.difficulty !== difficulty) return false;
      if (origin !== "any" && p.origin !== origin) return false;
      if (filter === "solved" && !isSolved) return false;
      if (filter === "unsolved" && isSolved) return false;
      if (filter === "starred" && !p.starred) return false;
      if (filter === "solvable" && !isSolvable(p)) return false;
      if (
        q &&
        !(
          p.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)) ||
          p.source.toLowerCase().includes(q) ||
          (moduleTitle[p.module]?.title ?? "").toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [ALL, query, division, difficulty, origin, filter, statuses, moduleTitle]);

  const page = useMemo(() => visible.slice(0, shown), [visible, shown]);

  const byModule = useMemo(() => {
    const groups = new Map<string, typeof visible>();
    for (const p of page) {
      const list = groups.get(p.module) ?? [];
      list.push(p);
      groups.set(p.module, list);
    }
    return Array.from(groups.entries());
  }, [page]);

  const solvedCount = Object.values(statuses).filter(
    (s) => s === "solved" || s === "reviewed"
  ).length;

  return (
    <>
      <Nav />
      <Suspense fallback={null}>
        <UrlParams onChange={applyUrl} />
      </Suspense>
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
        <h1 className="text-3xl font-bold text-[var(--ink-strong)]">
          Problems
        </h1>
        <p className="mt-3 max-w-[34rem] text-[var(--ink-soft)]">
          {TOTAL_SOLVABLE.toLocaleString("en-US")} problems you can check here, plus past exam
          problems with links to the official archive.
        </p>
        <p className="sans mt-3 text-sm text-[var(--ink-faint)]">
          {solvedCount} of {TOTAL_PROBLEMS} solved
        </p>

        {/* filters */}
        <div className="mt-8 space-y-3 border-y border-[var(--rule)] py-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, topic, tag or source"
            aria-label="Search problems"
            className="w-full"
          />
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Select
              label="Division"
              value={division}
              onChange={setDivision}
              options={[
                { key: "any", label: "All divisions" },
                ...DIVISIONS.map((d) => ({ key: d.id, label: d.name })),
              ]}
            />
            <Select
              label="Difficulty"
              value={difficulty}
              onChange={(v) => setDifficulty(v as Difficulty | "any")}
              options={[
                { key: "any", label: "Any difficulty" },
                ...DIFFICULTY_ORDER.map((d) => ({ key: d, label: d })),
              ]}
            />
            <Select
              label="Origin"
              value={origin}
              onChange={(v) => setOrigin(v as Origin | "any")}
              options={ORIGIN_FILTERS}
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {(
              [
                ["all", "All"],
                ["solvable", "Solvable here"],
                ["unsolved", "Unsolved"],
                ["solved", "Solved"],
                ["starred", "Starred"],
              ] as [Filter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`sans text-sm ${
                  filter === key
                    ? "font-medium text-[var(--ink-strong)] underline underline-offset-4"
                    : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {failed && (
          <div className="aside warn mt-8">
            <span className="aside-label">Could not load the problems</span>
            <p className="text-sm">Reload the page to try again.</p>
          </div>
        )}
        {!ALL && !failed && (
          <p className="mt-10 text-[var(--ink-soft)]">Loading problems.</p>
        )}
        {ALL && visible.length === 0 && (
          <p className="mt-10 text-[var(--ink-soft)]">
            Nothing matches those filters.
          </p>
        )}

        {ALL && visible.length > 0 && (
          <p className="sans mt-6 text-sm text-[var(--ink-faint)]">
            {visible.length} matching{" "}
            {visible.length === 1 ? "problem" : "problems"}
            {visible.length > shown && `, showing the first ${shown}`}
          </p>
        )}

        {byModule.map(([slug, list]) => (
          <section key={slug} className="mt-10">
            <h2 className="label border-b border-[var(--rule-strong)] pb-1.5">
              {moduleTitle[slug]?.title ?? slug}
            </h2>
            <div className="mt-1">
              {list.map((p: BankProblemT, i: number) => (
                <BankProblem key={p.id} problem={p} index={i + 1} />
              ))}
            </div>
          </section>
        ))}

        {ALL && visible.length > shown && (
          <button
            onClick={() => setShown((n) => n + PAGE_SIZE * 2)}
            className="btn-plain mt-8"
          >
            Show more
          </button>
        )}
      </main>
    </>
  );
}

/**
 * Reports the query string whenever it changes. Reading it suspends during
 * prerendering, so it sits in its own Suspense boundary and renders nothing,
 * leaving the rest of the page in the static HTML.
 */
function UrlParams({ onChange }: { onChange: (search: string) => void }) {
  const search = useSearchParams().toString();
  useEffect(() => onChange(search), [search, onChange]);
  return null;
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string }[];
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.key} value={o.key}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
