import "server-only";

import { serverEnv } from "@/lib/env";
import { LOGO_IMAGE } from "@/lib/seo";

import { bodyToHtml, EMAIL_FONT, EMAIL_PALETTE as P, htmlToText, toEmailHtml } from "./email-html";

/**
 * The message a learner actually opens.
 *
 * PLAIN TEXT IS NOT A COURTESY COPY. A bulk HTML email with no text part is one
 * of the loudest spam signals there is, so both are built from the same source
 * and neither can silently drift from the other — the composer stores one body
 * (HTML, see email-html.ts) and this renders both.
 *
 * LIGHT BRANDED, the owner's call (2026-10-17) over the plain letter this used
 * to be: the mark and the name at the top, the message on a white card, one
 * button where the author puts one, the unsubscribe line underneath. It stops
 * there on purpose. The same sender carries password resets, and every extra
 * image or tracking pixel spends deliverability those depend on — so no pixel,
 * no remote font, and the name in the header is TEXT, which survives a client
 * that blocks images.
 *
 * ⚠️ THE COLOURS ARE LITERALS (email-html.ts `EMAIL_PALETTE`) AND MUST STAY SO.
 * The house rule is `lib/theme/tokens.ts` everywhere — but every token in this
 * codebase is a CSS custom property, and `var(--tk-ink)` in an email resolves
 * to NOTHING: there is no stylesheet in a mail client, Gmail strips `<style>`
 * outright, and the result is unstyled black-on-white at best. An email is the
 * one surface that has to carry its colours inline and literal.
 */

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface BroadcastLink {
  label: string;
  url: string;
}

/**
 * Only http(s) survives.
 *
 * The composer is super-admin-only, so this is not defending against a hostile
 * author — it is defending the READER. `javascript:` and `data:` URLs in an
 * email are exactly what a phishing filter looks for, and one of them in a
 * footer is enough to land the whole broadcast in spam.
 */
export function isSafeUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

interface RenderArgs {
  body: string;
  links: BroadcastLink[];
  /** First name, for the greeting. */
  name: string;
  unsubscribeUrl: string;
}

export function renderText({ body, links, name, unsubscribeUrl }: RenderArgs): string {
  const parts = [`Hi ${name},`, "", htmlToText(bodyToHtml(body))];
  if (links.length > 0) {
    parts.push("", ...links.map((l) => `${l.label}: ${l.url}`));
  }
  parts.push(
    "",
    "—",
    "EngProgress",
    "",
    `You are receiving this because you have an EngProgress account.`,
    `Unsubscribe: ${unsubscribeUrl}`,
  );
  return parts.join("\n");
}

export function renderHtml({ body, links, name, unsubscribeUrl }: RenderArgs): string {
  const site = serverEnv.outboundSiteUrl;

  const linkList =
    links.length > 0
      ? `<div style="margin:20px 0 0;padding:12px 16px;border:1px solid ${P.rule};border-radius:10px;">${links
          .map(
            (l) =>
              `<div style="margin:4px 0;"><a href="${escapeHtml(l.url)}" style="color:${P.brand};text-decoration:underline;">${escapeHtml(l.label)}</a></div>`,
          )
          .join("")}</div>`
      : "";

  /* Tables for the frame, because Outlook on Windows lays out with Word and
     ignores a centred, max-width <div>. Inline styles only, and no stylesheet:
     every mail client strips <style> differently and Gmail drops it outright on
     forwarded mail. `color-scheme: light` asks Apple Mail not to invert the
     card into a dark mode it was never drawn for. */
  return [
    `<!doctype html><html lang="en"><head><meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width,initial-scale=1">`,
    `<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">`,
    `<title>EngProgress</title></head>`,
    `<body style="margin:0;padding:0;background:${P.page};">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${P.page};"><tr><td align="center" style="padding:24px 12px;">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${P.card};border:1px solid ${P.rule};border-radius:14px;">`,
    `<tr><td style="padding:22px 28px 0;">`,
    `<a href="${site}" style="text-decoration:none;">`,
    `<img src="${site}${LOGO_IMAGE}" width="32" height="32" alt="" style="display:inline-block;vertical-align:middle;border:0;border-radius:7px;">`,
    `<span style="display:inline-block;vertical-align:middle;margin-left:9px;font-family:${EMAIL_FONT};font-size:16px;font-weight:700;color:${P.ink};">EngProgress</span>`,
    `</a></td></tr>`,
    `<tr><td style="padding:20px 28px 26px;font-family:${EMAIL_FONT};font-size:15px;line-height:1.65;color:${P.body};">`,
    `<p style="margin:0 0 14px;">Hi ${escapeHtml(name)},</p>`,
    toEmailHtml(bodyToHtml(body)),
    linkList,
    `</td></tr></table>`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;"><tr>`,
    `<td style="padding:16px 28px 0;font-family:${EMAIL_FONT};font-size:12px;line-height:1.6;color:${P.muted};text-align:center;">`,
    `You are receiving this because you have an EngProgress account.<br>`,
    `<a href="${escapeHtml(unsubscribeUrl)}" style="color:${P.muted};text-decoration:underline;">Unsubscribe from updates like this</a>`,
    `</td></tr></table>`,
    `</td></tr></table>`,
    `</body></html>`,
  ].join("");
}
