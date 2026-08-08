"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
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
  await requireSuperAdmin();

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

  revalidatePath("/admin");

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

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
