import { NextResponse, type NextRequest } from "next/server";

/**
 * usapho.one/discord: a short link to the community server that we can share
 * anywhere (Reddit, posters, DMs). It records the click, with the utm tags and
 * country, before redirecting, so we can see which posts bring people in.
 */
const INVITE = "https://discord.gg/KGWAxqxug2";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const q = request.nextUrl.searchParams;
  const ua = request.headers.get("user-agent") ?? "";
  const bot = /bot|crawl|spider|preview|discord|slack|facebookexternalhit|embed/i.test(ua);
  if (url && key && !bot && process.env.VERCEL_ENV === "production") {
    const ref = request.headers.get("referer");
    try {
      await fetch(`${url}/rest/v1/analytics_events`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          event: "discord_click",
          path: "/discord",
          referrer: ref?.slice(0, 300) ?? null,
          utm_source: (q.get("utm_source") ?? q.get("ref"))?.slice(0, 80) ?? null,
          utm_medium: q.get("utm_medium")?.slice(0, 80) ?? null,
          utm_campaign: q.get("utm_campaign")?.slice(0, 120) ?? null,
          country: request.headers.get("x-vercel-ip-country")?.slice(0, 8) ?? null,
          props: { from: "short_link" },
        }),
        signal: AbortSignal.timeout(1500),
      });
    } catch {
      /* never block the redirect */
    }
  }
  return NextResponse.redirect(INVITE, 302);
}
