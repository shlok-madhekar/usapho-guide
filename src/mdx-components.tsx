import type { MDXComponents } from "mdx/types";
import Callout from "@/components/Callout";
import QuickCheck from "@/components/QuickCheck";
import Problem, { Solution, Hint } from "@/components/Problem";
import {
  ProjectileSim,
  SpringSim,
  MotionGraphSim,
  CollisionSim,
} from "@/components/sims";

/**
 * Components available in every lesson .mdx file without imports.
 * Add new interactive components here once and every lesson can use them.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    QuickCheck,
    Problem,
    Solution,
    Hint,
    ProjectileSim,
    SpringSim,
    MotionGraphSim,
    CollisionSim,
    ...components,
  };
}
