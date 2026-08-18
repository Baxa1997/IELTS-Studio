import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/** super_admin is platform-level (in app_metadata, no org); the rest are org-scoped. */
export type AppRole =
  | "super_admin"
  | "center_admin"
  | "administrator"
  | "teacher"
  | "student";

export type OrgKind = "personal" | "center";
export type OrgStatus = "pending" | "active" | "rejected" | "suspended";

export interface Profile {
  id: string;
  organization_id: string;
  role: Exclude<AppRole, "super_admin">;
  full_name: string | null;
  /**
   * How they sign in when they have no email. Center accounts always do.
   */
  username: string | null;
  /**
   * The REAL inbox, or null. Never `auth.users.email` — that is synthetic for
   * every center-created account (`login@students.engprogress.com`, a domain
   * with no mail exchanger), and showing it to a student is showing them an
   * address that does not exist and cannot receive anything.
   */
  contact_email: string | null;
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
 * The two capabilities that split the old `center_admin`, mirroring the SQL
 * functions of the same names (migration 20260813140000).
 *
 * Use these instead of comparing to a role string. A page that asks
 * `role === "center_admin"` silently excludes an administrator, and a page that
 * asks `role !== "teacher"` silently includes them — both are how a new role
 * leaks into places nobody meant it to go. RLS is still the gate; these decide
 * what to render.
 */

/** Owns the center: prices, payroll, the ledger, the plan, the settings. */
export function isOrgOwner(role: AppRole | undefined | null): boolean {
  return role === "center_admin";
}

/** Runs the center day to day: classes, rosters, attendance, the front desk. */
export function canManagePeople(role: AppRole | undefined | null): boolean {
  return role === "center_admin" || role === "administrator";
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
/**
 * Who is asking, once per request.
 *
 * WRAPPED IN `cache()`, and that wrapper is worth more than it looks. This
 * function makes a network call to Supabase Auth (`getUser` verifies the token
 * with the auth server — it does not merely read a cookie) and then a second
 * query for the profile and its organisation. It is called by the app layout,
 * by the console layout, and again by every page inside them, so a single
 * navigation was paying for that pair three or four times over, in series,
 * before anything rendered.
 *
 * `cache()` is React's own request-scoped memo: the first caller in a render
 * pass does the work and the rest get the same promise. It is per-REQUEST, so
 * nothing leaks between users — which is the property that makes it safe to use
 * on the function that decides who someone is.
 */
export const getSession = cache(async function getSession(): Promise<Session | null> {
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
    .select(
      "id, organization_id, role, full_name, username, contact_email, organizations!inner(kind, status)",
    )
    .eq("id", user.id)
    .single();
  if (!data) return null;

  const { organizations: org, ...rest } = data as unknown as Omit<Profile, "org"> & {
    organizations: Profile["org"];
  };
  const profile: Profile = { ...rest, org };

  return { user: { id: user.id, email: user.email }, role: profile.role, profile };
});

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

/**
 * What to show under someone's name: their real address, or their login.
 *
 * NEVER `auth.users.email`. A center-created account's auth address is
 * synthetic — `baha@students.engprogress.com`, on a domain with no mail
 * exchanger — so putting it in the profile menu tells a student they have an
 * inbox they do not have, and invites them to try to use it.
 *
 * Falling back to the login rather than to nothing is deliberate: it is the
 * thing they actually type to sign in, so it is worth being able to read it
 * back off the screen when a teacher asks.
 */
export function contactLabel(profile: Pick<Profile, "contact_email" | "username">): string | null {
  if (profile.contact_email) return profile.contact_email;
  return profile.username ? `@${profile.username}` : null;
}
