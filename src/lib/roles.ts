export type Role = "course_writer" | "problem_writer" | "admin";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  roles: Role[];
}

/**
 * Writing lessons, problems and simulations is open to anyone with a GitHub
 * account: those changes arrive as pull requests and are gated by review, not
 * by a role here. Roles cover the two things review cannot:
 *
 *   admin   may change the course structure, which reshapes every page
 *   writers are a label, so the maintainer can see who has contributed before
 */
export const ROLE_LABEL: Record<Role, string> = {
  course_writer: "Course writer",
  problem_writer: "Problem writer",
  admin: "Admin",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  course_writer: "Recognised as a regular contributor of lesson content.",
  problem_writer: "Recognised as a regular contributor of problems.",
  admin: "Can change the course structure: courses, sections and modules.",
};

export function hasRole(profile: Profile | null, ...roles: Role[]): boolean {
  if (!profile) return false;
  if (profile.roles.includes("admin")) return true;
  return roles.some((r) => profile.roles.includes(r));
}

/** Only structural edits are role-gated; everything else goes through review. */
export const canEditCurriculum = (p: Profile | null) => hasRole(p, "admin");
