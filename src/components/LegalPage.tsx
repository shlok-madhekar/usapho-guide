import Link from "next/link";
import Nav from "@/components/Nav";

export const CONTACT_EMAIL = "shlokmadhekar88@gmail.com";
export const EFFECTIVE = "November 8, 2026";

/** Shared frame for the privacy policy and terms. */
export default function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[var(--measure)] px-6 pb-24 pt-10">
        <h1 className="text-3xl font-bold text-[var(--ink-strong)]">{title}</h1>
        <p className="sans mt-2 text-sm text-[var(--ink-soft)]">
          Effective {EFFECTIVE}
        </p>
        <article className="legal prose mt-8">{children}</article>
        <p className="sans mt-12 border-t border-[var(--rule)] pt-4 text-sm text-[var(--ink-soft)]">
          <Link prefetch={false} href="/privacy" className="link">Privacy</Link>
          {" · "}
          <Link prefetch={false} href="/terms" className="link">Terms</Link>
          {" · "}
          <Link prefetch={false} href="/" className="link">Home</Link>
        </p>
      </main>
    </>
  );
}
