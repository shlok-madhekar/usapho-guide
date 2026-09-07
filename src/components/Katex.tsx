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
