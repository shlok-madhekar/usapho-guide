"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { search, type SearchEntry, type SearchResult } from "@/lib/search";

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
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

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
    loadIndex()
      .then((data) => {
        setIndex(data);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, [open, index]);

  const results = useMemo(() => (index ? search(index, query) : []), [index, query]);
  useEffect(() => setActive(0), [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const go = (href: string) => {
    close();
    router.push(href);
  };
  const problemsHref = `/problems?q=${encodeURIComponent(query.trim())}`;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) go(hrefFor(results[active]));
      else if (query.trim()) go(problemsHref);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search lessons"
        title="Search lessons (/)"
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
              aria-label="Search lessons"
              className="mx-auto max-w-xl border border-[var(--rule-strong)] bg-[var(--panel)] shadow-xl"
              onKeyDown={onKeyDown}
            >
              <input
                ref={input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lessons, e.g. gauss, rolling, doppler"
                aria-label="Search lessons"
                aria-controls="search-results"
                aria-activedescendant={results[active] ? `search-result-${active}` : undefined}
                className="sans w-full border-b border-[var(--rule)] bg-transparent px-4 py-3 text-[15px] text-[var(--ink-strong)] outline-none placeholder:text-[var(--ink-faint)]"
              />

              {failed ? (
                <p className="sans px-4 py-6 text-sm text-[var(--ink-soft)]">
                  Search could not load. Close and try again.
                </p>
              ) : !index && query ? (
                <p className="sans px-4 py-6 text-sm text-[var(--ink-soft)]">Loading…</p>
              ) : query.trim() && results.length === 0 ? (
                <p className="sans px-4 py-6 text-sm text-[var(--ink-soft)]">
                  No lesson matches &ldquo;{query.trim()}&rdquo;.
                </p>
              ) : (
                <ul id="search-results" role="listbox" className="max-h-[60vh] overflow-y-auto">
                  {results.map((r, i) => (
                    <li
                      key={r.entry.slug}
                      id={`search-result-${i}`}
                      role="option"
                      aria-selected={i === active}
                    >
                      <Link
                        href={hrefFor(r)}
                        onClick={close}
                        onMouseMove={() => setActive(i)}
                        className={`block border-b border-[var(--rule)] px-4 py-2.5 ${
                          i === active ? "bg-[var(--paper-2)]" : ""
                        }`}
                      >
                        <span className="sans block text-[0.95rem] font-semibold text-[var(--ink-strong)]">
                          {r.entry.title}
                        </span>
                        {r.heading && (
                          <span className="sans block text-sm text-[var(--accent)]">
                            {r.heading.text}
                          </span>
                        )}
                        <span className="sans block text-xs text-[var(--ink-faint)]">
                          {r.entry.course} &middot; {r.entry.section}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {query.trim() && (
                <Link
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
