import type { Metadata } from "next";
import localFont from "next/font/local";
import "katex/dist/katex.min.css";
import "./globals.css";
import { ProgressProvider } from "@/lib/progress";

const dmSans = localFont({
  src: [
    { path: "../fonts/DMSans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/DMSans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/DMSans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/DMSans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-dm",
});

const dmMono = localFont({
  src: [
    { path: "../fonts/DMMono-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/DMMono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "USAPhO Guide",
  description:
    "A free collection of curated, high-quality resources to take you from F=ma to USAPhO and beyond.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmMono.variable}`}>
        <ProgressProvider>{children}</ProgressProvider>
      </body>
    </html>
  );
}
