import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** super_admin is platform-level (in app_metadata, no org); the rest are org-scoped. */
export type AppRole = "super_admin" | "center_admin" | "teacher" | "student";

export type OrgKind = "personal" | "center";
export type OrgStatus = "pending" | "active" | "rejected" | "suspended";

export interface Profile {
  id: string;
  organization_id: string;
  role: Exclude<AppRole, "super_admin">;
  full_name: string | null;
  /** Approval state of the workspace. Personal orgs are always 'active';
   *  centers start 'pending' until a super_admin approves them in /admin. */
  org: { kind: OrgKind; status: OrgStatus };
}

export interface Session {
  user: { id: string; email?: string };
  role: AppRole;
  /** null for super_admins (they have no org profile). */
  profile: Profile | null;
}

/**
 * A student who belongs to a CENTER practises what their teacher set them, and
 * nothing else — no browsable hubs, no self-serve generation. Owner decision,
 * 2026-08-09; it reverses the 2026-08-07 rule that a center student was an
 * ordinary learner.
 *
 * Scoped to `kind === 'center'` on purpose. A solo B2C learner has no teacher,
 * so the same restriction would leave them with nothing to practise — the
 * "never make a learner depend on a teacher" principle in CLAUDE.md still holds
 * for them, which is who it was written for.
 *
 * The org kind rides on the session already (see getSession), so this costs
 * nothing to check on every guarded route.
 */
export function isHomeworkOnlyStudent(profile: Profile | null): boolean {
  return profile?.role === "student" && profile.org.kind === "center";
}

/** Where a role lands after authenticating. */
export function roleHome(role: AppRole): "/admin" | "/dashboard" | "/console" {
  if (role === "super_admin") return "/admin";
  if (role === "student") return "/dashboard";
  return "/console";
}

/**
 * Validate a post-login `?next=` redirect target. Only an in-app absolute path is
 * allowed (never a protocol-relative `//host` or external URL — that would be an
 * open redirect), and we never bounce back into the auth flow. Returns the path or
 * null, so callers fall back to `roleHome`.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.startsWith("/auth") || raw.startsWith("/sign-")) return null;
  return raw;
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

  // Embed the org's approval state in the same query (profiles → organizations
  // FK) so gating on it costs no extra round trip.
  const { data } = await supabase
    .from("profiles")
    .select("id, organization_id, role, full_name, organizations!inner(kind, status)")
    .eq("id", user.id)
    .single();
  if (!data) return null;

  const { organizations: org, ...rest } = data as unknown as Omit<Profile, "org"> & {
    organizations: Profile["org"];
  };
  const profile: Profile = { ...rest, org };

  return { user: { id: user.id, email: user.email }, role: profile.role, profile };
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
  // A workspace that isn't approved (pending/rejected center, or a suspended
  // org) sees only the status page — no app, no console, no data.
  if (session.profile.org.status !== "active") redirect("/awaiting-approval");
  return { user: session.user, profile: session.profile };
}

/** Guard for the platform console (/admin). */
export async function requireSuperAdmin(): Promise<{ user: Session["user"] }> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "super_admin") redirect(roleHome(session.role));
  return { user: session.user };
}
