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
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-dim)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--text-strong)]"
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
        className="rounded-lg border border-[var(--line-bright)] px-3 py-1.5 text-sm text-[var(--text)] transition-colors hover:bg-[var(--panel-2)]"
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
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--link)] text-sm font-semibold text-white"
        aria-label="Account menu"
      >
        {initial}
      </button>
      {open && (
        <div className="panel absolute right-0 top-full z-40 mt-2 w-60 p-1 shadow-lg">
          <div className="border-b border-[var(--line)] px-3 py-2">
            <div className="truncate text-sm font-medium text-[var(--text-strong)]">
              {name}
            </div>
            <div className="truncate text-xs text-[var(--text-dim)]">
              {profile?.email}
            </div>
            {profile?.roles.length ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {profile.roles.map((r) => (
                  <span
                    key={r}
                    className="rounded bg-[var(--panel-2)] px-1.5 py-0.5 text-[0.65rem] font-medium text-[var(--text-dim)]"
                  >
                    {ROLE_LABEL[r]}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-1 text-xs text-[var(--ink-faint)]">Reader</div>
            )}
          </div>
          {(canEditLessons(profile) || canEditProblems(profile)) && (
            <Link
              href="/edit"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--panel-2)]"
            >
              Content editor
            </Link>
          )}
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--panel-2)]"
          >
            Account
          </Link>
          <button
            onClick={() => {
              signOut();
              setOpen(false);
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-dim)] hover:bg-[var(--panel-2)]"
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
    { href: "/guide", label: "Guide" },
    { href: "/progress", label: "My Progress" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color:var(--void)]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[17px] font-bold text-[var(--text-strong)]"
        >
          <Logo />
          USAPhO <span className="-ml-1 text-[var(--link)]">Guide</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm sm:gap-5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`link-underline hidden sm:inline ${
                pathname.startsWith(l.href)
                  ? "font-medium text-[var(--text-strong)]"
                  : "text-[var(--text-dim)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {ready && done > 0 && (
            <span className="font-mono-num hidden rounded border border-[var(--line)] bg-[var(--panel-2)] px-2 py-0.5 text-xs text-[var(--text-dim)] md:inline-block">
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
