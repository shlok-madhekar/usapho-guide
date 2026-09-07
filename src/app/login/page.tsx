"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { useAuth } from "@/lib/auth";

type Mode = "signin" | "signup" | "reset";

const TITLE: Record<Mode, string> = {
  signin: "Sign in",
  signup: "Create an account",
  reset: "Reset your password",
};

function LoginForm() {
  const { configured, session, signIn, signUp, resetPassword } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get("reset") ? "reset" : "signin");
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
      } else if (mode === "signup") {
        await signUp(email, password, displayName);
        setNotice(
          "Account created. If email confirmation is on, check your inbox, then sign in."
        );
        setMode("signin");
      } else {
        const { error } = await resetPassword(email);
        if (error) throw new Error(error);
        setNotice(
          "If that address has an account, a link to set a new password is on its way."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (!configured)
    return (
      <main className="mx-auto max-w-md px-6 py-20">
        <h1 className="text-2xl font-semibold text-[var(--ink-strong)]">Accounts</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Accounts are not configured on this deployment. Progress is still
          saved in this browser.
        </p>
      </main>
    );

  return (
    <main className="mx-auto max-w-md px-6 pb-24 pt-16">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">
        {TITLE[mode]}
      </h1>
      <p className="mt-2 text-[var(--ink-soft)]">
        {mode === "reset"
          ? "We will email you a one-time link to choose a new password."
          : "An account keeps your progress across devices. Reading the guide never requires one."}
      </p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        {mode === "signup" && (
          <label className="block">
            <span className="label mb-1 block">Name</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full"
              autoComplete="name"
            />
          </label>
        )}
        <label className="block">
          <span className="label mb-1 block">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
            autoComplete="email"
          />
        </label>
        {mode !== "reset" && (
          <label className="block">
            <span className="label mb-1 block">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </label>
        )}

        <button type="submit" disabled={busy} className="btn w-full">
          {busy
            ? "Working."
            : mode === "signin"
            ? "Sign in"
            : mode === "signup"
            ? "Create account"
            : "Send reset link"}
        </button>
      </form>

      {error && (
        <div className="aside warn mt-5">
          <span className="aside-label">Could not continue</span>
          <p className="text-sm">{error}</p>
        </div>
      )}
      {notice && (
        <div className="aside mt-5">
          <span className="aside-label">Check your email</span>
          <p className="text-sm">{notice}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1">
        {mode !== "signin" && (
          <button
            onClick={() => setMode("signin")}
            className="sans text-sm text-[var(--accent)] underline underline-offset-2"
          >
            Sign in instead
          </button>
        )}
        {mode !== "signup" && (
          <button
            onClick={() => setMode("signup")}
            className="sans text-sm text-[var(--accent)] underline underline-offset-2"
          >
            Create an account
          </button>
        )}
        {mode !== "reset" && (
          <button
            onClick={() => setMode("reset")}
            className="sans text-sm text-[var(--ink-faint)] underline underline-offset-2 hover:text-[var(--ink)]"
          >
            Forgot your password?
          </button>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <>
      <Nav />
      <Suspense
        fallback={
          <main className="mx-auto max-w-md px-6 py-20 text-[var(--ink-soft)]">
            Loading.
          </main>
        }
      >
        <LoginForm />
      </Suspense>
    </>
  );
}
