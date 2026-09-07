"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import { allModules } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { ROLE_LABEL, canEditLessons, canEditProblems } from "@/lib/roles";

function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
      className="flex h-7 w-7 items-center justify-center text-[var(--ink-faint)] transition-colors hover:text-[var(--ink-strong)]"
    >
      {resolved === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

function AccountMenu() {
  const { ready, configured, session, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!configured) return null;
  if (!ready) return <span className="h-8 w-16" />;

  if (!session) {
    return (
      <Link
        href="/login"
        className="sans text-sm text-[var(--ink-soft)] hover:text-[var(--ink-strong)]"
      >
        Sign in
      </Link>
    );
  }

  const name = profile?.display_name || profile?.email?.split("@")[0] || "Account";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="sans flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ink-strong)] text-xs font-semibold text-[var(--paper)]"
        aria-label="Account menu"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-60 border border-[var(--rule-strong)] bg-[var(--panel)] py-1">
          <div className="border-b border-[var(--rule)] px-3 py-2">
            <div className="sans truncate text-sm font-medium text-[var(--ink-strong)]">
              {name}
            </div>
            <div className="sans truncate text-xs text-[var(--ink-soft)]">
              {profile?.email}
            </div>
            {profile?.roles.length ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {profile.roles.map((r) => (
                  <span
                    key={r}
                    className="label"
                  >
                    {ROLE_LABEL[r]}
                  </span>
                ))}
              </div>
            ) : (
              <div className="sans mt-1 text-xs text-[var(--ink-faint)]">Reader</div>
            )}
          </div>
          {(canEditLessons(profile) || canEditProblems(profile)) && (
            <Link
              href="/edit"
              onClick={() => setOpen(false)}
              className="sans block px-3 py-1.5 text-sm text-[var(--ink)] hover:bg-[var(--paper-2)]"
            >
              Content editor
            </Link>
          )}
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="sans block px-3 py-1.5 text-sm text-[var(--ink)] hover:bg-[var(--paper-2)]"
          >
            Account
          </Link>
          <button
            onClick={() => {
              signOut();
              setOpen(false);
            }}
            className="sans block w-full px-3 py-1.5 text-left text-sm text-[var(--ink-soft)] hover:bg-[var(--paper-2)]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const { modules, ready } = useProgress();
  const total = allModules().length;
  const done = allModules().filter(
    (m) => modules[m.module.slug] === "complete"
  ).length;

  const links = [
    { href: "/guide", label: "Course" },
    { href: "/problems", label: "Problems" },
    { href: "/progress", label: "Progress" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--rule)] bg-[color:var(--paper)]/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight text-[var(--ink-strong)]"
        >
          <Logo />
          USAPhO <span className="-ml-1 font-normal italic text-[var(--ink-soft)]">Guide</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm sm:gap-5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`sans hidden text-sm sm:inline ${
                pathname.startsWith(l.href)
                  ? "font-medium text-[var(--ink-strong)]"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {ready && done > 0 && (
            <span className="tabular sans hidden text-xs text-[var(--ink-faint)] md:inline">
              {done}/{total}
            </span>
          )}
          <ThemeToggle />
          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}
