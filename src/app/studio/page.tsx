"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";

const ENGINE = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:8100";

const PRESETS = [
  "Why is projectile range maximized at 45 degrees?",
  "Show how a ballistic pendulum converts momentum to height",
  "Explain simple harmonic motion of a mass on a spring",
  "Visualize Gauss's law for a uniformly charged sphere",
];

type Phase =
  | "idle"
  | "queued"
  | "generating"
  | "rendering"
  | "repairing"
  | "done"
  | "error";

const PHASE_LABEL: Record<string, string> = {
  queued: "Queued",
  generating: "Writing the animation with AI",
  rendering: "Rendering with Manim",
  repairing: "Fixing a render error",
};

interface PastVideo {
  prompt: string;
  url: string;
}

export default function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [engineUp, setEngineUp] = useState<boolean | null>(null);
  const [history, setHistory] = useState<PastVideo[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${ENGINE}/api/health`)
      .then((r) => setEngineUp(r.ok))
      .catch(() => setEngineUp(false));
    try {
      const raw = localStorage.getItem("usapho-studio-history");
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* ignore corrupted history */
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const saveHistory = (items: PastVideo[]) => {
    setHistory(items);
    try {
      localStorage.setItem("usapho-studio-history", JSON.stringify(items));
    } catch {
      /* storage full */
    }
  };

  const generate = useCallback(
    async (p: string) => {
      const text = p.trim();
      if (!text || (phase !== "idle" && phase !== "done" && phase !== "error"))
        return;
      setError(null);
      setVideoUrl(null);
      setPhase("queued");
      try {
        const res = await fetch(`${ENGINE}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text }),
        });
        if (!res.ok) throw new Error(`engine returned ${res.status}`);
        const { jobId } = await res.json();
        pollRef.current = setInterval(async () => {
          try {
            const jr = await fetch(`${ENGINE}/api/jobs/${jobId}`);
            const job = await jr.json();
            setPhase(job.status);
            if (job.status === "done") {
              if (pollRef.current) clearInterval(pollRef.current);
              const url = `${ENGINE}${job.videoUrl}`;
              setVideoUrl(url);
              saveHistory(
                [{ prompt: text, url }, ...history].slice(0, 12)
              );
            } else if (job.status === "error") {
              if (pollRef.current) clearInterval(pollRef.current);
              setError(job.error ?? "unknown engine error");
            }
          } catch {
            /* transient poll failure, keep trying */
          }
        }, 2000);
      } catch (e) {
        setPhase("error");
        setError(e instanceof Error ? e.message : "request failed");
      }
    },
    [phase, history]
  );

  const busy = ["queued", "generating", "rendering", "repairing"].includes(phase);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-strong)]">
          Video lab
        </h1>
        <p className="mt-2 text-[var(--text-dim)]">
          Describe a physics concept or problem, and an AI writes a Manim
          animation to explain it, rendered on the spot. Generations take a
          minute or two.
        </p>

        {engineUp === false && (
          <div className="callout warn mt-6">
            <div className="callout-label">Engine offline</div>
            <p className="text-sm">
              The video engine isn&apos;t running. Start it locally with{" "}
              <code>cd engine && .venv/bin/uvicorn main:app --port 8100</code>{" "}
              and reload this page.
            </p>
          </div>
        )}

        <div className="panel mt-6 p-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="e.g. Show why the horizontal and vertical motions of a projectile are independent"
            className="w-full resize-none rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--link)]"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => generate(prompt)}
              disabled={busy || !prompt.trim() || engineUp === false}
              className="rounded-lg bg-[var(--link)] px-4 py-2 text-sm font-medium text-white transition-colors enabled:hover:bg-blue-800 disabled:opacity-50"
            >
              {busy ? "Working…" : "Generate video"}
            </button>
            {busy && (
              <span className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--line-bright)] border-t-[var(--link)]" />
                {PHASE_LABEL[phase] ?? phase}…
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--text-dim)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--text)]"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="callout warn mt-6">
            <div className="callout-label">Generation failed</div>
            <p className="break-words text-sm">{error}</p>
          </div>
        )}

        {videoUrl && (
          <div className="panel mt-6 overflow-hidden">
            <video src={videoUrl} controls autoPlay className="w-full" />
          </div>
        )}

        {history.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-[var(--text-strong)]">
              Recent videos
            </h2>
            <ul className="mt-3 space-y-2">
              {history.map((h, i) => (
                <li key={i}>
                  <button
                    onClick={() => {
                      setVideoUrl(h.url);
                      setError(null);
                    }}
                    className="text-link text-left text-sm"
                  >
                    {h.prompt}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-[var(--ink-faint)]">
              Links work while the engine that rendered them is running.
            </p>
          </section>
        )}
      </main>
    </>
  );
}
