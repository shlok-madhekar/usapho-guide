import type { ComponentType } from "react";

import ProjectileMotion from "./projectile-motion.mdx";
import Kinematics1D from "./kinematics-1d.mdx";
import VectorsCalculus from "./vectors-calculus.mdx";
import ForcesFbd from "./forces-fbd.mdx";
import EnergyMomentum from "./energy-momentum.mdx";
import Shm from "./shm.mdx";
import Electrostatics from "./electrostatics.mdx";

/**
 * Lesson registry: slug (from curriculum.ts) -> MDX component.
 * To add a lesson: drop a .mdx file in this folder, import it here,
 * and set hasContent: true on the matching module in lib/curriculum.ts.
 */
export const LESSONS: Record<string, ComponentType> = {
  "projectile-motion": ProjectileMotion,
  "kinematics-1d": Kinematics1D,
  "vectors-calculus": VectorsCalculus,
  "forces-fbd": ForcesFbd,
  "energy-momentum": EnergyMomentum,
  shm: Shm,
  electrostatics: Electrostatics,
};
