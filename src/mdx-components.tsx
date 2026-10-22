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
 */
const anchored = (Tag: "h2" | "h3") =>
  function Heading({ children, ...props }: ComponentPropsWithoutRef<"h2">) {
    const id = typeof children === "string" ? headingId(children) : undefined;
    return (
      <Tag id={id} {...props}>
        {children}
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
