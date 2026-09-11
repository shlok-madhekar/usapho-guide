import simsData from "@/content/sims.json";
import type { SimDef } from "@/lib/sim-types";

/**
 * The whole catalogue. Only the editor should import this: it pulls every
 * simulation's draw code into the bundle. Lesson pages fetch the one sim they
 * need from /sims/<id>.json instead.
 */
export * from "@/lib/sim-types";

export const SIMS: SimDef[] = simsData as SimDef[];

export const findSim = (id: string) => SIMS.find((s) => s.id === id);

export const SIM_TEMPLATE = `// Draw one frame. See the reference below the editor.
const cx = W / 2, cy = H / 2;

ctx.strokeStyle = C.rule;
ctx.beginPath();
ctx.moveTo(0, cy);
ctx.lineTo(W, cy);
ctx.stroke();

const x = cx + Math.cos(t * p.speed) * p.radius;
const y = cy + Math.sin(t * p.speed) * p.radius;

ctx.strokeStyle = C.faint;
ctx.beginPath();
ctx.arc(cx, cy, p.radius, 0, Math.PI * 2);
ctx.stroke();

ctx.fillStyle = C.accent;
ctx.beginPath();
ctx.arc(x, y, 7, 0, Math.PI * 2);
ctx.fill();

out.note = "angle " + ((t * p.speed) % (2 * Math.PI)).toFixed(2) + " rad";
`;

export const NEW_SIM = (id: string): SimDef => ({
  id,
  title: "New simulation",
  caption: "Describe what the reader should notice.",
  height: 220,
  params: [
    { key: "radius", label: "Radius", unit: "px", min: 20, max: 100, step: 5, value: 60 },
    { key: "speed", label: "Angular speed", unit: "rad/s", min: 0.2, max: 4, step: 0.1, value: 1.2 },
  ],
  draw: SIM_TEMPLATE,
});
