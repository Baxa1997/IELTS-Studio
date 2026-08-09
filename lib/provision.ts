import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Placing a newly created auth user into the right organization.
 *
 * Why this exists: `handle_new_user` fires on every `auth.users` INSERT and
 * builds a personal workspace for anyone it doesn't recognise. It was meant to
 * stand down when `app_metadata.organization_id` was present — but Supabase's
 * admin API writes custom `app_metadata` keys *after* the INSERT, so the trigger
 * never sees them and that branch is dead. Every pre-provisioned user therefore
 * lands in a personal org first, and the caller's own `profiles` insert then
 * dies on a duplicate primary key.
 *
 * The obvious shortcut — move `organization_id` into `user_metadata`, which the
 * trigger *can* read — is a tenant breach: that field is writable by anyone
 * through the public `signUp` call, so a stranger could name any org and join
 * it. So we reconcile server-side instead, on the service-role client, trusting
 * nothing the client can set.
 */

type Admin = SupabaseClient;

export type OrgRole = "student" | "teacher" | "center_admin";

export interface OrgPlacement {
  organizationId: string;
  role: OrgRole;
  fullName?: string | null;
  username?: string | null;
  /**
   * Where to write to them — NOT how they sign in. A center-created account's
   * auth address is synthetic so it never occupies the global email namespace
   * (see migration 20260809130000); this is the real inbox.
   */
  contactEmail?: string | null;
}

/**
 * Drop the personal workspace the trigger just built for `userId`, if that is
 * genuinely what it is. Deleting the organization cascades the profile away.
 *
 * Deliberately timid: it refuses unless the org is `personal` and this user is
 * its only member. A pre-provisioned account is milliseconds old, so anything
 * else means we are looking at real data and should keep our hands off.
 */
async function removeAutoProvisionedOrg(
  admin: Admin,
  userId: string,
  keepOrgId?: string,
): Promise<{ error?: string }> {
  const { data: existing } = await admin
    .from("profiles")
    .select("id, organization_id")
    .eq("id", userId)
    .maybeSingle();

  // Nothing to undo — either the trigger stood down, or it never ran.
  if (!existing) return {};
  if (keepOrgId && existing.organization_id === keepOrgId) return {};

  const { data: org } = await admin
    .from("organizations")
    .select("id, kind")
    .eq("id", existing.organization_id)
    .maybeSingle();
  if (!org) return {};

  if (org.kind !== "personal") {
    return {
      error:
        "This account already belongs to an organization. Moving an existing account between organizations isn't supported.",
    };
  }

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", org.id);
  if ((count ?? 0) > 1) {
    return { error: "Refusing to remove a workspace that has other members in it." };
  }

  const { error } = await admin.from("organizations").delete().eq("id", org.id);
  return error ? { error: `Could not clear the auto-created workspace: ${error.message}` } : {};
}

/**
 * Give a freshly created auth user their real profile, in the real org.
 * Call immediately after `auth.admin.createUser`.
 */
export async function placeUserInOrg(
  admin: Admin,
  userId: string,
  placement: OrgPlacement,
): Promise<{ error?: string }> {
  const cleared = await removeAutoProvisionedOrg(admin, userId, placement.organizationId);
  if (cleared.error) return cleared;

  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      organization_id: placement.organizationId,
      role: placement.role,
      full_name: placement.fullName ?? null,
      ...(placement.username ? { username: placement.username } : {}),
      ...(placement.contactEmail !== undefined ? { contact_email: placement.contactEmail } : {}),
    },
    { onConflict: "id" },
  );
  return error ? { error: `Could not set up the profile: ${error.message}` } : {};
}

/**
 * Platform super admins sit above every organization, so they get no org and no
 * profile — but the trigger builds one anyway. Strip it back off.
 */
export async function clearOrgForPlatformUser(
  admin: Admin,
  userId: string,
): Promise<{ error?: string }> {
  return removeAutoProvisionedOrg(admin, userId);
}
