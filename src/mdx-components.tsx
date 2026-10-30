import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef } from "react";
import Aside from "@/components/Aside";
import Figure from "@/components/Figure";
import QuickCheck from "@/components/QuickCheck";
import Sim from "@/components/Sim";
import { headingId } from "@/lib/search";

/**
 * Plain-text headings get an id, so search results and shared links can
 * point at a section. The rule matches the search index: a heading with
 * math or code in it arrives as elements rather than a string, and gets none.
 *
 * A heading with an id also shows a "#" link on hover (and on keyboard focus)
 * that points at the section, so a reader can grab a link straight to it. It
 * is a plain anchor, so it works with no JavaScript.
 */
const anchored = (Tag: "h2" | "h3") =>
  function Heading({ children, className, ...props }: ComponentPropsWithoutRef<"h2">) {
    const id = typeof children === "string" ? headingId(children) : undefined;
    if (!id) {
      return (
        <Tag className={className} {...props}>
          {children}
        </Tag>
      );
    }
    return (
      <Tag id={id} className={["group", className].filter(Boolean).join(" ")} {...props}>
        {children}
        <a
          href={`#${id}`}
          aria-label="Link to this section"
          className="heading-anchor ml-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 print:hidden"
        >
          #
        </a>
      </Tag>
    );
  };

/**
 * Components every lesson can use without importing anything.
 * Simulations are data now, so `<Sim id="..." />` covers all of them.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Aside,
    Figure,
    QuickCheck,
    Sim,
    h2: anchored("h2"),
    h3: anchored("h3"),
    ...components,
  };
}
