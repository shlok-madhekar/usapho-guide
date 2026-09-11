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

/** Starting slider values, taken from each param's declared default. */
export const paramValues = (params: SimParam[]): Record<string, number> =>
  Object.fromEntries(params.map((p) => [p.key, p.value]));
