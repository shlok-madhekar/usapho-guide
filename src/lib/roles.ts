export type Role = "course_writer" | "problem_writer" | "admin";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  roles: Role[];
}

export const ROLE_LABEL: Record<Role, string> = {
  course_writer: "Course writer",
  problem_writer: "Problem writer",
  admin: "Admin",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  course_writer: "Can write and edit lesson content (MDX), and add or remove lessons.",
  problem_writer: "Can edit the practice problem sets attached to each module.",
  admin: "Can do everything, including editing the curriculum structure.",
};

export function hasRole(profile: Profile | null, ...roles: Role[]): boolean {
  if (!profile) return false;
  if (profile.roles.includes("admin")) return true;
  return roles.some((r) => profile.roles.includes(r));
}

/** Can this profile edit lesson MDX and add/remove lessons? */
export const canEditLessons = (p: Profile | null) => hasRole(p, "course_writer");

/** Can this profile edit problem sets? */
export const canEditProblems = (p: Profile | null) => hasRole(p, "problem_writer");

/** Can this profile change curriculum structure (divisions, sections, modules)? */
export const canEditCurriculum = (p: Profile | null) => hasRole(p, "admin");
