"use client";

import { authConfigured, createClient } from "@/lib/supabase/client";

/**
 * First-party analytics. Events go straight into our own Supabase table
 * (public.analytics_events), which the public API can write but never read,
 * so history is kept forever and no third party sees it. Vercel Analytics
 * stays on as well; this adds what it can't do on the free plan: all-time
 * history, signups and answers as events, and where each visitor came from.
 *
 * Only the production domain records anything, so local dev and preview
 * deployments never pollute the numbers.
 */

export const DISCORD_INVITE = "https://discord.gg/KGWAxqxug2";

const VISITOR_KEY = "ug_vid";
const SESSION_KEY = "ug_sid";
const TOUCH_KEY = "ug_touch";
const SESSION_IDLE_MS = 30 * 60 * 1000;

type Props = Record<string, string | number | boolean | null>;

let userId: string | null = null;
/** Called by the auth provider so events carry the signed-in account. */
export function setAnalyticsUser(id: string | null) {
  userId = id;
}

function enabled() {
  if (typeof window === "undefined" || !authConfigured) return false;
  if (window.location.hostname !== "usapho.one") return false;
  if (navigator.webdriver) return false;
  return true;
}

function uuid() {
  return crypto.randomUUID?.() ??
    "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
    );
}

function visitorId() {
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) {
      v = uuid();
      localStorage.setItem(VISITOR_KEY, v);
    }
    return v;
  } catch {
    return null;
  }
}

function sessionId() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const now = Date.now();
    if (raw) {
      const [id, at] = raw.split("|");
      if (id && now - Number(at) < SESSION_IDLE_MS) {
        localStorage.setItem(SESSION_KEY, `${id}|${now}`);
        return id;
      }
    }
    const id = uuid();
    localStorage.setItem(SESSION_KEY, `${id}|${now}`);
    return id;
  } catch {
    return null;
  }
}

/** The referrer and utm tags of the visit that started this session. */
function touch() {
  try {
    const saved = sessionStorage.getItem(TOUCH_KEY);
    if (saved) return JSON.parse(saved) as Record<string, string | null>;
    const q = new URLSearchParams(window.location.search);
    const ref = document.referrer && !document.referrer.includes("usapho.one")
      ? document.referrer.slice(0, 300)
      : null;
    const t = {
      referrer: ref,
      utm_source: q.get("utm_source") ?? q.get("ref"),
      utm_medium: q.get("utm_medium"),
      utm_campaign: q.get("utm_campaign"),
    };
    sessionStorage.setItem(TOUCH_KEY, JSON.stringify(t));
    return t;
  } catch {
    return {};
  }
}

function device() {
  const w = window.innerWidth;
  return w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop";
}

let client: ReturnType<typeof createClient> | null = null;

export function track(event: string, props: Props = {}) {
  if (!enabled()) return;
  try {
    client ??= createClient();
    const t = touch();
    const row = {
      event,
      path: window.location.pathname.slice(0, 300),
      referrer: t.referrer ?? null,
      utm_source: t.utm_source?.slice(0, 80) ?? null,
      utm_medium: t.utm_medium?.slice(0, 80) ?? null,
      utm_campaign: t.utm_campaign?.slice(0, 120) ?? null,
      visitor_id: visitorId(),
      session_id: sessionId(),
      user_id: userId,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone?.slice(0, 64) ?? null,
      lang: navigator.language?.slice(0, 24) ?? null,
      device: device(),
      country: document.cookie.match(/(?:^|; )ug_c=([A-Z]{2})/)?.[1] ?? null,
      props,
    };
    // fire and forget: analytics must never slow down or break the page
    void client.from("analytics_events").insert(row).then(() => {}, () => {});
  } catch {
    /* ignore */
  }
}
