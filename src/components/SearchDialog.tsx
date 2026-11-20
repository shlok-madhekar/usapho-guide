"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  search,
  searchProblems,
  type ProblemSearchEntry,
  type SearchEntry,
  type SearchResult,
} from "@/lib/search";

const hrefFor = (r: SearchResult) =>
  `/guide/${r.entry.slug}${r.heading?.id ? `#${r.heading.id}` : ""}`;

/** The index is fetched the first time anyone opens search, then kept. */
let cached: Promise<SearchEntry[]> | null = null;
const loadIndex = () =>
  (cached ??= fetch("/search-index.json")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("no index"))))
    .catch((e) => {
      cached = null; // let the next open try again
      throw e;
    }));

/**
 * Problem names load beside the lessons. If they fail, lesson search still
 * works; the problems simply do not appear.
 */
let cachedProblems: Promise<ProblemSearchEntry[]> | null = null;
const loadProblems = () =>
  (cachedProblems ??= fetch("/problem-search.json")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("no index"))))
    .catch(() => {
      cachedProblems = null;
      return [] as ProblemSearchEntry[];
    }));

/** A problem opens on its lesson's page, scrolled to its card. */
const problemHref = (p: ProblemSearchEntry) => `/guide/${p.module}#${p.id}`;

type Item =
  | { kind: "lesson"; href: string; result: SearchResult }
  | { kind: "problem"; href: string; problem: ProblemSearchEntry };

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/**
 * Search box for the header. Opens with the button, "/" or Cmd/Ctrl+K, and
 * finds lessons by title, section heading and description.
 */
export default function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [problemIndex, setProblemIndex] = useState<ProblemSearchEntry[]>([]);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((k === "k" && (e.metaKey || e.ctrlKey)) || (k === "/" && !typing(e.target))) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    if (index) return;
    loadProblems().then(setProblemIndex);
    loadIndex()
      .then((data) => {
        setIndex(data);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, [open, index]);

  const results = useMemo(() => (index ? search(index, query) : []), [index, query]);
  const problems = useMemo(
    () => (index ? searchProblems(problemIndex, query) : []),
    [index, problemIndex, query]
  );
  const lessonTitle = useMemo(
    () => new Map(index?.map((e) => [e.slug, e.title]) ?? []),
    [index]
  );
  // one list for the arrow keys: lessons first, then problems
  const items: Item[] = useMemo(
    () => [
      ...results.map((r) => ({ kind: "lesson" as const, href: hrefFor(r), result: r })),
      ...problems.map((p) => ({ kind: "problem" as const, href: problemHref(p), problem: p })),
    ],
    [results, problems]
  );
  useEffect(() => setActive(0), [query]);

  // arrow keys move the highlight, so keep it inside the scrolled list
  useEffect(() => {
    if (open)
      document.getElementById(`search-result-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const close = () => {
    setOpen(false);
    setQuery("");
    // hand focus back to the button that opened the dialog
    trigger.current?.focus();
  };
  const go = (href: string) => {
    close();
    router.push(href);
  };
  const problemsHref = `/problems?q=${encodeURIComponent(query.trim())}`;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close();
    // a modal keeps Tab inside it; the arrows already reach every result
    else if (e.key === "Tab") {
      e.preventDefault();
      input.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[active];
      // a problem is a full page load, so the browser scrolls to its card
      // and marks it with :target (a client-side push would not)
      if (item?.kind === "problem") {
        close();
        window.location.assign(item.href);
      } else if (item) go(item.href);
      else if (query.trim()) go(problemsHref);
    }
  };

  return (
    <>
      <button
        ref={trigger}
        onClick={() => setOpen(true)}
        aria-label="Search lessons and problems"
        title="Search lessons and problems (/)"
        className="sans flex h-7 items-center gap-2 text-[var(--ink-faint)] transition-colors hover:text-[var(--ink-strong)]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <kbd className="mono hidden rounded border border-[var(--rule)] px-1.5 text-[11px] lg:inline">
          /
        </kbd>
      </button>

      {/* portalled: the header's backdrop-blur would otherwise pin a fixed
          overlay to the header instead of the window */}
      {open &&
        createPortal(
          <div
            className="no-print fixed inset-0 z-50 bg-black/30 px-4 pt-[12vh]"
            onMouseDown={(e) => e.target === e.currentTarget && close()}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Search lessons and problems"
              className="mx-auto max-w-xl border border-[var(--rule-strong)] bg-[var(--panel)] shadow-xl"
              onKeyDown={onKeyDown}
            >
              <input
                ref={input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lessons and problems, e.g. gauss, rolling, doppler"
                role="combobox"
                aria-expanded={items.length > 0}
                aria-autocomplete="list"
                aria-label="Search lessons and problems"
                aria-controls="search-results"
                aria-activedescendant={items[active] ? `search-result-${active}` : undefined}
                className="sans w-full border-b border-[var(--rule)] bg-transparent px-4 py-3 text-[15px] text-[var(--ink-strong)] outline-none placeholder:text-[var(--ink-faint)]"
              />

              {/* announced as the results change; the list itself is not live */}
              <p role="status" className="sr-only">
                {index && query.trim()
                  ? items.length === 0
                    ? "Nothing found"
                    : [
                        results.length > 0 &&
                          `${results.length} ${results.length === 1 ? "lesson" : "lessons"}`,
                        problems.length > 0 &&
                          `${problems.length} ${problems.length === 1 ? "problem" : "problems"}`,
                      ]
                        .filter(Boolean)
                        .join(" and ") + " found"
                  : ""}
              </p>

              {failed ? (
                <p className="sans px-4 py-6 text-sm text-[var(--ink-soft)]">
                  Search could not load. Close and try again.
                </p>
              ) : !index && query ? (
                <p className="sans px-4 py-6 text-sm text-[var(--ink-soft)]">Loading…</p>
              ) : query.trim() && items.length === 0 ? (
                <p className="sans px-4 py-6 text-sm text-[var(--ink-soft)]">
                  No lesson or problem matches &ldquo;{query.trim()}&rdquo;.
                </p>
              ) : (
                <ul id="search-results" role="listbox" className="max-h-[60vh] overflow-y-auto">
                  {items.map((item, i) => {
                    const row = `block border-b border-[var(--rule)] px-4 py-2.5 ${
                      i === active ? "bg-[var(--paper-2)]" : ""
                    }`;
                    const first = item.kind === "problem" && items[i - 1]?.kind !== "problem";
                    return (
                      <li
                        key={item.href}
                        id={`search-result-${i}`}
                        role="option"
                        aria-selected={i === active}
                      >
                        {first && (
                          <span
                            aria-hidden
                            className="sans block border-b border-[var(--rule)] px-4 pb-1 pt-3 text-xs text-[var(--ink-soft)]"
                          >
                            Problems
                          </span>
                        )}
                        {item.kind === "lesson" ? (
                          <Link
                            prefetch={false}
                            href={item.href}
                            onClick={close}
                            onMouseMove={() => setActive(i)}
                            className={row}
                          >
                            <span className="sans block text-[0.95rem] font-semibold text-[var(--ink-strong)]">
                              {item.result.entry.title}
                            </span>
                            {item.result.heading && (
                              <span className="sans block text-sm text-[var(--accent)]">
                                {item.result.heading.text}
                              </span>
                            )}
                            <span className="sans block text-xs text-[var(--ink-faint)]">
                              {item.result.entry.course} &middot; {item.result.entry.section}
                            </span>
                          </Link>
                        ) : (
                          <a href={item.href} onClick={close} onMouseMove={() => setActive(i)} className={row}>
                            <span className="sans block text-[0.95rem] font-semibold text-[var(--ink-strong)]">
                              {item.problem.name}
                            </span>
                            <span className="sans block text-xs text-[var(--ink-faint)]">
                              {item.problem.difficulty} &middot; in{" "}
                              {lessonTitle.get(item.problem.module) ?? item.problem.module}
                            </span>
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {query.trim() && (
                <Link prefetch={false}
                  href={problemsHref}
                  onClick={close}
                  className="sans block px-4 py-2.5 text-sm text-[var(--ink-soft)] hover:text-[var(--accent)]"
                >
                  Search the problem bank for &ldquo;{query.trim()}&rdquo; &rarr;
                </Link>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
