import type { MDXComponents } from "mdx/types";
import Aside from "@/components/Aside";
import Figure from "@/components/Figure";
import QuickCheck from "@/components/QuickCheck";
import {
  ProjectileSim,
  SpringSim,
  MotionGraphSim,
  CollisionSim,
} from "@/components/sims";

/**
 * Components every lesson can use without importing anything.
 * Add a new one here once and it is available in all MDX.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Aside,
    Figure,
    QuickCheck,
    ProjectileSim,
    SpringSim,
    MotionGraphSim,
    CollisionSim,
    ...components,
  };
}
