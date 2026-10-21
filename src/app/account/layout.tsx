import type { Metadata } from "next";

// the page is a client component, which cannot export metadata itself
export const metadata: Metadata = {
  title: "Account",
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
