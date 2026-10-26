import { OG_SIZE, ogImage } from "@/lib/og";

export const alt = "USAPhO Guide: free notes and problems for F=ma and USAPhO";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "A free course for the F=ma exam and the US Physics Olympiad",
    title: "Free notes and problems for F=ma and USAPhO",
    description: "Lessons in the order they build on each other, with simulations and problems for every topic.",
  });
}
