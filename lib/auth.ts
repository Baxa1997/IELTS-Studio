import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** super_admin is platform-level (in app_metadata, no org); the rest are org-scoped. */
export type AppRole = "super_admin" | "center_admin" | "teacher" | "student";

export interface Profile {
  id: string;
  organization_id: string;
  role: Exclude<AppRole, "super_admin">;
  full_name: string | null;
}

export interface Session {
  user: { id: string; email?: string };
  role: AppRole;
  /** null for super_admins (they have no org profile). */
  profile: Profile | null;
}

/** Where a role lands after authenticating. */
export function roleHome(role: AppRole): "/admin" | "/dashboard" | "/console" {
  if (role === "super_admin") return "/admin";
  if (role === "student") return "/dashboard";
  return "/console";
}

/**
 * Resolve the current session's identity. super_admin is read from app_metadata
 * (set by the provisioning script, never user-editable); everyone else resolves
 * their role from their profile row, read under RLS (own row only).
 * Returns null when unauthenticated or authenticated-but-not-onboarded.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const appMeta = (user.app_metadata ?? {}) as { role?: string };
  if (appMeta.role === "super_admin") {
    return { user: { id: user.id, email: user.email }, role: "super_admin", profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, role, full_name")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return { user: { id: user.id, email: user.email }, role: (profile as Profile).role, profile };
}

/** Guard for org-scoped pages (/dashboard, /console). Sends super_admins to /admin. */
export async function requireOrgUser(): Promise<{
  user: Session["user"];
  profile: Profile;
}> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role === "super_admin") redirect("/admin");
  if (!session.profile) redirect("/sign-in");
  return { user: session.user, profile: session.profile };
}

/** Guard for the platform console (/admin). */
export async function requireSuperAdmin(): Promise<{ user: Session["user"] }> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "super_admin") redirect(roleHome(session.role));
  return { user: session.user };
}
