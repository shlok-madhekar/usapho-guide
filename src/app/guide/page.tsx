import type { Metadata } from "next";
import { LESSONS } from "@/content/lessons";
import GuideIndex from "./GuideIndex";

export const metadata: Metadata = {
  title: "Course",
  description:
    "Every topic for the F=ma exam and the USAPhO, in the order they build on each other.",
  alternates: { canonical: "/guide" },
};

/**
 * Server shell. The index only needs to know which modules have a lesson
 * written; importing the registry from the client component pulled every
 * compiled lesson into the browser bundle.
 */
export default function GuidePage() {
  return <GuideIndex written={Object.keys(LESSONS)} />;
}
