"use server";

import { revalidatePath } from "next/cache";

import { recordAdminAction } from "@/lib/admin/audit";
import { isOrgOwner, requireSuperAdmin, type AppRole } from "@/lib/auth";
import { PLAN_ORDER, PLAN_TIERS, type OrgPlan } from "@/lib/billing/plans";
import { sendEmail } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
import { getUsageSummary } from "@/lib/quota";
import { isLiveSubscription } from "@/lib/billing/lifecycle";
import { notifyPlanActivated, notifyPlanRevoked } from "@/lib/billing/notify-expiry";
import { decideApplication, recordPayout } from "@/lib/referrals/admin";
import type { ReviewDecision } from "@/lib/referrals/types";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ReviewState {
  error?: string;
  notice?: string;
}

/**
 * Approve or reject a pending center application. super_admin only; runs on the
 * service-role client (status/approved_at are not client-writable — column
 * grants). Approval sends the confirmation email the center was promised at
 * sign-up; email failure never blocks the decision, it's just reported back.
 */
export async function reviewOrganization(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const { user } = await requireSuperAdmin();

  const orgId = String(formData.get("org_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!orgId || (decision !== "approve" && decision !== "reject")) {
    return { error: "Invalid review request." };
  }

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id, name, kind, status, contact_email")
    .eq("id", orgId)
    .single();
  if (!org || org.kind !== "center") return { error: "Organization not found." };
  if (org.status === "active" && decision === "approve") {
    return { notice: "Already approved." };
  }

  const approve = decision === "approve";
  const { error: updateError } = await admin
    .from("organizations")
    .update(
      approve
        ? { status: "active", approved_at: new Date().toISOString() }
        : { status: "rejected" },
    )
    .eq("id", orgId);
  if (updateError) return { error: `Update failed: ${updateError.message}` };

  // Recorded before the email: the decision has already landed in the database
  // at this point, and the log is about the decision, not the notification.
  await recordAdminAction({
    action: approve ? "center.approve" : "center.reject",
    targetKind: "organization",
    targetId: orgId,
    targetLabel: org.name,
    detail: { from: org.status, to: approve ? "active" : "rejected" },
    actor: { id: user.id, email: user.email },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/centers");
  revalidatePath("/admin/health");

  if (!org.contact_email) {
    return { notice: `${approve ? "Approved" : "Rejected"} — no contact email on file.` };
  }

  const signInUrl = `${serverEnv.siteUrl}/sign-in`;

  // The login, not the email, is how a center signs in — and for a center whose
  // contact address already belonged to a personal learner account, the email
  // is not a way in at all: it resolves to that other account. An approval
  // email that omits this leaves them locked out of an approved center.
  const { data: admins } = await admin
    .from("profiles")
    .select("username")
    .eq("organization_id", orgId)
    .eq("role", "center_admin")
    .limit(1);
  const login = admins?.[0]?.username ?? null;
  const credentials = login
    ? `\nSign in with your login: ${login}\n(and the password you chose when you applied)\n`
    : "";
  const credentialsHtml = login
    ? `<p>Sign in with your login: <strong>${escapeHtml(login)}</strong><br>` +
      `<span style="color:#5A6076">…and the password you chose when you applied.</span></p>`
    : "";

  const result = approve
    ? await sendEmail({
        to: org.contact_email,
        subject: `${org.name} is approved on EngProgress`,
        text:
          `Good news — your organization "${org.name}" has been approved.\n` +
          `${credentials}\n` +
          `Sign in and set up your center:\n${signInUrl}\n\n` +
          `— The EngProgress team`,
        html:
          `<p>Good news — your organization <strong>${escapeHtml(org.name)}</strong> has been approved.</p>` +
          credentialsHtml +
          `<p><a href="${signInUrl}">Sign in</a> to set up your center.</p>` +
          `<p>— The EngProgress team</p>`,
      })
    : await sendEmail({
        to: org.contact_email,
        subject: `Your EngProgress organization application`,
        text:
          `Thank you for applying. Unfortunately we couldn't approve "${org.name}" at this time.\n\n` +
          `If you believe this is a mistake, just reply to this email.\n\n— The EngProgress team`,
      });

  return {
    notice: result.sent
      ? `${approve ? "Approved" : "Rejected"} — email sent to ${org.contact_email}.`
      : `${approve ? "Approved" : "Rejected"}, but the email was NOT sent: ${result.detail}`,
  };
}

/**
 * Set a person's plan and their monthly allowances, by hand.
 *
 * WHAT THIS ACTUALLY EDITS. Plans and quotas live on the ORGANIZATION, and every
 * individual learner has a personal org of exactly one member — so for them this
 * reads as a per-user control and behaves as one. For anyone inside a center it
 * changes the whole center, which is why the caller has to send back the member
 * count it warned about: if the roll grew since the page rendered, the write is
 * refused rather than quietly landing on more people than the warning named.
 *
 * Blank limit = no override, i.e. fall back to the plan's own allowance. Zero is
 * a real value (blocked), so it is NOT treated as blank.
 *
 * Service-role, because `organizations.plan` is deliberately not client-writable
 * (column grants) — this is the sanctioned way it changes.
 */
export async function setAccountPlan(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const { user } = await requireSuperAdmin();

  const profileId = String(formData.get("profile_id") ?? "");
  const plan = String(formData.get("plan") ?? "");
  if (!profileId) return { error: "No account given." };
  if (!PLAN_ORDER.includes(plan as OrgPlan)) return { error: "That is not a plan." };

  const limit = (key: string): number | null | "bad" => {
    const raw = String(formData.get(key) ?? "").trim();
    if (raw === "") return null; // no override — the plan's own allowance applies
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) return "bad";
    return n;
  };
  const gradingLimit = limit("grading_limit");
  const generationLimit = limit("generation_limit");
  if (gradingLimit === "bad" || generationLimit === "bad") {
    return { error: "Limits must be whole numbers, or blank for the plan default." };
  }

  // Blank = no end date, which is how every hand-granted plan worked before.
  const until = grantEndFromDate(String(formData.get("until") ?? ""));
  if (until === "bad") return { error: "That end date is not a date." };
  if (until && plan === "trial") return { error: "An end date only applies to a paid plan." };
  if (until && Date.parse(until) <= Date.now()) return { error: "The end date has to be in the future." };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id, full_name")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return { error: "That account no longer exists." };

  // Read the old values before overwriting them — "changed the plan" is close to
  // useless in a log without what it changed FROM.
  const { data: before } = await admin
    .from("organizations")
    .select("plan, grading_monthly_limit, generation_monthly_limit")
    .eq("id", profile.organization_id)
    .maybeSingle();

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id);
  const members = count ?? 1;
  const acknowledged = Number(formData.get("member_count") ?? 0);
  if (members > 1 && members !== acknowledged) {
    return {
      error: `This workspace now has ${members} members, not ${acknowledged}. Reload and check before changing everyone's plan.`,
    };
  }

  const { data: sub } = await admin
    .from("subscriptions")
    .select("status, current_period_end, provider, external_subscription_id")
    .eq("organization_id", profile.organization_id)
    .maybeSingle();
  const manualRow = sub?.provider === "manual";

  // Refused BEFORE anything is written. A provider that is being paid decides
  // when its plan ends; an end date from here would overwrite that row and cut
  // the link its next renewal webhook needs.
  if (until && sub && !manualRow && isLiveSubscription(sub)) {
    return {
      error: `This account has a live ${String(sub.provider)} subscription, which decides when the plan ends. Leave the end date blank.`,
    };
  }

  const { error } = await admin
    .from("organizations")
    .update({
      plan,
      grading_monthly_limit: gradingLimit,
      generation_monthly_limit: generationLimit,
    })
    .eq("id", profile.organization_id)
    .select("id"); // RLS-filtered writes report success without this
  if (error) return { error: error.message };

  /* A HAND-GRANTED PLAN WITH AN END DATE IS A 'manual' SUBSCRIPTION ROW, so it
     ends the way a Payme or Click plan does: the nightly job reminds a week
     before, downgrades on the date and emails, and the quota reader stops
     honouring it the moment the date passes. `external_subscription_id` is
     cleared because a Stripe id left on this row would make that dead
     subscription's late events look like they are about this grant. */
  if (until) {
    const { error: grantError } = await admin
      .from("subscriptions")
      .upsert(
        {
          organization_id: profile.organization_id,
          provider: "manual",
          plan,
          status: "active",
          current_period_end: until,
          external_subscription_id: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id" },
      )
      .select("organization_id");
    if (grantError) {
      return { error: `The plan changed, but its end date was not saved: ${grantError.message}` };
    }
  } else if (
    /* A PLAN SET BY HAND OUTRANKS A SUBSCRIPTION NOBODY IS PAYING FOR.
       Comping somebody who once paid through Payme or Click used to leave their
       old row open with a date in the past — and the nightly job and the quota
       reader both read it as "lapsed" and put them straight back on trial. The
       grant lasted until the next morning. A live PAID row is left alone:
       somebody is paying and its provider still governs it.

       ⚠️ A 'manual' row is closed whenever the end date is left blank, even with
       the plan unchanged — blank means "no end date", and an open manual row
       would still end the plan on its old date. */
    sub &&
    sub.status !== "canceled" &&
    (manualRow || (before?.plan !== plan && !isLiveSubscription(sub)))
  ) {
    await admin
      .from("subscriptions")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("organization_id", profile.organization_id)
      .neq("status", "canceled")
      .select("organization_id");
  }

  /* TELL THEM. A plan changed by hand used to be the one plan change nobody
     heard about — Stripe, Payme and Click each announce a start, a renewal and
     an end, and a comp or a withdrawal from here said nothing, so a learner
     moved to free discovered it at the quota wall. Only a real change of plan
     mails; editing the limits alone does not. Between two paid tiers it is a
     new plan starting, so that is what they are told. Both notices swallow
     their own failures, so the plan change above can never be undone by SMTP. */
  const previousEnd = manualRow && sub?.status !== "canceled" ? Date.parse(String(sub?.current_period_end)) : NaN;
  const endMoved = until !== null && Date.parse(until) !== previousEnd;
  if (before?.plan && (before.plan !== plan || endMoved)) {
    const at = new Date().toISOString();
    if (plan === "trial") {
      await notifyPlanRevoked(profile.organization_id as string, String(before.plan), at);
    } else {
      // An extension is announced too — "this period runs until …" is the
      // thing that changed.
      await notifyPlanActivated(profile.organization_id as string, plan, until, at);
    }
  }

  await recordAdminAction({
    action: before?.plan !== plan ? "user.plan_change" : "user.limits_change",
    targetKind: "user",
    targetId: profileId,
    targetLabel: profile.full_name ?? "Account",
    detail: {
      from: before?.plan ?? null,
      to: plan,
      gradingLimit,
      generationLimit,
      until,
      // Named so the log tells you a change hit a whole centre, not one person.
      members,
    },
    actor: { id: user.id, email: user.email },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/admin/health");
  const untilLabel = until
    ? ` until ${new Date(until).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Tashkent" })}`
    : "";
  return {
    notice:
      members > 1
        ? `${PLAN_TIERS[plan as OrgPlan].name} applied to all ${members} members${untilLabel}.`
        : `${profile.full_name ?? "Account"} is now on ${PLAN_TIERS[plan as OrgPlan].name}${untilLabel}.`,
  };
}

/**
 * The moment a hand-granted plan ends, from the dialog's `YYYY-MM-DD`.
 *
 * The END of the chosen day, in Tashkent — "Pro until the 26th" means the 26th
 * is still paid for, and the owner and nearly every learner are on UTC+5. A
 * midnight-UTC reading would have ended it at 05:00 local on the day itself.
 */
function grantEndFromDate(raw: string): string | null | "bad" {
  const day = raw.trim();
  if (!day) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "bad";
  const end = Date.parse(`${day}T23:59:59+05:00`);
  return Number.isFinite(end) ? new Date(end).toISOString() : "bad";
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Suspend an account, or bring it back.
 *
 * WHAT IT ACTUALLY TOUCHES. `organizations.status`, because that is the only
 * switch the app honours — `requireOrgUser` sends anyone whose org is not
 * `active` to /awaiting-approval, so this locks every member out at the door
 * rather than relying on a flag some page might forget to check.
 *
 * WHICH MEANS THE BLAST RADIUS MATTERS. For an individual learner the org has
 * exactly one member and this reads as "suspend this person". For anyone inside
 * a centre it would lock out the whole centre, so the caller has to send back
 * the member count it warned about — the same guard `setAccountPlan` uses, and
 * for the same reason: the roll can grow between the page rendering and the
 * button being pressed.
 *
 * Nothing is deleted and no work is lost. Restoring puts the org back to
 * `active` and everyone signs in again.
 */
export async function setAccountSuspended(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const { user } = await requireSuperAdmin();

  const profileId = String(formData.get("profile_id") ?? "");
  const orgId = String(formData.get("org_id") ?? "");
  const suspend = String(formData.get("suspend") ?? "") === "1";
  if (!profileId && !orgId) return { error: "No account given." };

  const admin = createAdminClient();

  let targetOrg = orgId;
  let label = String(formData.get("label") ?? "") || "Account";
  if (!targetOrg) {
    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", profileId)
      .maybeSingle();
    if (!profile) return { error: "That account no longer exists." };
    targetOrg = profile.organization_id as string;
    label = (profile.full_name as string | null) ?? label;
  }

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, kind, status, contact_email")
    .eq("id", targetOrg)
    .maybeSingle();
  if (!org) return { error: "That workspace no longer exists." };
  if (org.kind === "center") label = org.name as string;

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", targetOrg);
  const members = count ?? 1;
  const acknowledged = Number(formData.get("member_count") ?? 0);
  if (members > 1 && members !== acknowledged) {
    return {
      error: `This workspace now has ${members} members, not ${acknowledged}. Reload and check before locking everyone out.`,
    };
  }

  const next = suspend ? "suspended" : "active";
  if (org.status === next) return { notice: suspend ? "Already suspended." : "Already active." };

  const { data, error } = await admin
    .from("organizations")
    .update({ status: next })
    .eq("id", targetOrg)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "That workspace could not be changed." };

  await recordAdminAction({
    action: org.kind === "center"
      ? (suspend ? "center.suspend" : "center.restore")
      : (suspend ? "user.suspend" : "user.restore"),
    targetKind: org.kind === "center" ? "organization" : "user",
    targetId: org.kind === "center" ? targetOrg : profileId,
    targetLabel: label,
    detail: { from: org.status, to: next, members },
    actor: { id: user.id, email: user.email },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/centers");
  revalidatePath(`/admin/centers/${targetOrg}`);
  revalidatePath("/admin/health");

  const mail = await sendStatusEmail({
    organizationId: targetOrg,
    isCenter: org.kind === "center",
    centerName: org.name as string,
    centerEmail: (org.contact_email as string | null) ?? null,
    suspended: suspend,
  });

  const done = suspend
    ? members > 1
      ? `${label} suspended — all ${members} members are locked out.`
      : `${label} is suspended and cannot sign in.`
    : `${label} is active again.`;
  return { notice: `${done} ${mail}` };
}

/**
 * Tell the account's owner they have been locked out, or let back in.
 *
 * A SUSPENSION USED TO ARRIVE AS A SIGN-IN THAT STOPPED WORKING, which reads as
 * a broken site rather than a decision — and a reinstatement was invisible
 * until somebody happened to try again. Returns a line for the admin, the same
 * contract as the approval email above: sending never blocks the decision.
 *
 * WHO. A centre's owner, at the address the centre applied with; a learner, at
 * their own. Never every member of a centre — the students did not do anything,
 * and their teacher can tell them. Never a synthetic students.engprogress.com
 * address, which goes nowhere.
 *
 * ⚠️ The copy invites no reply. Inbound mail to engprogress.com is dead (see
 * EMAIL-SETUP.md), so "reply to this email" would be a promise nobody can keep.
 */
async function sendStatusEmail(args: {
  organizationId: string;
  isCenter: boolean;
  centerName: string;
  centerEmail: string | null;
  suspended: boolean;
}): Promise<string> {
  const admin = createAdminClient();
  const { data: members } = await admin
    .from("profiles")
    .select("id, full_name, contact_email, role")
    .eq("organization_id", args.organizationId);
  const owner = args.isCenter
    ? (members ?? []).find((m) => isOrgOwner(m.role as AppRole))
    : (members ?? [])[0];

  let to = (args.isCenter ? args.centerEmail : null) ?? owner?.contact_email ?? "";
  if (!to && owner) {
    const { data: user } = await admin.auth.admin.getUserById(String(owner.id));
    to = user?.user?.email ?? "";
  }
  to = to.trim();
  if (!to || !to.includes("@") || to.endsWith("students.engprogress.com")) {
    return "No email sent — there is no real address on file.";
  }

  const name = args.isCenter ? args.centerName : ((owner?.full_name as string | null)?.split(" ")[0] ?? "there");
  const what = args.isCenter ? `${args.centerName} on EngProgress` : "your EngProgress account";
  const signInUrl = `${serverEnv.outboundSiteUrl}/sign-in`;
  const kept = "Nothing has been deleted — every essay, test, band and piece of feedback is kept exactly as it was.";
  const lead = args.suspended
    ? `We've suspended ${what}, so ${args.isCenter ? "nobody at the centre" : "you"} can sign in for now. ${kept}`
    : `${args.isCenter ? args.centerName : "Your EngProgress account"} is active again, and signing in works as before. ${kept}`;

  const result = await sendEmail({
    to,
    subject: args.suspended
      ? args.isCenter
        ? `${args.centerName} is suspended on EngProgress`
        : "Your EngProgress account is suspended"
      : args.isCenter
        ? `${args.centerName} is active again on EngProgress`
        : "Your EngProgress account is active again",
    text:
      `Hi ${name},\n\n${lead}\n\n` +
      (args.suspended ? "" : `Sign in: ${signInUrl}\n\n`) +
      `— The EngProgress team`,
    html:
      `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(lead)}</p>` +
      (args.suspended ? "" : `<p><a href="${signInUrl}">Sign in</a></p>`) +
      `<p>— The EngProgress team</p>`,
  });
  return result.sent ? `Email sent to ${to}.` : `The email was NOT sent: ${result.detail}`;
}

/**
 * This month's usage for one account, fetched when the manage dialog opens.
 *
 * NOT loaded with the table. It is three counting queries per organization, and
 * a list of five hundred would mean fifteen hundred of them to render a line
 * almost nobody reads. One dialog, one lookup, at the moment it is wanted.
 *
 * Reuses `getUsageSummary`, which is the same function the learner's own plan
 * card reads — so what the owner sees here and what the learner is actually
 * allowed can never drift apart.
 */
export async function loadAccountUsage(
  profileId: string,
): Promise<{
  gradeUsed: number;
  gradeLimit: number | null;
  practiceUsed: number;
  practiceLimit: number | null;
  /** The open hand-granted end date, as `YYYY-MM-DD` in Tashkent, for the
   *  dialog's date field; null when the plan has none. */
  grantEndsOn: string | null;
} | null> {
  await requireSuperAdmin();
  if (!profileId) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return null;

  const [usage, { data: sub }] = await Promise.all([
    getUsageSummary(profile.organization_id as string),
    admin
      .from("subscriptions")
      .select("provider, status, current_period_end")
      .eq("organization_id", profile.organization_id)
      .maybeSingle(),
  ]);
  const open = sub?.provider === "manual" && sub.status !== "canceled" && sub.current_period_end;
  return {
    gradeUsed: usage.grade.used,
    gradeLimit: usage.grade.limit,
    practiceUsed: usage.generate.used,
    practiceLimit: usage.generate.limit,
    // en-CA formats as YYYY-MM-DD, which is what <input type="date"> takes.
    grantEndsOn: open
      ? new Date(String(sub.current_period_end)).toLocaleDateString("en-CA", { timeZone: "Asia/Tashkent" })
      : null,
  };
}

/**
 * Approve, reject or stop one referral application. super_admin only, on the
 * service-role client — `status`, `code` and `percent` are outside the column
 * grants, so this is the only path that can move them.
 *
 * The two stops are separate values rather than a boolean because they mean
 * different things to the ledger: `close` leaves commission alone, `revoke`
 * reverses what is still inside its hold. Collapsing them would make the
 * expensive case unreachable from the UI.
 */
export async function reviewReferral(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const { user } = await requireSuperAdmin();

  const accountId = String(formData.get("account_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const valid = ["approve", "reject", "close", "revoke"] as const;
  if (!accountId || !valid.includes(decision as (typeof valid)[number])) {
    return { error: "Invalid review request." };
  }
  const note = String(formData.get("note") ?? "").trim() || null;

  // Blank means "leave it alone", which is not the same as zero — an empty
  // field must not silently set somebody's rate to nothing.
  const rawPercent = String(formData.get("percent") ?? "").trim();
  const percent = rawPercent === "" ? null : Number(rawPercent);
  if (percent !== null && !Number.isFinite(percent)) {
    return { error: "That rate isn't a number." };
  }

  const { error, notice } = await decideApplication({
    accountId,
    decision: decision as ReviewDecision,
    note,
    reviewerId: user.id,
    percent,
  });
  if (error) return { error };

  // Logged after the decision has landed, and never allowed to undo it —
  // recordAdminAction swallows its own failures for exactly this reason.
  await recordAdminAction({
    action: `referral.${decision}` as
      | "referral.approve"
      | "referral.reject"
      | "referral.close"
      | "referral.revoke",
    targetKind: "referral",
    targetId: accountId,
    detail: { ...(note ? { note } : {}), ...(percent !== null ? { percent } : {}) },
    actor: { id: user.id, email: user.email },
  });

  revalidatePath("/admin/referrals");
  revalidatePath(`/admin/referrals/${accountId}`);
  return { notice: notice ?? "Done." };
}


/**
 * Mark one referrer's cleared balance as paid.
 *
 * RECORDS A TRANSFER, DOES NOT MAKE ONE. The money moves in a bank app or a
 * Payme dashboard; this writes down that it did and settles the commissions it
 * covered. That asymmetry is why `reference` matters more than it looks — it is
 * the only durable link between this row and the real transfer, and the only
 * thing anybody can reconcile against months later.
 *
 * Deliberately takes no amount. The sum is derived from the commissions that
 * have actually cleared, so a typo cannot settle more than is owed, and a
 * reviewer cannot quietly pay a different number than the ledger says.
 */
export async function markReferralPaid(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const { user } = await requireSuperAdmin();

  const referralAccountId = String(formData.get("account_id") ?? "");
  const currency = String(formData.get("currency") ?? "").toLowerCase();
  if (!referralAccountId || !currency) return { error: "Invalid payout request." };

  const { error, notice } = await recordPayout({
    referralAccountId,
    currency,
    reference: String(formData.get("reference") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
    markedBy: user.id,
  });
  if (error) return { error };

  await recordAdminAction({
    action: "referral.payout",
    targetKind: "referral",
    targetId: referralAccountId,
    detail: { currency, reference: String(formData.get("reference") ?? "").trim() || null },
    actor: { id: user.id, email: user.email },
  });

  revalidatePath("/admin/referrals/payouts");
  revalidatePath("/admin/referrals");
  revalidatePath(`/admin/referrals/${referralAccountId}`);
  return { notice: notice ?? "Recorded." };
}
