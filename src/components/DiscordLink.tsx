"use client";

import { DISCORD_INVITE, track } from "@/lib/analytics";

/** A link to the community Discord that records where it was clicked from. */
export default function DiscordLink({
  from,
  className,
  children,
}: {
  from: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={DISCORD_INVITE}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track("discord_click", { from })}
    >
      {children}
    </a>
  );
}
