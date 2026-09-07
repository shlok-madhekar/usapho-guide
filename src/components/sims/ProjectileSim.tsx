"use client";

import { useEffect, useRef, useState } from "react";
import { Slider, simColors } from "./SimShell";

export default function ProjectileSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [v0, setV0] = useState(28);
  const [angle, setAngle] = useState(45);
  const [g, setG] = useState(9.8);
  const tRef = useRef(0);

  const th = (angle * Math.PI) / 180;
  const range = (v0 * v0 * Math.sin(2 * th)) / g;
  const hMax = (v0 * v0 * Math.sin(th) ** 2) / (2 * g);
  const tFlight = (2 * v0 * Math.sin(th)) / g;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const C = simColors();
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const pad = 34;
    // world scale: fit worst-case range/height for current params, min floor
    const maxX = Math.max(range * 1.08, 20);
    const maxY = Math.max(hMax * 1.35, 12);
    const sx = (W - pad * 2) / maxX;
    const sy = (H - pad * 2) / maxY;
    const X = (x: number) => pad + x * sx;
    const Y = (y: number) => H - pad - y * sy;

    let raf: number;
    const draw = () => {
      tRef.current = (tRef.current + 0.016) % (tFlight + 0.6);
      const t = Math.min(tRef.current, tFlight);

      ctx.clearRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= maxX; gx += Math.ceil(maxX / 8)) {
        ctx.beginPath();
        ctx.moveTo(X(gx), pad / 2);
        ctx.lineTo(X(gx), H - pad);
        ctx.stroke();
      }
      // ground
      ctx.strokeStyle = C.faint;
      ctx.beginPath();
      ctx.moveTo(pad / 2, Y(0));
      ctx.lineTo(W - pad / 2, Y(0));
      ctx.stroke();

      // full trajectory (dashed)
      ctx.strokeStyle = C.rule;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      for (let tt = 0; tt <= tFlight; tt += tFlight / 120) {
        const x = v0 * Math.cos(th) * tt;
        const y = v0 * Math.sin(th) * tt - 0.5 * g * tt * tt;
        tt === 0 ? ctx.moveTo(X(x), Y(y)) : ctx.lineTo(X(x), Y(y));
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // traveled path (solid)
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let tt = 0; tt <= t; tt += tFlight / 120) {
        const x = v0 * Math.cos(th) * tt;
        const y = v0 * Math.sin(th) * tt - 0.5 * g * tt * tt;
        tt === 0 ? ctx.moveTo(X(x), Y(y)) : ctx.lineTo(X(x), Y(y));
      }
      ctx.stroke();

      // projectile + velocity vector
      const px = v0 * Math.cos(th) * t;
      const py = Math.max(0, v0 * Math.sin(th) * t - 0.5 * g * t * t);
      const vx = v0 * Math.cos(th);
      const vy = v0 * Math.sin(th) - g * t;

      ctx.strokeStyle = C.figure;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(X(px), Y(py));
      ctx.lineTo(X(px) + vx * 1.6, Y(py) - vy * 1.6);
      ctx.stroke();

      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.arc(X(px), Y(py), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.paper;
      ctx.stroke();

      // apex marker
      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.arc(X(range / 2), Y(hMax), 2.5, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [v0, angle, g, th, range, hMax, tFlight]);


  return (
    <div className="panel my-8 overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
        <span className="text-sm font-semibold text-[var(--text-strong)]">
          Trajectory lab
        </span>
        <span className="text-xs text-[var(--ink-faint)]">
          drag the sliders
        </span>
      </div>
      <canvas ref={canvasRef} className="h-64 w-full" />
      <div className="grid gap-5 border-t border-[var(--line)] p-5 sm:grid-cols-3">
        <Slider label="Launch speed" unit="m/s" value={v0} min={8} max={50} step={1} onChange={setV0} />
        <Slider label="Angle" unit="°" value={angle} min={10} max={80} step={1} onChange={setAngle} />
        <Slider label="Gravity" unit="m/s²" value={g} min={1.6} max={24} step={0.1} onChange={setG} />
      </div>
      <div className="grid grid-cols-3 gap-px border-t border-[var(--line)] bg-[var(--line)]">
        {[
          ["Range", `${range.toFixed(1)} m`],
          ["Max height", `${hMax.toFixed(1)} m`],
          ["Flight time", `${tFlight.toFixed(2)} s`],
        ].map(([k, v]) => (
          <div key={k} className="bg-[var(--panel)] px-5 py-3">
            <div className="text-[0.65rem] font-medium uppercase tracking-wide text-[var(--ink-faint)]">
              {k}
            </div>
            <div className="font-mono-num mt-0.5 text-lg text-[var(--text-strong)]">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
