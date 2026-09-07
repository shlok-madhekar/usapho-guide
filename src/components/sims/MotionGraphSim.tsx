"use client";

import { useEffect, useRef, useState } from "react";
import { Slider, SimShell } from "./SimShell";

const T_MAX = 8; // seconds shown

export default function MotionGraphSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [v0, setV0] = useState(6);
  const [a, setA] = useState(-1.5);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const x = (t: number) => v0 * t + 0.5 * a * t * t;
    const v = (t: number) => v0 + a * t;

    // find plot ranges
    let xMin = 0, xMax = 0, vMin = 0, vMax = 0;
    for (let t = 0; t <= T_MAX; t += 0.1) {
      xMin = Math.min(xMin, x(t)); xMax = Math.max(xMax, x(t));
      vMin = Math.min(vMin, v(t)); vMax = Math.max(vMax, v(t));
    }
    const pad = 30;
    const half = W / 2;
    const px = (t: number) => pad + (t / T_MAX) * (half - pad * 1.6);
    const px2 = (t: number) => half + pad + (t / T_MAX) * (half - pad * 1.6);
    const span = (lo: number, hi: number) => (hi - lo === 0 ? 1 : hi - lo);
    const py = (val: number, lo: number, hi: number) =>
      H - pad - ((val - lo) / span(lo, hi)) * (H - pad * 2);

    let raf: number;
    const draw = () => {
      tRef.current = (tRef.current + 0.02) % T_MAX;
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      const panels: Array<{
        f: (t: number) => number; lo: number; hi: number;
        X: (t: number) => number; color: string; label: string;
      }> = [
        { f: x, lo: xMin, hi: xMax, X: px, color: "#1d4ed8", label: "x(t)" },
        { f: v, lo: vMin, hi: vMax, X: px2, color: "#0f766e", label: "v(t)" },
      ];

      for (const p of panels) {
        // axes
        ctx.strokeStyle = "#e5e3dd";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.X(0), pad / 2);
        ctx.lineTo(p.X(0), H - pad / 2);
        ctx.stroke();
        const zeroY = py(0, p.lo, p.hi);
        ctx.beginPath();
        ctx.moveTo(p.X(0), zeroY);
        ctx.lineTo(p.X(T_MAX), zeroY);
        ctx.stroke();

        // curve
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let tt = 0; tt <= T_MAX; tt += 0.05) {
          const cx = p.X(tt);
          const cy = py(p.f(tt), p.lo, p.hi);
          tt === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
        }
        ctx.stroke();

        // moving dot
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.X(t), py(p.f(t), p.lo, p.hi), 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "12px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(p.label, p.X(0) + 6, pad / 2 + 10);
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [v0, a]);

  const turnaround = a !== 0 && v0 / -a > 0 && v0 / -a < T_MAX ? (v0 / -a).toFixed(1) : null;

  return (
    <SimShell
      title="Motion graph lab"
      note={turnaround ? `v = 0 at t = ${turnaround} s (the turnaround)` : "v never crosses zero in view"}
      canvasRef={canvasRef}
      canvasClass="h-52 w-full"
      controls={
        <>
          <Slider label="Initial velocity" unit="m/s" value={v0} min={-8} max={8} step={0.5} onChange={setV0} />
          <Slider label="Acceleration" unit="m/s²" value={a} min={-3} max={3} step={0.1} onChange={setA} />
        </>
      }
    />
  );
}
