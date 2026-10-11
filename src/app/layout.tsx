import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { ProgressProvider } from "@/lib/progress";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider, ThemeScript } from "@/lib/theme";

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
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ProgressProvider>{children}</ProgressProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
