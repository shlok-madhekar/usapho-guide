"use client";

import { useState } from "react";

/**
 * Asks a connected contributor to star the repository.
 *
 * This is deliberately a button rather than something that fires on connect.
 * The token is handed over so somebody can open a pull request; spending it on
 * an unrelated action against their own account is a surprise they did not
 * agree to, and GitHub treats automated starring as inauthentic engagement,
 * which gets stars stripped and repositories flagged.
 */
export default function StarPrompt({
  api,
}: {
  api: (input: string, init?: RequestInit) => Promise<Response>;
}) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "failed">(
    "idle"
  );

  if (state === "done")
    return (
      <span className="sans text-sm text-[var(--ok)]">Starred, thank you</span>
    );

  return (
    <button
      className="btn-plain sans text-sm"
      disabled={state === "saving"}
      onClick={async () => {
        setState("saving");
        try {
          const res = await api("/api/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "star" }),
          });
          setState(res.ok ? "done" : "failed");
        } catch {
          setState("failed");
        }
      }}
      title="Stars the usapho-guide repository from your GitHub account"
    >
      {state === "saving"
        ? "Starring…"
        : state === "failed"
        ? "Could not star, try again"
        : "★ Star the repo"}
    </button>
  );
}
