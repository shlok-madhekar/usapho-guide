"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import { useAuth } from "@/lib/auth";
import { useGitHub } from "@/lib/github-auth";
import { ROLE_LABEL } from "@/lib/roles";

export default function AccountPage() {
  const { ready, configured, session, profile, signOut } = useAuth();
  const gh = useGitHub();

  if (!ready)
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-2xl px-6 py-20 text-[var(--ink-soft)]">
          Loading.
        </main>
      </>
    );

  if (!configured || !session)
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-2xl px-6 py-20">
          <h1 className="text-2xl font-semibold text-[var(--ink-strong)]">Account</h1>
          <p className="mt-3 text-[var(--ink-soft)]">
            {configured ? (
              <>
                <Link href="/login" className="link">
                  Sign in
                </Link>{" "}
                to keep your progress across devices.
              </>
            ) : (
              "Accounts are not configured on this deployment."
            )}
          </p>
        </main>
      </>
    );

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 pb-24 pt-10">
        <p className="label">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink-strong)]">
          {profile?.display_name || profile?.email?.split("@")[0] || "Your account"}
        </h1>

        <dl className="mt-8 space-y-3 border-y border-[var(--rule)] py-5 text-[0.95rem]">
          <div className="flex gap-4">
            <dt className="label w-32 shrink-0 pt-0.5">Email</dt>
            <dd className="text-[var(--ink)]">{profile?.email}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="label w-32 shrink-0 pt-0.5">Progress</dt>
            <dd className="text-[var(--ink)]">Synced to this account</dd>
          </div>
          <div className="flex gap-4">
            <dt className="label w-32 shrink-0 pt-0.5">Trust level</dt>
            <dd className="text-[var(--ink)]">
              {profile?.roles.length
                ? profile.roles.map((r) => ROLE_LABEL[r]).join(", ")
                : "Reader"}
            </dd>
          </div>
        </dl>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--ink-strong)]">
            Contributing
          </h2>
          <div className="prose mt-3">
            <p>
              Anyone can write lessons and problems. Connect a GitHub account in
              the editor and your work is submitted as a pull request from you,
              which the maintainer reviews before it goes live. You do not need
              to be a collaborator: a fork is created for you.
            </p>
            <p>
              No role is needed to write. The one exception is the course
              structure, which reshapes every page, so changing it needs the
              <em> admin</em> role. Collaborators on the repository also get a
              branch on the main repo rather than a fork.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {gh.connected ? (
              <>
                <span className="sans text-sm text-[var(--ink)]">
                  GitHub connected as @{gh.login}
                </span>
                <button onClick={gh.disconnect} className="btn-plain">
                  Disconnect
                </button>
              </>
            ) : (
              <Link href="/edit" className="btn">
                Open the editor
              </Link>
            )}
          </div>
        </section>

        <section className="mt-10 border-t border-[var(--rule)] pt-6">
          <h2 className="text-lg font-semibold text-[var(--ink-strong)]">
            Password
          </h2>
          <p className="mt-2 text-[0.95rem] text-[var(--ink-soft)]">
            Change it from the sign-in page using{" "}
            <Link href="/login?reset=1" className="link">
              send a reset link
            </Link>
            , which emails you a one-time link.
          </p>
        </section>

        <button
          onClick={signOut}
          className="sans mt-10 text-sm text-[var(--ink-faint)] hover:text-[var(--ink)]"
        >
          Sign out
        </button>
      </main>
    </>
  );
}
