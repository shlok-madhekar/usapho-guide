"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { allModules } from "@/lib/curriculum";

const words = (s: string) =>
  s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);

/**
 * On a 404 under /guide, the address usually names a topic: an old slug
 * (/guide/circuits) or a typo (/guide/gauss-laws). Offer the modules whose
 * slug or title shares the most words with it.
 */
export default function NearestModules() {
  const pathname = usePathname() ?? "";
  const asked = pathname.startsWith("/guide/")
    ? words(decodeURIComponent(pathname.slice("/guide/".length)))
    : [];
  if (asked.length === 0) return null;

  const matches = allModules()
    .map(({ module }) => {
      const have = words(`${module.slug} ${module.title}`);
      // a shared prefix catches plurals and partial words: "law" ~ "laws"
      const score = asked.filter((a) =>
        have.some((h) => h.startsWith(a) || a.startsWith(h))
      ).length;
      return { module, score };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
  // "gauss-laws" shares "law" with half the course; keep only the best fits
  const best = matches[0]?.score ?? 0;
  const shown = matches.filter((m) => m.score === best).slice(0, 4);
  if (shown.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="label border-b border-[var(--rule-strong)] pb-1.5">
        Did you mean
      </h2>
      <ul>
        {shown.map(({ module }) => (
          <li key={module.slug} className="border-b border-[var(--rule)] py-3">
            <Link
              href={`/guide/${module.slug}`}
              className="sans text-[0.95rem] font-semibold text-[var(--ink-strong)] hover:text-[var(--accent)]"
            >
              {module.title}
            </Link>
            <p className="sans mt-0.5 text-xs text-[var(--ink-soft)]">
              {module.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
