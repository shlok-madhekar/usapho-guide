import type { Metadata } from "next";

// the page is a client component, which cannot export metadata itself
export const metadata: Metadata = {
  title: "Problems",
  description:
    "Practice problems for the F=ma exam and the USAPhO, by topic and difficulty, answer-checked in the browser.",
  alternates: { canonical: "/problems" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
