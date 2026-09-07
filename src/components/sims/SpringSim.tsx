"use client";

import { useEffect, useRef, useState } from "react";
import { Slider } from "./SimShell";

export default function SpringSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [k, setK] = useState(20);
  const [m, setM] = useState(1.5);
  const [A, setA] = useState(0.8);
  const tRef = useRef(0);
  const traceRef = useRef<number[]>([]);

  const omega = Math.sqrt(k / m);
  const T = (2 * Math.PI) / omega;

  useEffect(() => {
    traceRef.current = [];
  }, [k, m, A]);

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

    const wallX = 30;
    const eqX = W * 0.32;
    const scale = (W * 0.16) / 1; // px per meter of displacement
    const midY = H * 0.32;

    let raf: number;
    const draw = () => {
      tRef.current += 0.016;
      const x = A * Math.cos(omega * tRef.current);
      const massX = eqX + x * scale;

      const trace = traceRef.current;
      trace.push(x);
      if (trace.length > 260) trace.shift();

      ctx.clearRect(0, 0, W, H);

      // wall
      ctx.fillStyle = "#d6d3cc";
      ctx.fillRect(wallX - 8, midY - 44, 8, 88);

      // spring zigzag
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wallX, midY);
      const coils = 12;
      for (let i = 1; i <= coils; i++) {
        const sx = wallX + ((massX - 18 - wallX) * i) / coils;
        const sy = midY + (i % 2 === 0 ? -12 : 12) * (i === coils ? 0 : 1);
        ctx.lineTo(sx, sy);
      }
      ctx.lineTo(massX - 18, midY);
      ctx.stroke();

      // equilibrium line
      ctx.strokeStyle = "#e5e3dd";
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(eqX, midY - 52);
      ctx.lineTo(eqX, midY + 52);
      ctx.stroke();
      ctx.setLineDash([]);

      // mass
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.roundRect(massX - 18, midY - 18, 36, 36, 6);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("m", massX, midY + 4);

      // x(t) trace
      const gy = H * 0.72;
      ctx.strokeStyle = "#e5e3dd";
      ctx.beginPath();
      ctx.moveTo(20, gy);
      ctx.lineTo(W - 20, gy);
      ctx.stroke();

      ctx.strokeStyle = "#0f766e";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      trace.forEach((v, i) => {
        const px = W - 20 - (trace.length - 1 - i) * 1.4;
        const py = gy - v * 34;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();

      ctx.fillStyle = "#0f766e";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("x(t)", 24, gy - 40);

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [omega, A]);


  return (
    <div className="panel my-8 overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
        <span className="text-sm font-semibold text-[var(--text-strong)]">
          Oscillator lab
        </span>
        <span className="font-mono-num text-xs text-[var(--text-dim)]">
          T = {T.toFixed(2)} s · ω = {omega.toFixed(2)} rad/s
        </span>
      </div>
      <canvas ref={canvasRef} className="h-60 w-full" />
      <div className="grid gap-5 border-t border-[var(--line)] p-5 sm:grid-cols-3">
        <Slider label="Spring constant k" unit="N/m" value={k} min={4} max={80} step={1} onChange={setK} />
        <Slider label="Mass m" unit="kg" value={m} min={0.5} max={6} step={0.1} onChange={setM} />
        <Slider label="Amplitude" unit="m" value={A} min={0.2} max={1.2} step={0.05} onChange={setA} />
      </div>
    </div>
  );
}
