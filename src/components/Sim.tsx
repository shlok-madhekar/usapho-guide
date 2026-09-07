"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SimDef, findSim, paramValues } from "@/lib/sims";

/** Theme colours handed to a sim's draw body. */
function simColors() {
  const fallback = {
    ink: "#1f1d1a", rule: "#ded9cf", accent: "#7b2d26",
    figure: "#2f4858", faint: "#8d8779", paper: "#fbfaf7",
  };
  if (typeof window === "undefined") return fallback;
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  return {
    ink: v("--ink-strong", fallback.ink),
    rule: v("--rule", fallback.rule),
    accent: v("--accent", fallback.accent),
    figure: v("--figure", fallback.figure),
    faint: v("--ink-faint", fallback.faint),
    paper: v("--paper", fallback.paper),
  };
}

type DrawFn = (
  ctx: CanvasRenderingContext2D,
  p: Record<string, number>,
  t: number,
  W: number,
  H: number,
  C: ReturnType<typeof simColors>,
  out: { note: string }
) => void;

function compile(source: string): { fn: DrawFn | null; error: string | null } {
  try {
    // eslint-disable-next-line no-new-func -- sim bodies are repository content, merged by a maintainer
    const fn = new Function("ctx", "p", "t", "W", "H", "C", "out", source) as DrawFn;
    return { fn, error: null };
  } catch (e) {
    return { fn: null, error: e instanceof Error ? e.message : "Could not compile" };
  }
}

export function SimRunner({
  def,
  values,
  onValues,
}: {
  def: SimDef;
  values: Record<string, number>;
  onValues: (v: Record<string, number>) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const { fn, error: compileError } = useMemo(() => compile(def.draw), [def.draw]);

  useEffect(() => setError(compileError), [compileError]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fn) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const C = simColors();
    let raf = 0;
    let start = performance.now();
    let failed = false;

    const paint = (now: number) => {
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const out = { note: "" };
      try {
        fn(ctx, valuesRef.current, (now - start) / 1000, W, H, C, out);
      } catch (e) {
        // a broken sim should report itself, not spin at 60fps forever
        failed = true;
        setError(e instanceof Error ? e.message : "Error while drawing");
        return;
      }
      setNote((n) => (n === out.note ? n : out.note));
    };

    // Draw one frame straight away so the canvas is never blank: rAF does not
    // run in a hidden tab, and a sim scrolled into view should already be there.
    paint(performance.now());

    const loop = (now: number) => {
      if (failed) return;
      paint(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // restart the clock when the tab comes back, so nothing jumps
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        start = performance.now() - (performance.now() - start);
        paint(performance.now());
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fn]);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="label">{def.title}</span>
        {note && !error && (
          <span className="tabular sans text-xs text-[var(--ink-soft)]">{note}</span>
        )}
      </div>

      {error ? (
        <pre className="mono mt-2 whitespace-pre-wrap border-l-2 border-[var(--bad)] bg-[var(--bad-bg)] p-3 text-xs text-[var(--bad)]">
          {error}
        </pre>
      ) : (
        <canvas
          ref={canvasRef}
          className="mt-2 w-full"
          style={{ height: `${def.height}px` }}
        />
      )}

      {def.params.length > 0 && (
        <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-3">
          {def.params.map((param) => (
            <label key={param.key} className="block">
              <span className="sans flex justify-between text-xs text-[var(--ink-soft)]">
                {param.label}
                <span className="tabular text-[var(--ink-strong)]">
                  {values[param.key]} {param.unit}
                </span>
              </span>
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={values[param.key] ?? param.value}
                onChange={(e) =>
                  onValues({ ...values, [param.key]: Number(e.target.value) })
                }
                className="mt-2"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/** Used in lessons: <Sim id="projectile" /> */
export default function Sim({ id }: { id: string }) {
  const def = findSim(id);
  const [values, setValues] = useState<Record<string, number>>(() =>
    def ? paramValues(def.params) : {}
  );

  if (!def)
    return (
      <p className="aside warn text-sm">
        <span className="aside-label">Missing simulation</span>
        No simulation with the id <code>{id}</code>.
      </p>
    );

  return <SimRunner def={def} values={values} onValues={setValues} />;
}
