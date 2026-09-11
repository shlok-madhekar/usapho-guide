import { LESSONS } from "@/content/lessons";
import GuideIndex from "./GuideIndex";

/**
 * Server shell. The index only needs to know which modules have a lesson
 * written; importing the registry from the client component pulled every
 * compiled lesson into the browser bundle.
 */
export default function GuidePage() {
  return <GuideIndex written={Object.keys(LESSONS)} />;
}
