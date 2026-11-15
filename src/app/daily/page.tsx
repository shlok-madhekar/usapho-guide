import type { Metadata } from "next";
import DailyView from "./DailyView";
import { dailyToday } from "@/lib/daily";

export const metadata: Metadata = {
  title: "Problem of the day",
  description:
    "One F=ma or USAPhO problem a day, the same for everyone, with the answer checked on the page and a full solution.",
  alternates: { canonical: "/daily" },
};

// rebuilt every few minutes, so the new problem appears soon after midnight
export const revalidate = 300;

export default function DailyPage() {
  return <DailyView date={dailyToday()} />;
}
