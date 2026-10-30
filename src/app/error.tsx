"use client";

import { useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

/**
 * Catches a render error in any page below the root layout, so a crash shows
 * the site's own page with a way out instead of a blank screen. The layout,
 * and so the header and theme, stay mounted.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // surface it for the browser console and any analytics, once per error
    console.error(error);
  }, [error]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
        <p className="label">Something broke</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--ink-strong)]">
          This page hit an error
        </h1>
        <p className="mt-4 text-[var(--ink-soft)]">
          The problem is on our side, not yours. Try again, and if it keeps
          happening, the source is on GitHub and you can report it there.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          <button onClick={reset} className="btn sans">
            Try again
          </button>
          <Link href="/" className="link sans text-sm">
            Go home
          </Link>
          <a
            href="https://github.com/shlok-madhekar/usapho-guide/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="link sans text-sm"
          >
            Report it
          </a>
        </div>
      </main>
    </>
  );
}
