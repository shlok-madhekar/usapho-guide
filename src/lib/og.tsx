import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

/**
 * The preview card shown when a link to the guide is shared (Discord,
 * iMessage, Slack, X). Drawn at build time in the site's own type: Source
 * Serif for the title, DM Sans for the rest.
 *
 * The image renderer cannot read woff2, so src/fonts/og holds woff copies of
 * the two faces it needs. Those are subset to Latin, so KaTeX's math faces
 * stand in for the few Greek letters and symbols in module titles (τ = Iα).
 */
export const OG_SIZE = { width: 1200, height: 630 };

const font = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts));
const FONTS = [
  { name: "Serif", data: font("src/fonts/og/SourceSerif4-700.woff"), weight: 700 as const },
  { name: "Sans", data: font("src/fonts/og/DMSans-500.woff"), weight: 500 as const },
  { name: "Math", data: font("node_modules/katex/dist/fonts/KaTeX_Math-Italic.woff"), weight: 400 as const },
  { name: "MathMain", data: font("node_modules/katex/dist/fonts/KaTeX_Main-Regular.woff"), weight: 400 as const },
];

// two lines at this size; a longer description would push the footer off
const clip = (text: string, max = 160) =>
  text.length <= max ? text : text.slice(0, text.lastIndexOf(" ", max)) + "…";

const INK = "#000000";
const SOFT = "#545454";
const RULE = "#e4e4e2";
const ACCENT = "#1f4fbf";

export function ogImage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "64px 80px",
          borderTop: `12px solid ${ACCENT}`,
          fontFamily: "Sans, Math, MathMain",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, color: SOFT }}>{eyebrow}</div>
          <div
            style={{
              marginTop: 24,
              fontFamily: "Serif, Math, MathMain",
              fontSize: title.length > 40 ? 64 : 76,
              lineHeight: 1.1,
              color: INK,
            }}
          >
            {title}
          </div>
          {description && (
            <div style={{ marginTop: 28, fontSize: 30, lineHeight: 1.4, color: SOFT }}>
              {clip(description)}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `2px solid ${RULE}`,
            paddingTop: 28,
            fontSize: 28,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", color: INK }}>
            <span style={{ color: ACCENT, fontFamily: "Math", fontSize: 36, marginRight: 14 }}>λ</span>
            USAPhO Guide
          </div>
          <div style={{ color: SOFT }}>usapho.one</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: FONTS }
  );
}
