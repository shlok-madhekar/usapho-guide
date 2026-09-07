import "server-only";

import { createClient, authConfigured } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/roles";
import { hasRole } from "@/lib/roles";
import { editingEnabled } from "@/lib/content-store";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Resolve the caller's profile from their Supabase session cookie and require
 * at least one of the given roles. Admins always pass.
 */
export async function requireRole(...roles: Role[]): Promise<Profile> {
  if (!editingEnabled) {
    throw new ApiError(
      503,
      "Content editing is disabled on this deployment. Run the app locally (CONTENT_EDITING=on) where the git checkout lives."
    );
  }
  if (!authConfigured) {
    throw new ApiError(503, "Supabase is not configured on the server.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new ApiError(401, "Sign in to edit content.");

  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, roles")
    .eq("id", user.id)
    .maybeSingle();

  const profile: Profile = {
    id: user.id,
    email: data?.email ?? user.email ?? null,
    display_name: data?.display_name ?? null,
    roles: (data?.roles ?? []) as Role[],
  };

  if (!hasRole(profile, ...roles)) {
    throw new ApiError(
      403,
      `This action needs one of these roles: ${roles.join(", ")}.`
    );
  }
  return profile;
}

/** Git authorship for an editor's commit. */
export function authorFor(profile: Profile) {
  return {
    name: profile.display_name || profile.email?.split("@")[0] || "usapho-editor",
    email: profile.email || "editor@usapho.guide",
  };
}
