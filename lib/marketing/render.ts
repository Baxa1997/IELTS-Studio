import "server-only";

/**
 * The message a learner actually opens.
 *
 * PLAIN TEXT IS NOT A COURTESY COPY. A bulk HTML email with no text part is one
 * of the loudest spam signals there is, so both are built from the same source
 * and neither can silently drift from the other — the composer stores one body
 * and this renders both.
 *
 * Deliberately plain HTML: a table-based marketing template would look better
 * in Gmail and worse everywhere else, and every extra image and tracking pixel
 * costs deliverability we do not have to spend. This sends like a person wrote
 * it, because a person did.
 *
 * ⚠️ THE COLOUR LITERALS BELOW ARE CORRECT AND MUST NOT BE SWAPPED FOR TOKENS.
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
  const parts = [`Hi ${name},`, "", body.trim()];
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
  // Paragraphs from blank lines, <br> from single ones — what somebody typing
  // into a textarea means by pressing return.
  const paragraphs = body
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

  const linkList =
    links.length > 0
      ? `<div style="margin:22px 0 0">${links
          .map(
            (l) =>
              `<div style="margin:0 0 8px"><a href="${escapeHtml(l.url)}" style="color:#7A1F2B">${escapeHtml(l.label)}</a></div>`,
          )
          .join("")}</div>`
      : "";

  /* Inline styles only, and no stylesheet: every mail client strips <style>
     differently and Gmail drops it outright on forwarded mail. */
  return [
    `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#1C1B1F;max-width:560px">`,
    `<p style="margin:0 0 14px">Hi ${escapeHtml(name)},</p>`,
    paragraphs,
    linkList,
    `<hr style="border:none;border-top:1px solid #E7E4DE;margin:26px 0 14px">`,
    `<p style="margin:0;font-size:12px;color:#6B6862">`,
    `You are receiving this because you have an EngProgress account.<br>`,
    `<a href="${escapeHtml(unsubscribeUrl)}" style="color:#6B6862">Unsubscribe from updates like this</a>.`,
    `</p>`,
    `</div>`,
  ].join("");
}
