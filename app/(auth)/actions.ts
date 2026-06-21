"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSession, roleHome, safeNextPath } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface AuthFormState {
  error?: string;
  notice?: string;
}

/** Sign in with email + password, then route to `next` (if a safe in-app path was
 *  passed, e.g. from a "Try it free" CTA) or the role's home. */
export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };
  const next = safeNextPath(String(formData.get("next") ?? ""));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const session = await getSession();
  redirect(next ?? (session ? roleHome(session.role) : "/dashboard"));
}

/**
 * B2C self-signup. Creates an individual learner account; a database trigger
 * provisions a personal organization + student profile (handle_new_user). If the
 * project still requires email confirmation, we surface a "check your email"
 * notice; otherwise the session is live and we go to the dashboard.
 */
export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${headerList.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || null, phone: phone || null },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  if (!data.session) {
    return { notice: "Check your email to confirm your account, then sign in." };
  }
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

/**
 * Accept a tokenized invite: create the auth user, provision their profile in
 * the invite's org/role (NOT chosen by the student), mark the invite used, then
 * sign them in. Runs as service_role because the invitee has no session yet.
 */
export async function acceptInvite(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!token) return { error: "Missing invite token." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("invites")
    .select("id, email, organization_id, role")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();
  if (!invite) return { error: "This invite is invalid, already used, or expired." };

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    // organization_id present -> handle_new_user skips auto-provisioning; we
    // create the profile explicitly below in the invited org/role.
    app_metadata: { organization_id: invite.organization_id, role: invite.role },
    user_metadata: { full_name: fullName || null },
  });
  if (createError || !created?.user) {
    return {
      error:
        createError?.message ?? "Could not create account — the email may already be registered.",
    };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    organization_id: invite.organization_id,
    role: invite.role,
    full_name: fullName || null,
  });
  if (profileError) {
    // Roll back the orphaned auth user so the invite can be retried cleanly.
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "Could not set up your profile. Please contact your center." };
  }

  await admin.from("invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

  // Establish the session (sets cookies) then land on the student dashboard.
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: invite.email, password });
  redirect("/dashboard");
}
