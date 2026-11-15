"use client";

import Link from "next/link";
import { allModules } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";

/**
 * For a returning reader: a link back to the lesson they were last working
 * through. Nothing is shown to a new reader, or once every started lesson is
 * marked complete.
 */
export default function ContinueReading() {
  const { modules, ready } = useProgress();
  if (!ready) return null;

  const all = allModules();
  // the first lesson in course order that is underway, else the first one
  // after the furthest lesson they finished
  const underway = all.find(({ module }) =>
    ["reading", "practicing"].includes(modules[module.slug] ?? "")
  );
  let next = underway;
  if (!next) {
    let last = -1;
    all.forEach(({ module }, i) => {
      if (modules[module.slug] === "complete") last = i;
    });
    if (last === -1) return null;
    next = all
      .slice(last + 1)
      .find(({ module }) => !["complete", "skipped"].includes(modules[module.slug] ?? ""));
  }
  if (!next) return null;

  return (
    <p className="sans mt-5 text-[0.95em]">
      <span className="text-[var(--ink-soft)]">
        {underway ? "Pick up where you left off:" : "Up next for you:"}
      </span>{" "}
      <Link prefetch={false} href={`/guide/${next.module.slug}`} className="link font-medium">
        {next.module.title}
      </Link>
    </p>
  );
}
