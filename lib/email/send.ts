import "server-only";

import nodemailer from "nodemailer";

import { serverEnv } from "@/lib/env";

export interface SendEmailResult {
  sent: boolean;
  /** Human-readable reason when sent=false — surfaced to the admin UI. */
  detail?: string;
}

/**
 * Send one transactional email over SMTP (serverEnv.smtp). Never throws:
 * approval must succeed even when email is down/unconfigured, so failures come
 * back as { sent: false, detail } for the caller to surface.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<SendEmailResult> {
  const smtp = serverEnv.smtp;
  if (!smtp) {
    console.warn("[email] SMTP not configured (SMTP_HOST…) — skipping:", options.subject);
    return { sent: false, detail: "SMTP is not configured (set SMTP_HOST/PORT/USER/PASS/FROM)." };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: smtp.user && smtp.pass ? { user: smtp.user, pass: smtp.pass } : undefined,
  });

  try {
    await transporter.sendMail({
      from: smtp.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return { sent: true };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[email] send failed:", detail);
    return { sent: false, detail };
  }
}
