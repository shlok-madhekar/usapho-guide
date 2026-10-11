"use client";

import { useEffect } from "react";

/**
 * Saves the lesson as a PDF through the browser's own print pipeline.
 *
 * Printing keeps text, KaTeX and figures as real vector text (selectable,
 * sharp at any zoom) where a canvas screenshot library would rasterise the
 * page. The print stylesheet in globals.css strips the site chrome and lays
 * the lesson out as a document; this component only handles the parts CSS
 * cannot: a sensible default filename and a light palette for the canvas
 * simulations, which paint their colours rather than inheriting them.
 *
 * The listeners are on beforeprint/afterprint, so Cmd/Ctrl+P on a lesson gets
 * the same treatment as the button.
 */
export default function ExportPdfButton({ title }: { title: string }) {
  useEffect(() => {
    const root = document.documentElement;
    let savedTheme: string | null = null;
    let savedTitle: string | null = null;

    const before = () => {
      if (savedTitle !== null) return; // already set up for this print
      savedTitle = document.title;
      document.title = `${title} - USAPhO Guide`;
      const theme = root.getAttribute("data-theme");
      if (theme === "dark") {
        savedTheme = theme;
        // not persisted: the reader's choice comes back after printing
        root.setAttribute("data-theme", "light");
      }
    };
    const after = () => {
      if (savedTitle !== null) document.title = savedTitle;
      if (savedTheme) root.setAttribute("data-theme", savedTheme);
      savedTitle = savedTheme = null;
    };

    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, [title]);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="sans inline-flex items-center gap-1.5 text-xs text-[var(--ink-soft)] transition-colors hover:text-[var(--ink-strong)] print:hidden"
      title="Save this lesson as a PDF"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
      Export PDF
    </button>
  );
}
