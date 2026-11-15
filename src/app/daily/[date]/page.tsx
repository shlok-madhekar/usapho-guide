import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import DailyView from "../DailyView";
import { DAILY_START, dailyToday, formatDailyDate, isDailyDate } from "@/lib/daily";

// past days are built on first visit and kept; the window only matters for
// the day that has just ended
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

export function generateMetadata({ params }: { params: { date: string } }): Metadata {
  if (!isDailyDate(params.date)) return {};
  return {
    title: `Problem of the day, ${formatDailyDate(params.date)}`,
    alternates: { canonical: `/daily/${params.date}` },
  };
}

export default function PastDailyPage({ params }: { params: { date: string } }) {
  const { date } = params;
  const today = dailyToday();
  // no peeking ahead, and nothing before the first day
  if (!isDailyDate(date) || date < DAILY_START || date > today) notFound();
  if (date === today) redirect("/daily");
  return <DailyView date={date} />;
}
