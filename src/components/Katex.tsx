import { memo } from "react";
import katex from "katex";

export function K({ children }: { children: string }) {
  const html = katex.renderToString(children, { throwOnError: false });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function KBlock({ children }: { children: string }) {
  const html = katex.renderToString(children, {
    throwOnError: false,
    displayMode: true,
  });
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Renders the small subset of markup used in problem statements and solutions:
 * $inline$ and $$display$$ math, **bold**, *italic*, and blank-line paragraphs.
 * Everything else is escaped, so bank text is never a script injection vector.
 */
function MarkishInner({ text }: { text: string }) {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const render = (chunk: string) => {
    // math first so escaping never mangles a formula
    const parts: string[] = [];
    const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(chunk))) {
      parts.push(inline(escape(chunk.slice(last, m.index))));
      parts.push(
        katex.renderToString(m[1] ?? m[2], {
          throwOnError: false,
          displayMode: Boolean(m[1]),
        })
      );
      last = m.index + m[0].length;
    }
    parts.push(inline(escape(chunk.slice(last))));
    return parts.join("");
  };

  const inline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+?)\*/g, "$1<em>$2</em>");

  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());

  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} dangerouslySetInnerHTML={{ __html: render(p.trim()) }} />
      ))}
    </>
  );
}

/**
 * Typesetting is the expensive part of rendering a problem, and problem text
 * never changes, so skip the work whenever the same text comes back.
 */
export const Markish = memo(MarkishInner);
Markish.displayName = "Markish";
