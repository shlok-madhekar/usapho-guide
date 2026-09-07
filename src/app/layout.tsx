import type { Metadata } from "next";
import localFont from "next/font/local";
import "katex/dist/katex.min.css";
import "./globals.css";
import { ProgressProvider } from "@/lib/progress";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider, ThemeScript } from "@/lib/theme";

const serif = localFont({
  src: [
    { path: "../fonts/SourceSerif4-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/SourceSerif4-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/SourceSerif4-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/SourceSerif4-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-serif",
});

const dmSans = localFont({
  src: [
    { path: "../fonts/DMSans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/DMSans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/DMSans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/DMSans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
});

const dmMono = localFont({
  src: [
    { path: "../fonts/DMMono-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/DMMono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mono",
});

export const metadata: Metadata = {
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
      <body className={`${serif.variable} ${dmSans.variable} ${dmMono.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            <ProgressProvider>{children}</ProgressProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
