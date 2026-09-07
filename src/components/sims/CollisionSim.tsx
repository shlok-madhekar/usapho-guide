"use client";

import { useEffect, useRef, useState } from "react";
import { Slider, SimShell } from "./SimShell";

export default function CollisionSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [m1, setM1] = useState(2);
  const [m2, setM2] = useState(1);
  const [u1, setU1] = useState(3);
  const [elastic, setElastic] = useState(true);
  const stateRef = useRef({ x1: 0, x2: 0, v1: 0, v2: 0, collided: false });

  // final velocities (u2 = 0)
  const v1f = elastic ? ((m1 - m2) / (m1 + m2)) * u1 : (m1 * u1) / (m1 + m2);
  const v2f = elastic ? ((2 * m1) / (m1 + m2)) * u1 : (m1 * u1) / (m1 + m2);
  const keLossPct = elastic ? 0 : (m2 / (m1 + m2)) * 100;

  useEffect(() => {
    stateRef.current = { x1: 60, x2: 0, v1: u1, v2: 0, collided: false };
  }, [m1, m2, u1, elastic]);

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

    const floor = H * 0.68;
    const s1 = 22 + m1 * 5; // block sizes scale with mass
    const s2 = 22 + m2 * 5;
    if (stateRef.current.x2 === 0) {
      stateRef.current.x1 = 60;
      stateRef.current.x2 = W * 0.55;
    }

    let raf: number;
    const draw = () => {
      const st = stateRef.current;
      const dt = 0.016;
      const scale = 26; // px per m/s
      st.x1 += st.v1 * scale * dt;
      st.x2 += st.v2 * scale * dt;

      // collision moment
      if (!st.collided && st.x1 + s1 >= st.x2) {
        st.collided = true;
        st.v1 = v1f;
        st.v2 = v2f;
        if (!elastic) st.x2 = st.x1 + s1; // stick together
      }
      if (!elastic && st.collided) st.x2 = st.x1 + s1;

      // reset once off screen
      if (st.x1 > W + 40 || st.x2 > W + 40) {
        st.x1 = 60;
        st.x2 = W * 0.55;
        st.v1 = u1;
        st.v2 = 0;
        st.collided = false;
      }

      ctx.clearRect(0, 0, W, H);

      // floor
      ctx.strokeStyle = "#d6d3cc";
      ctx.beginPath();
      ctx.moveTo(0, floor);
      ctx.lineTo(W, floor);
      ctx.stroke();

      const block = (x: number, size: number, color: string, label: string, vel: number) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, floor - size, size, size, 4);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, x + size / 2, floor - size / 2 + 4);
        // velocity arrow
        if (Math.abs(vel) > 0.05) {
          const cx = x + size / 2;
          const y = floor - size - 12;
          ctx.strokeStyle = "#57534e";
          ctx.beginPath();
          ctx.moveTo(cx, y);
          ctx.lineTo(cx + vel * 9, y);
          ctx.lineTo(cx + vel * 9 - Math.sign(vel) * 5, y - 3);
          ctx.moveTo(cx + vel * 9, y);
          ctx.lineTo(cx + vel * 9 - Math.sign(vel) * 5, y + 3);
          ctx.stroke();
        }
      };

      block(st.x1, s1, "#1d4ed8", "m₁", st.v1);
      block(st.x2, s2, "#0f766e", "m₂", st.v2);

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [m1, m2, u1, elastic, v1f, v2f]);

  return (
    <SimShell
      title="Collision lab"
      note={`after: v₁ = ${v1f.toFixed(2)}, v₂ = ${v2f.toFixed(2)} m/s · KE lost: ${keLossPct.toFixed(0)}%`}
      canvasRef={canvasRef}
      canvasClass="h-44 w-full"
      controls={
        <>
          <Slider label="Mass m₁ (moving)" unit="kg" value={m1} min={0.5} max={5} step={0.5} onChange={setM1} />
          <Slider label="Mass m₂ (at rest)" unit="kg" value={m2} min={0.5} max={5} step={0.5} onChange={setM2} />
          <div>
            <Slider label="Initial speed u₁" unit="m/s" value={u1} min={1} max={5} step={0.5} onChange={setU1} />
            <label className="mt-3 flex items-center gap-2 text-xs font-medium text-[var(--text-dim)]">
              <input
                type="checkbox"
                checked={elastic}
                onChange={(e) => setElastic(e.target.checked)}
              />
              Elastic (unchecked = perfectly inelastic)
            </label>
          </div>
        </>
      }
    />
  );
}
