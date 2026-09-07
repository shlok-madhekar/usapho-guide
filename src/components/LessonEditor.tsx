"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as runtime from "react/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Aside from "@/components/Aside";
import Figure from "@/components/Figure";
import QuickCheck from "@/components/QuickCheck";
import Sim from "@/components/Sim";
import { SIMS } from "@/lib/sims";

/**
 * Writing surface for lessons. The toolbar inserts the right markup so a
 * contributor never has to remember MDX, and the preview compiles the real
 * thing, so what they see is what the page will render.
 */

const COMPONENTS = { Aside, Figure, QuickCheck, Sim };

interface Insert {
  label: string;
  title: string;
  /** wraps the selection, or inserts a block when `block` is set */
  before?: string;
  after?: string;
  block?: string;
  placeholder?: string;
}

const INLINE: Insert[] = [
  { label: "B", title: "Bold", before: "**", after: "**", placeholder: "bold text" },
  { label: "I", title: "Italic", before: "*", after: "*", placeholder: "italic text" },
  { label: "Link", title: "Link", before: "[", after: "](https://)", placeholder: "text" },
  { label: "$x$", title: "Inline maths", before: "$", after: "$", placeholder: "v_0" },
];

const BLOCKS: Insert[] = [
  { label: "Heading", title: "Section heading", block: "\n## Heading\n\n" },
  { label: "List", title: "Bulleted list", block: "\n- First point\n- Second point\n\n" },
  {
    label: "Equation",
    title: "Displayed equation",
    block: "\n$$v = v_0 + at$$\n\n",
  },
  {
    label: "Note",
    title: "Aside",
    block: '\n<Aside label="Worth remembering">\n  Something short and concrete.\n</Aside>\n\n',
  },
  {
    label: "Warning",
    title: "Common mistake",
    block:
      '\n<Aside label="Where this goes wrong" warn>\n  The mistake people make here.\n</Aside>\n\n',
  },
  {
    label: "Question",
    title: "Multiple choice check",
    block:
      '\n<QuickCheck\n  question="Ask one thing."\n  options={["First", "Second", "Third", "Fourth"]}\n  answer={0}\n  explanation="Why the right answer is right."\n/>\n\n',
  },
];

export default function LessonEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [showSource, setShowSource] = useState(true);

  const apply = (ins: Insert) => {
    const el = areaRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    let next: string;
    let caret: number;

    if (ins.block) {
      next = value.slice(0, a) + ins.block + value.slice(b);
      caret = a + ins.block.length;
    } else {
      const selected = value.slice(a, b) || ins.placeholder || "";
      const wrapped = `${ins.before ?? ""}${selected}${ins.after ?? ""}`;
      next = value.slice(0, a) + wrapped + value.slice(b);
      caret = a + (ins.before?.length ?? 0) + selected.length;
    }
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const insertFigure = (simId: string) => {
    apply({
      label: "",
      title: "",
      block: `\n<Figure caption={<><b>Figure.</b> What the reader should notice.</>}>\n  <Sim id="${simId}" />\n</Figure>\n\n`,
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-y border-[var(--rule)] py-2">
        {INLINE.map((b) => (
          <ToolButton key={b.label} onClick={() => apply(b)} title={b.title}>
            {b.label}
          </ToolButton>
        ))}
        <span className="mx-1 h-4 w-px bg-[var(--rule)]" />
        {BLOCKS.map((b) => (
          <ToolButton key={b.label} onClick={() => apply(b)} title={b.title}>
            {b.label}
          </ToolButton>
        ))}
        <span className="mx-1 h-4 w-px bg-[var(--rule)]" />
        <select
          onChange={(e) => {
            if (e.target.value) insertFigure(e.target.value);
            e.target.value = "";
          }}
          defaultValue=""
          className="sans text-xs"
          title="Insert a simulation as a numbered figure"
        >
          <option value="">Insert figure…</option>
          {SIMS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowSource((v) => !v)}
          className="sans ml-auto text-xs text-[var(--ink-soft)] underline underline-offset-2"
        >
          {showSource ? "Preview only" : "Show source"}
        </button>
      </div>

      <div className={`mt-4 gap-6 ${showSource ? "lg:flex" : ""}`}>
        {showSource && (
          <textarea
            ref={areaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck
            className="mono h-[62vh] w-full text-[13px] leading-relaxed lg:w-1/2"
          />
        )}
        <div
          className={`min-w-0 ${showSource ? "lg:w-1/2" : ""} ${
            showSource ? "mt-4 lg:mt-0" : ""
          }`}
        >
          <p className="label mb-2">Preview</p>
          <div className="h-[62vh] overflow-y-auto border border-[var(--rule)] px-5 py-4">
            <MdxPreview source={value} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="sans rounded-sm px-2 py-1 text-xs text-[var(--ink-soft)] hover:bg-[var(--paper-2)] hover:text-[var(--ink-strong)]"
    >
      {children}
    </button>
  );
}

/** Compiles the MDX in the browser, debounced, and shows errors in place. */
function MdxPreview({ source }: { source: string }) {
  const [node, setNode] = useState<React.ReactNode>(null);
  const [error, setError] = useState<string | null>(null);

  const compile = useCallback(async (text: string) => {
    try {
      const mod = await evaluate(text, {
        ...runtime,
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
      } as Parameters<typeof evaluate>[1]);
      const Content = mod.default as React.ComponentType<{
        components: typeof COMPONENTS;
      }>;
      setNode(<Content components={COMPONENTS} />);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not render");
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => compile(source), 350);
    return () => clearTimeout(id);
  }, [source, compile]);

  return (
    <>
      {error && (
        <pre className="mono mb-3 whitespace-pre-wrap border-l-2 border-[var(--bad)] bg-[var(--bad-bg)] p-3 text-xs text-[var(--bad)]">
          {error}
        </pre>
      )}
      <article className="prose">{node}</article>
    </>
  );
}
