/**
 * Typesets the symbols in simulation labels the way the lesson text is set.
 *
 * Sims write their labels as plain strings: `omega = v / r`, `mu0 n I`,
 * `a_t = alpha r`. Drawn as-is those read like code. This wraps the canvas
 * context so every `fillText` call is split into segments: single letters and
 * Greek names become italic maths (KaTeX_Math, the same face as the page's
 * equations), subscripts and superscripts are raised and lowered, and ordinary
 * words stay in the readable sans. The sim's own draw code does not change.
 */

const GREEK: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", zeta: "ζ",
  eta: "η", theta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν",
  xi: "ξ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ", phi: "φ", chi: "χ",
  psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π",
  Sigma: "Σ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
};

const MATH_FONT = "KaTeX_Math";
const SUB = "0.7";

type Seg = { text: string; font: string; dy: number };

/** A lone letter after a number ("4.0 m") or a slash ("m/s") is a unit: keep it upright. */
function isUnitLetter(text: string, index: number, base: string, scripts: string) {
  if (base.length !== 1 || scripts) return false;
  const before = text.slice(0, index);
  return /\d\s*$/.test(before) || before.endsWith("/");
}


/** Family used for ordinary words: the site's sans, resolved once per page. */
let sansFamily = "system-ui, sans-serif";

export function setSansFamily(family: string) {
  if (family) sansFamily = family;
}

/** Make sure the KaTeX faces exist before a canvas asks for them. */
export function loadMathFonts(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return Promise.resolve();
  return Promise.all([
    document.fonts.load("italic 16px KaTeX_Math"),
    document.fonts.load("16px KaTeX_Main"),
  ]).then(() => undefined, () => undefined);
}

function parseFont(font: string) {
  const size = Number((font.match(/(\d+(?:\.\d+)?)px/) || [])[1]) || 12;
  const family = font.replace(/^.*?\d+(?:\.\d+)?px\s*/, "") || sansFamily;
  // sims ask for ui-sans-serif; use the site's sans instead
  const plainFamily = /sans-serif|system-ui/.test(family) ? sansFamily : family;
  return { size, plainFamily };
}

/**
 * Splits a label into typeset segments. A "symbol" is a Greek name or a
 * single letter, optionally followed by digits or _/^ scripts. Everything else
 * is kept as plain text, so ordinary English labels are untouched.
 */
function segments(text: string, size: number, plainFamily: string): Seg[] {
  const out: Seg[] = [];
  const atom = /([A-Za-z]+)(\d*)((?:_[A-Za-z0-9]+|\^[0-9+-]+)*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const plain = (s: string) => {
    if (s) out.push({ text: s, font: `${size}px ${plainFamily}`, dy: 0 });
  };
  while ((m = atom.exec(text))) {
    const [whole, base, digits, scripts] = m;
    // a Greek name glued to a capital (omegaR, alphaT) is a product of two symbols
    const glued = base.match(/^([a-z]+?)([A-Z])$/);
    const gluedGreek = glued && Object.prototype.hasOwnProperty.call(GREEK, glued[1]) ? glued : null;
    const isGreek = Object.prototype.hasOwnProperty.call(GREEK, base);
    const isLetter = base.length === 1;
    if (!isGreek && !isLetter && !gluedGreek) continue; // leave ordinary words alone
    if (isUnitLetter(text, m.index, base, scripts)) continue;
    plain(text.slice(last, m.index));
    last = m.index + whole.length;

    if (gluedGreek) {
      out.push({ text: GREEK[gluedGreek[1]], font: `italic ${size}px ${MATH_FONT}`, dy: 0 });
      out.push({ text: gluedGreek[2], font: `italic ${size}px ${MATH_FONT}`, dy: 0 });
    } else {
      const symbol = isGreek ? GREEK[base] : base;
      out.push({ text: symbol, font: `italic ${size}px ${MATH_FONT}`, dy: 0 });
    }

    const subs = digits + (scripts.match(/_([A-Za-z0-9]+)/g) || []).map((s) => s.slice(1)).join("");
    if (subs) out.push({ text: subs, font: `${Number(size) * Number(SUB)}px ${MATH_FONT}`, dy: size * 0.28 });
    const sups = (scripts.match(/\^([0-9+-]+)/g) || []).map((s) => s.slice(1)).join("");
    if (sups) out.push({ text: sups, font: `${size * Number(SUB)}px ${plainFamily}`, dy: -size * 0.42 });
  }
  plain(text.slice(last));
  return out;
}

/**
 * Wraps a canvas context. Calls to fillText are typeset; everything else is
 * forwarded untouched, so measureText, paths, fills and state all still work.
 */
export function mathContext(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
  const fillText = (text: string, x: number, y: number) => {
    const str = String(text);
    const { size, plainFamily } = parseFont(ctx.font);
    const parts = segments(str, size, plainFamily);
    const keepAlign = ctx.textAlign;
    const keepFill = ctx.fillStyle;
    const keepFont = ctx.font;

    // measure each segment in its own font, then lay them out in a row
    const widths = parts.map((s) => {
      ctx.font = s.font;
      return ctx.measureText(s.text).width;
    });
    const total = widths.reduce((a, b) => a + b, 0);
    let cx = x;
    if (keepAlign === "center") cx = x - total / 2;
    else if (keepAlign === "right" || keepAlign === "end") cx = x - total;

    ctx.textAlign = "left";
    parts.forEach((s, i) => {
      ctx.font = s.font;
      ctx.fillText(s.text, cx, y + s.dy);
      cx += widths[i];
    });
    ctx.textAlign = keepAlign;
    ctx.fillStyle = keepFill;
    ctx.font = keepFont;
  };

  return new Proxy(ctx, {
    get(target, prop) {
      if (prop === "fillText") return fillText;
      const v = Reflect.get(target, prop, target);
      return typeof v === "function" ? v.bind(target) : v;
    },
    set(target, prop, value) {
      Reflect.set(target, prop, value, target);
      return true;
    },
  }) as CanvasRenderingContext2D;
}

/**
 * The same rules for HTML labels (slider names, units): returns runs that a
 * component can render as maths or as plain text.
 */
export type LabelRun = { text: string; math: boolean; sub?: boolean; sup?: boolean };

export function typesetRuns(text: string): LabelRun[] {
  const runs: LabelRun[] = [];
  const atom = /([A-Za-z]+)(\d*)((?:_[A-Za-z0-9]+|\^[0-9+-]+)*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const plainRun = (t: string) => t && runs.push({ text: t, math: false });
  while ((m = atom.exec(text))) {
    const [whole, base, digits, scripts] = m;
    const glued = base.match(/^([a-z]+?)([A-Z])$/);
    const gluedGreek = glued && Object.prototype.hasOwnProperty.call(GREEK, glued[1]) ? glued : null;
    const isGreek = Object.prototype.hasOwnProperty.call(GREEK, base);
    if (!isGreek && base.length !== 1 && !gluedGreek) continue;
    if (isUnitLetter(text, m.index, base, scripts)) continue;
    plainRun(text.slice(last, m.index));
    last = m.index + whole.length;
    if (gluedGreek) {
      runs.push({ text: GREEK[gluedGreek[1]], math: true });
      runs.push({ text: gluedGreek[2], math: true });
    } else {
      runs.push({ text: isGreek ? GREEK[base] : base, math: true });
    }
    const subs = digits + (scripts.match(/_([A-Za-z0-9]+)/g) || []).map((x) => x.slice(1)).join("");
    if (subs) runs.push({ text: subs, math: true, sub: true });
    const sups = (scripts.match(/\^([0-9+-]+)/g) || []).map((x) => x.slice(1)).join("");
    if (sups) runs.push({ text: sups, math: false, sup: true });
  }
  plainRun(text.slice(last));
  return runs;
}
