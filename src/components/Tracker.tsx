"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Records one pageview per route change. */
export default function Tracker() {
  const pathname = usePathname();
  useEffect(() => {
    track("pageview");
  }, [pathname]);
  return null;
}
