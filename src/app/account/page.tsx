"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import { useAuth } from "@/lib/auth";
import {
  ROLE_DESCRIPTION,
  ROLE_LABEL,
  Role,
  canEditLessons,
  canEditProblems,
} from "@/lib/roles";

const ALL_ROLES: Role[] = ["course_writer", "problem_writer", "admin"];

export default function AccountPage() {
  const { ready, configured, session, profile, signOut } = useAuth();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-12">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-strong)]">
          Account
        </h1>

        {!configured && (
          <div className="callout warn mt-6">
            <div className="callout-label">Auth not configured</div>
            <p className="text-sm">See SETUP.md to connect Supabase.</p>
          </div>
        )}

        {configured && ready && !session && (
          <p className="mt-6 text-[var(--text-dim)]">
            You are not signed in.{" "}
            <Link href="/login" className="text-link">
              Sign in
            </Link>
            .
          </p>
        )}

        {session && profile && (
          <>
            <div className="panel mt-6 p-5">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-dim)]">Name</dt>
                  <dd className="text-[var(--text-strong)]">
                    {profile.display_name ?? "not set"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-dim)]">Email</dt>
                  <dd className="text-[var(--text-strong)]">{profile.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-dim)]">Roles</dt>
                  <dd className="text-right text-[var(--text-strong)]">
                    {profile.roles.length
                      ? profile.roles.map((r) => ROLE_LABEL[r]).join(", ")
                      : "Reader"}
                  </dd>
                </div>
              </dl>
              <button
                onClick={signOut}
                className="mt-5 rounded-lg border border-[var(--line-bright)] px-3 py-1.5 text-sm hover:bg-[var(--panel-2)]"
              >
                Sign out
              </button>
            </div>

            {(canEditLessons(profile) || canEditProblems(profile)) && (
              <Link href="/edit" className="btn-brass mt-6">
                Open the content editor
              </Link>
            )}

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-[var(--text-strong)]">
                Contributor roles
              </h2>
              <p className="mt-1 text-sm text-[var(--text-dim)]">
                Roles are granted by an admin. Ask one to add you, or run the
                grant SQL in SETUP.md against your Supabase project.
              </p>
              <ul className="mt-4 space-y-3">
                {ALL_ROLES.map((r) => (
                  <li key={r} className="panel p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-strong)]">
                        {ROLE_LABEL[r]}
                      </span>
                      {profile.roles.includes(r) && (
                        <span className="rounded bg-[var(--panel-2)] px-1.5 py-0.5 text-[0.65rem] font-medium text-[var(--status-complete)]">
                          granted
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-dim)]">
                      {ROLE_DESCRIPTION[r]}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </>
  );
}
