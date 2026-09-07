"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { usePathname } from "next/navigation";
import { allModules } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";

export default function Nav() {
  const pathname = usePathname();
  const { modules, ready } = useProgress();
  const total = allModules().length;
  const done = allModules().filter(
    (m) => modules[m.module.slug] === "complete"
  ).length;

  const links = [
    { href: "/guide", label: "Guide" },
    { href: "/studio", label: "Video Lab" },
    { href: "/progress", label: "My Progress" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[17px] font-bold text-[var(--text-strong)]"
        >
          <Logo />
          USAPhO <span className="-ml-1 text-[var(--link)]">Guide</span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`link-underline ${
                pathname.startsWith(l.href)
                  ? "font-medium text-[var(--text-strong)]"
                  : "text-[var(--text-dim)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {ready && done > 0 && (
            <span className="font-mono-num hidden rounded border border-[var(--line)] bg-[var(--panel-2)] px-2 py-0.5 text-xs text-[var(--text-dim)] sm:inline-block">
              {done}/{total}
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
