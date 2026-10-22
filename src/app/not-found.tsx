import Link from "next/link";
import Nav from "@/components/Nav";
import NearestModules from "@/components/NearestModules";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
        <p className="label">404</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--ink-strong)]">
          There is no page here
        </h1>
        <p className="mt-4 text-[var(--ink-soft)]">
          The link may be old, or the address may have a typo.
        </p>

        <NearestModules />

        <nav className="sans mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/guide" className="link">
            The course
          </Link>
          <Link href="/problems" className="link">
            Problem bank
          </Link>
          <Link href="/" className="link">
            Home
          </Link>
        </nav>
      </main>
    </>
  );
}
