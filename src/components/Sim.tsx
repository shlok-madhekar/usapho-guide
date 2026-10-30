"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SimDef, paramValues } from "@/lib/sim-types";
import { loadMathFonts, mathContext, setSansFamily, typesetRuns } from "@/lib/canvas-math";

/** A slider name with its symbols set as maths, the way the page sets them. */
function TypesetLabel({ text }: { text: string }) {
  return (
    <>
      {typesetRuns(text).map((r, i) =>
        r.sub ? (
          <sub key={i} style={{ fontFamily: "KaTeX_Math", fontSize: "0.7em" }}>{r.text}</sub>
        ) : r.sup ? (
          <sup key={i} style={{ fontSize: "0.7em" }}>{r.text}</sup>
        ) : r.math ? (
          <i key={i} style={{ fontFamily: "KaTeX_Math" }}>{r.text}</i>
        ) : (
          <span key={i}>{r.text}</span>
        ),
      )}
    </>
  );
}

/**
 * Reads the site's sans family from a real element, once. Canvas cannot read
 * CSS variables, so the family name has to be resolved here.
 */
let sansResolved = false;
function resolveSans() {
  if (sansResolved || typeof document === "undefined") return;
  sansResolved = true;
  const probe = document.createElement("span");
  probe.className = "sans";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  setSansFamily(getComputedStyle(probe).fontFamily);
  probe.remove();
}

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

/** True when the reader asked the system to minimise animation. */
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

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
  const rootRef = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const valuesRef = useRef(values);
  valuesRef.current = values;
  // lets a slider repaint a static (reduced-motion) sim, which has no loop
  const repaintRef = useRef<(() => void) | null>(null);

  const { fn, error: compileError } = useMemo(() => compile(def.draw), [def.draw]);

  useEffect(() => setError(compileError), [compileError]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fn) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let C = simColors();
    // labels are typeset through a wrapper; repaint once the maths faces load
    const math = mathContext(ctx);
    resolveSans();
    let loaded = true;
    loadMathFonts().then(() => {
      if (loaded) paint(performance.now());
    });
    let raf = 0;
    let start = performance.now();
    let failed = false;
    const reduce = prefersReducedMotion();

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
        // reduced motion freezes the clock at the opening frame; sliders still repaint
        const t = reduce ? 0 : (now - start) / 1000;
        fn(math, valuesRef.current, t, W, H, C, out);
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

    // Reduced motion: leave the opening frame on screen and never animate.
    // A slider still repaints through repaintRef (there is no loop to do it).
    repaintRef.current = reduce ? () => paint(performance.now()) : null;

    // Animate only while the sim is on screen and the tab is visible. A
    // lesson has three or four sims, and drawing the ones scrolled out of
    // view cost up to a fifth of a CPU core for nothing. While paused the
    // clock stops too, so an animation resumes where it left off.
    let onScreen = true;
    let pausedAt: number | null = null;
    const loop = (now: number) => {
      if (failed) return;
      paint(now);
      raf = requestAnimationFrame(loop);
    };
    const update = () => {
      const run = onScreen && document.visibilityState === "visible";
      if (run && pausedAt !== null) {
        start += performance.now() - pausedAt;
        pausedAt = null;
        raf = requestAnimationFrame(loop);
      } else if (!run && pausedAt === null) {
        pausedAt = performance.now();
        cancelAnimationFrame(raf);
      }
    };
    let seen: IntersectionObserver | null = null;
    if (!reduce) {
      raf = requestAnimationFrame(loop);
      // the sliders count as part of the sim, so moving one still repaints
      // while the canvas itself is just above the fold
      seen = new IntersectionObserver(
        ([entry]) => {
          onScreen = entry.isIntersecting;
          update();
        },
        { rootMargin: "100px" }
      );
      if (rootRef.current) seen.observe(rootRef.current);
      document.addEventListener("visibilitychange", update);
    }

    // The palette is read from CSS variables, so pick it up again when the
    // theme changes (a toggle, or printing, which switches to light). Paint
    // straight away: printing snapshots the canvas before the next frame.
    const themeWatch = new MutationObserver(() => {
      C = simColors();
      if (!failed) paint(performance.now());
    });
    themeWatch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      loaded = false;
      cancelAnimationFrame(raf);
      seen?.disconnect();
      document.removeEventListener("visibilitychange", update);
      themeWatch.disconnect();
      repaintRef.current = null;
    };
  }, [fn]);

  // a slider change repaints a static (reduced-motion) sim; the animation
  // loop already repaints in the normal case, so repaintRef is null there
  useEffect(() => {
    repaintRef.current?.();
  }, [values]);

  return (
    <div ref={rootRef}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="label">{def.title}</span>
        {note && !error && (
          <span className="tabular sans text-xs text-[var(--ink-soft)]"><TypesetLabel text={note} /></span>
        )}
      </div>

      {error ? (
        <pre className="mono mt-2 whitespace-pre-wrap border-l-2 border-[var(--bad)] bg-[var(--bad-bg)] p-3 text-xs text-[var(--bad)]">
          {error}
        </pre>
      ) : (
        <canvas
          ref={canvasRef}
          // a canvas is invisible to screen readers without a name
          role="img"
          aria-label={[def.title, def.caption].filter(Boolean).join(". ").replace(/\$/g, "")}
          className="mt-2 w-full"
          style={{ height: `${def.height}px` }}
        />
      )}

      {def.params.length > 0 && (
        <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-3 print:hidden">
          {def.params.map((param) => (
            <label key={param.key} className="block">
              <span className="sans flex justify-between text-xs text-[var(--ink-soft)]">
                <span><TypesetLabel text={param.label} /></span>
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

/**
 * Used in lessons: <Sim id="projectile" />
 *
 * The definition is fetched rather than imported. Bundling the catalogue put
 * all 267 simulations into every lesson page just to draw two or three of them.
 */
export default function Sim({ id }: { id: string }) {
  const [def, setDef] = useState<SimDef | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/sims/${id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((d: SimDef) => {
        if (!live) return;
        setDef(d);
        setValues(paramValues(d.params));
      })
      .catch(() => live && setMissing(true));
    return () => {
      live = false;
    };
  }, [id]);

  if (missing)
    return (
      <p className="aside warn text-sm">
        <span className="aside-label">Missing simulation</span>
        No simulation with the id <code>{id}</code>.
      </p>
    );

  // reserve the height so the figure does not jump when the definition lands
  if (!def) return <div style={{ height: 240 }} aria-hidden />;

  return <SimRunner def={def} values={values} onValues={setValues} />;
}
