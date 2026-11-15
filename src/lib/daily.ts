import { PROBLEMS, isSolvable, type BankProblem } from "@/lib/problems";
import { findModule } from "@/lib/curriculum";

/**
 * The problem of the day. Server-only: it reads the full problem set.
 *
 * Every reader gets the same problem on the same day, with no database:
 * the pick is a pure function of the date and the problem set.
 *
 * The day turns over at midnight Pacific time, so it is one date across the
 * US the whole school day.
 *
 * How a day is picked: each candidate gets a score hash(date, id) and the
 * lowest score wins, skipping anything picked in the past year, so nothing
 * comes back around within a year. Adding problems leaves every day before
 * the first one a new problem wins unchanged; days after it may shift.
 */

export const DAILY_TIME_ZONE = "America/Los_Angeles";

/** The first problem of the day; there is no archive before it. */
export const DAILY_START = "2026-11-15";

/** No problem repeats within this many days. */
const NO_REPEAT_DAYS = 365;

/**
 * One good problem a day: solvable on the page, and past the one-formula
 * warm-ups, so it is worth coming back for.
 */
const POOL: BankProblem[] = PROBLEMS.filter(
  (p) => isSolvable(p) && p.difficulty !== "Easy"
).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

/** FNV-1a, 32-bit: small, fast and the same on every machine. */
function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const DAY_MS = 86_400_000;
const toDay = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY_MS;
const fromDay = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10);

/** Adds whole days to a YYYY-MM-DD date. */
export const shiftDate = (date: string, days: number) => fromDay(toDay(date) + days);

/** Today's date where the daily problem is set, as YYYY-MM-DD. */
export function dailyToday(now = new Date()) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export const isDailyDate = (text: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(text) && fromDay(toDay(text)) === text;

// picks are worked out once per server process, from DAILY_START onwards
const picks: string[] = [];

/** The problem for a date, or null before DAILY_START. */
export function dailyProblem(date: string): BankProblem | null {
  const target = toDay(date) - toDay(DAILY_START);
  if (!Number.isInteger(target) || target < 0 || POOL.length === 0) return null;

  while (picks.length <= target) {
    const day = fromDay(toDay(DAILY_START) + picks.length);
    const recent = new Set(picks.slice(-Math.min(NO_REPEAT_DAYS, POOL.length - 1)));
    let best: BankProblem | null = null;
    let bestScore = Infinity;
    for (const p of POOL) {
      if (recent.has(p.id)) continue;
      const score = hash(`${day}|${p.id}`);
      if (score < bestScore) {
        best = p;
        bestScore = score;
      }
    }
    picks.push(best!.id);
  }
  return POOL.find((p) => p.id === picks[target]) ?? null;
}

/** The lesson a problem belongs to, for a "review the lesson" link. */
export function dailyLesson(problem: BankProblem) {
  const found = findModule(problem.module);
  return found ? { slug: found.module.slug, title: found.module.title } : null;
}

/** A date as the page shows it: "Saturday, November 15". */
export const formatDailyDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
