"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";

/**
 * Admin-only traffic and usage numbers from our own analytics table.
 * The data comes from the analytics_summary() RPC, which checks the admin
 * role in the database, so this page is only a view.
 */

type Row = Record<string, string | number | null>;
interface Summary {
  all_time: Row;
  daily: Row[];
  sources: Row[];
  pages: Row[];
  countries: Row[];
  accounts_by_week: Row[];
}

const fmt = (v: unknown) =>
  typeof v === "number" ? v.toLocaleString("en-US") : v == null ? "–" : String(v);

function Table({ title, rows, cols }: { title: string; rows: Row[]; cols: string[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-[var(--ink-strong)]">{title}</h2>
      {rows.length === 0 ? (
        <p className="sans mt-2 text-sm text-[var(--ink-soft)]">No data yet.</p>
      ) : (
        <table className="sans mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--rule-strong)] text-left text-[var(--ink-soft)]">
              {cols.map((c) => (
                <th key={c} className="py-1.5 pr-4 font-medium">{c.replace(/_/g, " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-[var(--rule)]">
                {cols.map((c) => (
                  <td key={c} className="tabular py-1.5 pr-4">{fmt(r[c])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function StatsPage() {
  const { ready, client, session, profile } = useAuth();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = hasRole(profile, "admin");

  useEffect(() => {
    if (!client || !isAdmin) return;
    client.rpc("analytics_summary", { days }).then(({ data, error }) => {
      if (error) setError(error.message);
      else setData(data as Summary);
    });
  }, [client, isAdmin, days]);

  const a = data?.all_time ?? {};
  const daily = data?.daily ?? [];
  const max = Math.max(1, ...daily.map((d) => Number(d.visitors) || 0));

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-10">
        <h1 className="text-3xl font-bold text-[var(--ink-strong)]">Stats</h1>
        {!ready ? null : !session ? (
          <p className="mt-4">
            <Link prefetch={false} href="/login" className="link">Sign in</Link> with an admin account.
          </p>
        ) : !isAdmin ? (
          <p className="mt-4 text-[var(--ink-soft)]">This page is for admins.</p>
        ) : error ? (
          <p className="mt-4 text-[var(--bad)]">{error}</p>
        ) : !data ? (
          <p className="mt-4 text-[var(--ink-soft)]">Loading…</p>
        ) : (
          <>
            <p className="sans mt-2 text-sm text-[var(--ink-soft)]">
              First-party analytics since{" "}
              {a.tracking_since ? new Date(String(a.tracking_since)).toLocaleDateString() : "–"}.
              Vercel Analytics has the earlier history (from Oct 11).
            </p>
            <div className="mt-6 grid grid-cols-2 gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-4">
              {[
                ["Visitors", a.visitors],
                ["Returning visitors", a.returning_visitors],
                ["Page views", a.pageviews],
                ["Sessions", a.sessions],
                ["Accounts", a.accounts],
                ["Signups (tracked)", a.signups],
                ["Answers checked", a.problem_checks],
                ["Correct answers", a.problems_correct],
                ["Quick checks", a.quickchecks],
                ["PDF exports", a.pdf_exports],
                ["Discord clicks", a.discord_clicks],
                ["Countries", a.countries],
              ].map(([k, v]) => (
                <div key={String(k)} className="bg-[var(--paper)] p-4">
                  <div className="label">{k}</div>
                  <div className="tabular mt-1 text-2xl font-bold text-[var(--ink-strong)]">{fmt(v)}</div>
                </div>
              ))}
            </div>

            <section className="mt-10">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-bold text-[var(--ink-strong)]">Visitors per day</h2>
                <select
                  className="sans border border-[var(--rule-strong)] bg-[var(--paper)] px-2 py-1 text-sm"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                >
                  {[7, 30, 90, 365, 3650].map((d) => (
                    <option key={d} value={d}>{d === 3650 ? "All time" : `Last ${d} days`}</option>
                  ))}
                </select>
              </div>
              <div className="mt-4 flex h-40 items-end gap-[2px]">
                {daily.map((d) => (
                  <div
                    key={String(d.day)}
                    title={`${d.day}: ${d.visitors} visitors, ${d.pageviews} views`}
                    className="flex-1 bg-[var(--accent)]"
                    style={{ height: `${(Number(d.visitors) / max) * 100}%`, minHeight: 1 }}
                  />
                ))}
              </div>
            </section>

            <Table title="Where visitors came from" rows={data.sources} cols={["source", "visitors", "signups", "discord_clicks"]} />
            <Table title="Top pages" rows={data.pages} cols={["path", "visitors", "pageviews"]} />
            <Table title="Countries" rows={data.countries} cols={["country", "visitors"]} />
            <Table
              title="Daily"
              rows={[...daily].reverse()}
              cols={["day", "visitors", "pageviews", "signups", "problem_checks", "discord_clicks"]}
            />
            <Table title="New accounts by week" rows={[...data.accounts_by_week].reverse()} cols={["week", "signups"]} />
          </>
        )}
      </main>
    </>
  );
}
