import simsData from "@/content/sims.json";

/**
 * Simulations are data, not components, so they can be written and previewed
 * in the editor and shipped through a pull request like any other content.
 *
 * A sim declares its sliders and a `draw` body. The body is plain JavaScript
 * run once per animation frame with a small, documented set of locals. It is
 * repository content: it reaches readers only after a maintainer merges the
 * pull request that introduced it, the same trust boundary as any other code
 * in the repo.
 */

export interface SimParam {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

export interface SimDef {
  id: string;
  title: string;
  /** shown under the canvas when used inside a <Figure> */
  caption: string;
  height: number;
  params: SimParam[];
  /**
   * Body of the per-frame draw function. Receives:
   *   ctx  canvas 2d context, already scaled for device pixel ratio
   *   p    current slider values, keyed by param key
   *   t    seconds since the sim started
   *   W,H  canvas size in CSS pixels
   *   C    theme colours: ink, rule, accent, figure, faint, paper
   *   out  set out.note = "..." to show a readout above the canvas
   */
  draw: string;
}

export const SIMS: SimDef[] = simsData as SimDef[];

export const findSim = (id: string) => SIMS.find((s) => s.id === id);

export const paramValues = (params: SimParam[]): Record<string, number> =>
  Object.fromEntries(params.map((p) => [p.key, p.value]));

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
