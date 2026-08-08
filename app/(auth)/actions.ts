"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSession, roleHome, safeNextPath } from "@/lib/auth";
import { platformAdminEmail } from "@/lib/email/platform-admin";
import { sendEmail } from "@/lib/email/send";
import { applyPendingPlan } from "@/lib/plan/apply-pending";
import { placeUserInOrg } from "@/lib/provision";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface AuthFormState {
  error?: string;
  notice?: string;
  /** A center application went through — the form swaps to a success panel. */
  submitted?: boolean;
  /** The login the new center should sign in with, shown on that panel. */
  signInWith?: string;
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
  if (emailAlreadyRegistered(data.user)) {
    // Otherwise they're told to check an inbox nothing was sent to.
    return { error: "An account already uses this email address. Try signing in instead." };
  }
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
  if (!email || !password) return { error: "A contact email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!login) return { error: "Choose a login for the center to sign in with." };
  if (!/^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])$/.test(login)) {
    return {
      error: "A login must be 3–32 characters: letters, digits, and . _ - in the middle.",
    };
  }

  const admin = createAdminClient();

  // Logins are global, so a clash has to be reported before the account is
  // created — the trigger would otherwise fail the whole signup opaquely.
  const { data: takenLogin } = await admin
    .from("profiles")
    .select("id")
    .eq("username", login)
    .maybeSingle();
  if (takenLogin) return { error: `The login "${login}" is taken. Please choose another.` };

  const guard = await applicationGuard(admin, email);
  if (guard) return { error: guard };

  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${headerList.get("host")}`;

  // The address they sign in with is not necessarily the address we write to.
  // If the contact email is free, it serves as both, so email sign-in keeps
  // working. If it already belongs to somebody — very often the applicant's own
  // learner account — the auth identity moves to a synthetic address on a domain
  // we own, and the login carries them. `contact_email` holds the real one
  // regardless, which is what the trigger stores and where every notice goes.
  const emailFree = !(await emailInUse(admin, email));
  const authEmail = emailFree ? email : `${login}@centers.engprogress.com`;

  const { error } = await admin.auth.admin.createUser({
    email: authEmail,
    password,
    // We send our own "application received"; there is no inbox behind a
    // synthetic address to confirm anyway.
    email_confirm: true,
    user_metadata: {
      account_kind: "center",
      org_name: orgName,
      username: login,
      contact_email: email,
    },
  });
  if (error) return { error: error.message };

  // Tell the applicant we have it, and tell the platform owner to go look.
  // Both are best-effort: an application that succeeded must not be reported as
  // failed because a mail server was down. The admin queue is the real record.
  await Promise.all([
    sendEmail({
      to: email,
      subject: `We received your application — ${orgName}`,
      text:
        `Thanks for applying to EngProgress.\n\n` +
        `"${orgName}" is now in our review queue. We check every organization by hand, ` +
        `and you'll get an email as soon as yours is approved — usually within a working day.\n\n` +
        `Your login: ${login}\n` +
        `Keep it safe — it's how you'll sign in, together with the password you just chose.\n` +
        (emailFree
          ? ""
          : `Note: this email address already has a personal learner account, which stays ` +
            `separate. Use the login above for the center, not the email.\n`) +
        `\n— The EngProgress team`,
      html:
        `<p>Thanks for applying to EngProgress.</p>` +
        `<p><strong>${escapeHtml(orgName)}</strong> is now in our review queue. We check every ` +
        `organization by hand, and you'll get an email as soon as yours is approved — usually ` +
        `within a working day.</p>` +
        `<p>Your login: <strong>${escapeHtml(login)}</strong><br>` +
        `<span style="color:#5A6076">Keep it safe — it's how you'll sign in, together with the ` +
        `password you just chose.</span></p>` +
        (emailFree
          ? ""
          : `<p style="color:#5A6076">This email address already has a personal learner account, ` +
            `which stays separate. Use the login above for the center, not the email.</p>`) +
        `<p>— The EngProgress team</p>`,
    }),
    notifyPlatformAdmin(orgName, email, origin),
  ]);

  return {
    submitted: true,
    signInWith: login,
    notice: emailFree
      ? undefined
      : `That email already has a personal learner account, which stays separate. Sign in to the center with the login “${login}”.`,
  };
}

/**
 * Cheap abuse guards for a public endpoint that now creates auth users with the
 * service-role key, and so no longer sits behind Supabase's own signup throttle.
 * Two queries, no new tables: a repeat application from the same address, and a
 * burst of them from anywhere.
 */
async function applicationGuard(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<string | null> {
  const { data: already } = await admin
    .from("organizations")
    .select("id")
    .eq("kind", "center")
    .eq("contact_email", email)
    .eq("status", "pending")
    .maybeSingle();
  if (already) {
    return "We already have an application from this address and it's still under review.";
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("organizations")
    .select("id", { count: "exact", head: true })
    .eq("kind", "center")
    .gte("created_at", hourAgo);
  // No real hour brings twenty centers. A burst is a script.
  if ((count ?? 0) >= 20) {
    return "Too many applications right now. Please try again shortly.";
  }
  return null;
}

/** Is this address already an auth identity? The admin API has no lookup by
 *  email, so page through — cheap here, since applications are rare. */
async function emailInUse(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<boolean> {
  const wanted = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) return false;
    if (data.users.some((u) => u.email?.toLowerCase() === wanted)) return true;
    if (data.users.length < 200) return false;
  }
  return false;
}

/**
 * Did `signUp` quietly do nothing because the address is already taken?
 *
 * With email confirmation on, Supabase answers a duplicate signup with a
 * SUCCESS — a decoy user carrying an empty `identities` array, no session, and
 * no error — so the form can't be used to discover who has an account. Nothing
 * is created and no trigger fires, so the caller must not report success.
 *
 * Only the learner signup still needs this. Center applications go through the
 * admin API, which fails loudly instead.
 */
function emailAlreadyRegistered(user: { identities?: unknown[] | null } | null): boolean {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);
}

/** Nudge the platform owner that something is waiting in /admin. */
async function notifyPlatformAdmin(orgName: string, contact: string, origin: string) {
  const to = await platformAdminEmail();
  if (!to) return;
  await sendEmail({
    to,
    subject: `New center application: ${orgName}`,
    text:
      `${orgName} (${contact}) has applied for a center account.\n\n` +
      `Approve or reject: ${origin}/admin`,
    html:
      `<p><strong>${escapeHtml(orgName)}</strong> (${escapeHtml(contact)}) has applied for a center account.</p>` +
      `<p><a href="${origin}/admin">Review it in the admin console</a></p>`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
    // Recorded for getSession, but it does NOT stop handle_new_user building a
    // personal org — Supabase writes app_metadata after the INSERT. placeUserInOrg
    // reconciles that below.
    app_metadata: { organization_id: invite.organization_id, role: invite.role },
    user_metadata: { full_name: fullName || null },
  });
  if (createError || !created?.user) {
    return {
      error:
        createError?.message ?? "Could not create account — the email may already be registered.",
    };
  }

  const { error: placeError } = await placeUserInOrg(admin, created.user.id, {
    organizationId: invite.organization_id,
    role: invite.role,
    fullName: fullName || null,
  });
  if (placeError) {
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
