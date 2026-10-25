"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { useEffect, useRef, useState } from "react";
import { allModules } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { ROLE_LABEL } from "@/lib/roles";

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
          <Link
            href="/edit"
            onClick={() => setOpen(false)}
            className="sans block px-3 py-1.5 text-sm text-[var(--ink)] hover:bg-[var(--paper-2)]"
          >
            Write for the guide
          </Link>
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

/**
 * The header links are hidden below the sm breakpoint to fit the logo, which
 * left phones with no way to reach the course or the problem bank except the
 * home page. This menu carries the same links there.
 */
function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative sm:hidden" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex h-7 w-7 items-center justify-center text-[var(--ink-soft)] hover:text-[var(--ink-strong)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-48 border border-[var(--rule-strong)] bg-[var(--panel)] py-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`sans block px-3 py-2 text-sm hover:bg-[var(--paper-2)] ${
                pathname.startsWith(l.href)
                  ? "font-medium text-[var(--ink-strong)]"
                  : "text-[var(--ink)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
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
    { href: "/edit", label: "Contribute" },
    { href: "/contributors", label: "Contributors" },
  ];
  const external = [
    { href: "https://github.com/shlok-madhekar/usapho-guide", label: "GitHub" },
  ];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-[var(--rule)] bg-[color:var(--paper)]/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="sans flex items-center gap-2 text-[16px] font-semibold text-[var(--ink-strong)]"
        >
          <Logo />
          USAPhO Guide
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
          {external.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="sans hidden text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] lg:inline"
            >
              {l.label}
            </a>
          ))}
          {ready && done > 0 && (
            <span className="tabular sans hidden text-xs text-[var(--ink-faint)] md:inline">
              {done}/{total}
            </span>
          )}
          <ThemeToggle />
          <AccountMenu />
          <MobileMenu links={links} />
        </nav>
      </div>
    </header>
  );
}
