import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import localFont from "next/font/local";
import "katex/dist/katex.min.css";
import "./globals.css";
import { ProgressProvider } from "@/lib/progress";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider, ThemeScript } from "@/lib/theme";

const dmSans = localFont({
  src: [
    { path: "../fonts/DMSans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/DMSans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/DMSans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/DMSans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://usapho.one"),
  title: "USAPhO Guide",
  description:
    "Notes and problems for the F=ma exam and the US Physics Olympiad.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={dmSans.variable}>
        <ThemeProvider>
          <AuthProvider>
            <ProgressProvider>{children}</ProgressProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
