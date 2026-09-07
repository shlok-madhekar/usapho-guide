import type { MDXComponents } from "mdx/types";
import Aside from "@/components/Aside";
import Figure from "@/components/Figure";
import QuickCheck from "@/components/QuickCheck";
import Sim from "@/components/Sim";

/**
 * Components every lesson can use without importing anything.
 * Simulations are data now, so `<Sim id="..." />` covers all of them.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { Aside, Figure, QuickCheck, Sim, ...components };
}
