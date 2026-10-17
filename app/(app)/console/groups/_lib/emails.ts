import "server-only";

import { sendEmail } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";

import type { RlsClient } from "./accounts";

/**
 * Email an invite link to the address it was issued for.
 *
 * THE FORM ASKED FOR AN EMAIL AND THEN SENT NOTHING TO IT. The panel said so in
 * small print — "(no email is sent)" — and the staffer had to copy the link into
 * some other channel by hand, so an invite typed in and forgotten simply never
 * reached anybody. The link is still returned and shown: sending is best-effort,
 * and a failed send must leave the staffer able to pass it on themselves.
 *
 * The emailed link is built on `outboundSiteUrl`, not the request origin: the
 * token lives in the one production database, and a link to a dev machine's
 * localhost is dead in anybody else's inbox.
 */
export async function sendInviteEmail(args: {
  supabase: RlsClient;
  organizationId: string;
  to: string;
  role: string;
  token: string;
}): Promise<string> {
  const { data: org } = await args.supabase
    .from("organizations")
    .select("name")
    .eq("id", args.organizationId)
    .maybeSingle();
  const centerName = (org?.name as string | null) ?? "your center";
  const url = `${serverEnv.outboundSiteUrl}/accept-invite?token=${args.token}`;
  const as = args.role === "student" ? "a student" : args.role === "teacher" ? "a teacher" : "an administrator";

  const result = await sendEmail({
    to: args.to,
    subject: `You're invited to ${centerName} on EngProgress`,
    text:
      `Hi,\n\n` +
      `${centerName} has invited you to join them on EngProgress as ${as}.\n\n` +
      `Accept the invite and set your password here:\n${url}\n\n` +
      `The link works for 7 days. If you weren't expecting this, you can ignore it.\n\n— EngProgress`,
    html:
      `<p>Hi,</p>` +
      `<p><strong>${escapeHtml(centerName)}</strong> has invited you to join them on EngProgress as ${as}.</p>` +
      `<p><a href="${url}">Accept the invite</a> and set your password.</p>` +
      `<p>The link works for 7 days. If you weren't expecting this, you can ignore it.</p><p>— EngProgress</p>`,
  });

  return result.sent
    ? `Invite emailed to ${args.to}.`
    : `Couldn't email it (${result.detail}) — share the link below instead.`;
}

/** Email a student their sign-in details — a new account, or a password a
 *  teacher has just reset. Returns a line for the teacher about what happened;
 *  sending is best-effort, never a blocker. */
export async function sendCredentials(args: {
  to: string;
  name: string;
  login: string;
  password: string;
  centerName: string;
  kind?: "new" | "reset";
}): Promise<string> {
  // `outboundSiteUrl`: `siteUrl` is localhost whenever this runs off Vercel.
  const signInUrl = `${serverEnv.outboundSiteUrl}/sign-in`;
  const reset = args.kind === "reset";
  const lead = reset
    ? `${args.centerName} has set a new password for your EngProgress account. Your old one no longer works.`
    : `${args.centerName} has set up your EngProgress account for IELTS practice.`;
  const result = await sendEmail({
    to: args.to,
    subject: reset
      ? `Your new EngProgress password from ${args.centerName}`
      : `Your ${args.centerName} account on EngProgress`,
    text:
      `Hi ${args.name},\n\n` +
      `${lead}\n\n` +
      `Sign in here: ${signInUrl}\n` +
      `Login:    ${args.login}\n` +
      `Password: ${args.password}\n\n` +
      `Please change your password after you sign in.\n\n— EngProgress`,
    html:
      `<p>Hi ${escapeHtml(args.name)},</p>` +
      `<p>${escapeHtml(lead)}</p>` +
      `<p><a href="${signInUrl}">Sign in here</a></p>` +
      `<p>Login: <strong>${escapeHtml(args.login)}</strong><br>` +
      `Password: <strong>${escapeHtml(args.password)}</strong></p>` +
      `<p>Please change your password after you sign in.</p><p>— EngProgress</p>`,
  });

  return result.sent
    ? `Sign-in details emailed to ${args.to}.`
    : `Couldn't email the details (${result.detail}) — hand them over below instead.`;
}

/** A contact address a message can actually reach, or null. The synthetic
 *  students.engprogress.com address has no mail exchanger (`centerAuthEmail`). */
export function realContactEmail(raw: string | null | undefined): string | null {
  const email = raw?.trim() ?? "";
  return email.includes("@") && !email.endsWith("students.engprogress.com") ? email : null;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
