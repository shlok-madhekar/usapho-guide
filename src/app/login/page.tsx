"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { configured, session, signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (session) router.replace("/guide");
  }, [session, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        router.replace("/guide");
      } else {
        await signUp(email, password, displayName);
        setNotice(
          "Account created. If email confirmation is on, check your inbox, then sign in."
        );
        setMode("signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-md px-5 pb-24 pt-16">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-strong)]">
          {mode === "signin" ? "Sign in" : "Create an account"}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-dim)]">
          An account syncs nothing by itself. It exists so contributors can be
          granted writer roles and edit the guide.
        </p>

        {!configured ? (
          <div className="callout warn mt-6">
            <div className="callout-label">Auth not configured</div>
            <p className="text-sm">
              Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
              <code>.env.local</code>, then restart the dev server. See{" "}
              <code>SETUP.md</code>.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="panel mt-6 space-y-4 p-5">
            {mode === "signup" && (
              <label className="block">
                <span className="text-sm font-medium text-[var(--text-strong)]">
                  Display name
                </span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-[var(--line-bright)] px-3 py-2 text-sm outline-none focus:border-[var(--link)]"
                />
              </label>
            )}
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-strong)]">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-[var(--line-bright)] px-3 py-2 text-sm outline-none focus:border-[var(--link)]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-strong)]">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                className="mt-1 w-full rounded-lg border border-[var(--line-bright)] px-3 py-2 text-sm outline-none focus:border-[var(--link)]"
              />
            </label>

            {error && <p className="text-sm text-[var(--diff-insane)]">{error}</p>}
            {notice && (
              <p className="text-sm text-[var(--status-complete)]">{notice}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[var(--link)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
              className="w-full text-center text-sm text-[var(--link)] hover:underline"
            >
              {mode === "signin"
                ? "No account? Create one"
                : "Already have an account? Sign in"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
