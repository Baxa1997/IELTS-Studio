"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSession, roleHome, safeNextPath } from "@/lib/auth";
import { applyPendingPlan } from "@/lib/plan/apply-pending";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface AuthFormState {
  error?: string;
  notice?: string;
}

/**
 * Sign in with an email OR a login name, plus a password, then route to `next`
 * (if a safe in-app path was passed, e.g. from a "Try it free" CTA) or the
 * role's home.
 *
 * One field takes both: anything without an "@" is treated as a login and
 * resolved to its account server-side. Centers hand out credentials in class
 * and many of their students have no email, so a login is the only thing they
 * can be given — but Supabase Auth is still email/password underneath, and
 * that resolution is the whole trick.
 */
export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const identifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!identifier || !password) return { error: "Login and password are required." };
  const next = safeNextPath(String(formData.get("next") ?? ""));

  const isLogin = !identifier.includes("@");
  let email = identifier.toLowerCase();
  if (isLogin) {
    const resolved = await emailForLogin(email);
    // Same message whether the login is unknown or the password is wrong —
    // otherwise this form would tell a stranger which logins exist.
    if (!resolved) return { error: "Invalid login or password." };
    email = resolved;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: isLogin ? "Invalid login or password." : error.message };

  const session = await getSession();
  redirect(next ?? (session ? roleHome(session.role) : "/dashboard"));
}

/**
 * Look up the account email behind a login name — an org member's
 * `profiles.username`, or a super admin's app_metadata login (they have no
 * profile row, being above orgs). The `email_for_login` function covers both
 * and is service_role-only, so this is the sole path to that mapping and it
 * answers identically for an unknown login and a wrong password.
 */
async function emailForLogin(login: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("email_for_login", { p_login: login });
  if (error) {
    // Most likely the migration hasn't been applied yet — say so in the log
    // rather than leaving "invalid login" as the only clue.
    console.error("[auth] email_for_login failed:", error.message);
    return null;
  }
  return typeof data === "string" && data ? data : null;
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
    // Email confirmation required — the stashed plan (if any) applies when they
    // return through /auth/callback. Don't clear it here.
    return { notice: "Check your email to confirm your account, then sign in." };
  }
  // Session is live immediately: persist a plan stashed by the /start wizard and
  // send first-time learners into the diagnostic.
  const applied = await applyPendingPlan();
  redirect(applied ? "/diagnostic" : "/dashboard");
}

/**
 * Organization (center) self-application from the "Organization" tab of the
 * sign-up page. Same Supabase signup as B2C, but user_metadata carries
 * account_kind='center' + the official name, so handle_new_user provisions a
 * PENDING center org + center_admin profile instead of a personal workspace.
 * The account stays gated on /awaiting-approval until the super_admin approves
 * it in /admin (which sends the confirmation email).
 */
export async function signUpOrganization(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const orgName = String(formData.get("org_name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const login = String(formData.get("login") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!orgName) return { error: "Official organization name is required." };
  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (login && !/^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])$/.test(login)) {
    return {
      error: "A login must be 3–32 characters: letters, digits, and . _ - in the middle.",
    };
  }
  if (login) {
    // Logins are global, so a clash has to be reported before the account is
    // created — the trigger would otherwise fail the whole signup opaquely.
    const { data: taken } = await createAdminClient()
      .from("profiles")
      .select("id")
      .eq("username", login)
      .maybeSingle();
    if (taken) return { error: `The login "${login}" is taken. Please choose another.` };
  }

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
      data: { account_kind: "center", org_name: orgName, username: login || null },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  if (!data.session) {
    // Email confirmation required: confirm first, then the application waits
    // for admin review (the /awaiting-approval gate explains this after login).
    return {
      notice:
        "Check your inbox to confirm your email. Your organization application is then reviewed by our team — you'll receive a confirmation email once it's approved.",
    };
  }
  redirect("/awaiting-approval");
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
    .select("id, email, organization_id, role, group_id")
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

  // Invited straight into a group (phase 2): create the membership. Best-effort —
  // a failure here must not cost them the account they just set a password for;
  // the teacher can add them to the group by hand.
  if (invite.group_id) {
    const { error: memberError } = await admin.from("group_members").insert({
      group_id: invite.group_id,
      student_id: created.user.id,
      organization_id: invite.organization_id,
      added_by: null,
    });
    if (memberError) console.error("[accept-invite] group join failed:", invite.id, memberError);
  }

  await admin.from("invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

  // Establish the session (sets cookies) then land on the role's home — teachers
  // in the console, students on their dashboard.
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: invite.email, password });
  redirect(invite.role === "student" ? "/dashboard" : "/console");
}
