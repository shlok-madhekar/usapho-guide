import Link from "next/link";
import Nav from "@/components/Nav";
import BankProblem from "@/components/BankProblem";
import {
  DAILY_START,
  dailyLesson,
  dailyProblem,
  dailyToday,
  formatDailyDate,
  shiftDate,
} from "@/lib/daily";
import { DIFFICULTY_VAR } from "@/lib/problem-types";

/** How many earlier days are listed under the problem. */
const RECENT_DAYS = 6;

/** One day's problem, with links to the lesson and the days before it. */
export default function DailyView({ date }: { date: string }) {
  const problem = dailyProblem(date)!;
  const today = dailyToday();
  const isToday = date === today;
  const lesson = dailyLesson(problem);

  const earlier: { date: string; name: string; difficulty: string }[] = [];
  for (let i = 1; i <= RECENT_DAYS; i++) {
    const day = shiftDate(date, -i);
    if (day < DAILY_START) break;
    const p = dailyProblem(day);
    if (p) earlier.push({ date: day, name: p.name, difficulty: p.difficulty });
  }
  const next = shiftDate(date, 1);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
        <p className="label">Problem of the day</p>
        <h1 className="mt-1 text-3xl font-bold text-[var(--ink-strong)]">
          {formatDailyDate(date)}
        </h1>
        <p className="sans mt-2 text-sm text-[var(--ink-soft)]">
          {isToday ? (
            <>One problem a day for everyone, picked from the bank. A new one comes out at midnight Pacific time.</>
          ) : (
            <>
              A past problem of the day.{" "}
              <Link prefetch={false} href="/daily" className="link">
                Today&apos;s problem
              </Link>
            </>
          )}
        </p>

        <div className="mt-6 border-y border-[var(--rule)]">
          <BankProblem problem={problem} />
        </div>

        {lesson && (
          <p className="sans mt-4 text-sm text-[var(--ink-soft)]">
            Stuck? It comes from{" "}
            <Link prefetch={false} href={`/guide/${lesson.slug}`} className="link">
              {lesson.title}
            </Link>
            , which has the ideas you need and more problems like it.
          </p>
        )}

        {(earlier.length > 0 || (!isToday && next <= today)) && (
          <section className="mt-12">
            <h2 className="text-lg font-bold text-[var(--ink-strong)]">Earlier days</h2>
            {earlier.length > 0 ? (
              <ol className="mt-3">
                {earlier.map((d) => (
                  <li key={d.date} className="border-b border-[var(--rule)] py-2">
                    <Link
                      prefetch={false}
                      href={`/daily/${d.date}`}
                      className="group flex flex-wrap items-baseline gap-x-3"
                    >
                      <span className="sans tabular w-28 shrink-0 text-sm text-[var(--ink-soft)]">
                        {formatDailyDate(d.date).replace(/^\w+, /, "")}
                      </span>
                      <span className="font-semibold text-[var(--ink-strong)] group-hover:text-[var(--accent)]">
                        {d.name}
                      </span>
                      <span
                        className="label"
                        style={{ color: DIFFICULTY_VAR[d.difficulty as keyof typeof DIFFICULTY_VAR] }}
                      >
                        {d.difficulty}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="sans mt-2 text-sm text-[var(--ink-soft)]">This was the first one.</p>
            )}
            {!isToday && next <= today && (
              <p className="sans mt-3 text-sm">
                <Link
                  prefetch={false}
                  href={next === today ? "/daily" : `/daily/${next}`}
                  className="link"
                >
                  Next day →
                </Link>
              </p>
            )}
          </section>
        )}
      </main>
    </>
  );
}
