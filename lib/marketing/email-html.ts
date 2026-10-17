import "server-only";

import sanitizeHtml from "sanitize-html";

import { serverEnv } from "@/lib/env";

/**
 * A broadcast's body, from what the editor wrote to what a mail client shows.
 *
 * THE BODY IS STORED AS HTML — the editor's own output, cleaned. Three steps
 * turn it into mail, and each exists for a reason a browser would never need:
 *
 *   1. `cleanBody` — keep only what an email can carry: paragraphs, two
 *      heading levels, lists, a quote, a rule, links, pictures and the button.
 *      Run when the broadcast is saved AND again when it is rendered, so a
 *      body that reached the table some other way is cleaned all the same.
 *   2. `toEmailHtml` — put the styles ON each element. Mail clients ignore or
 *      strip a stylesheet (Gmail drops `<style>` on forwarded mail outright),
 *      so a style that is not inline is a style the reader never sees.
 *   3. `htmlToText` — the plain-text part, from the SAME cleaned HTML. A bulk
 *      HTML email with no text part is one of the loudest spam signals there
 *      is, and two separately written copies drift.
 *
 * Bodies written before the rich editor (2026-10-17) are plain text, typed
 * into a textarea; `bodyToHtml` tells the two apart, so a broadcast queued
 * under the old composer still renders the way it was written.
 */

/**
 * The email's colours: the LIGHT column of the site's tokens, copied.
 *
 * ⚠️ LITERALS ON PURPOSE. Every token in this codebase is a CSS custom property,
 * and `var(--tk-ink)` in an email resolves to NOTHING — a mail client has no
 * stylesheet to look it up in. An email is the one surface that has to carry
 * its colours inline and literal. `email-palette.test.ts` reads globals.css and
 * fails if one of these stops matching its token.
 */
export const EMAIL_PALETTE = {
  ink: "#16162e", // --tk-ink: headings
  body: "#4c4a63", // --tk-body: running text
  muted: "#6e6c87", // --tk-muted: the footer
  rule: "#e9edf2", // --tk-rule: borders and the divider
  card: "#ffffff", // --tk-panel: the message's own ground
  page: "#f1f3f6", // --tk-page-grad-bottom: the ground around it
  brand: "#7d0132", // --tk-brand: links and the quote's edge
  brandFill: "#7d0132", // --tk-brand-fill: the button, carrying white
} as const;

export const EMAIL_FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const P = EMAIL_PALETTE;

/** The editor's output, written before 2026-10-17, starts with a tag; a
 *  textarea's body never did. */
export function isHtmlBody(body: string): boolean {
  return /^\s*<(p|h[1-6]|ul|ol|blockquote|hr|img)\b/i.test(body);
}

/** A link written as a site path — what the editor's link box suggests —
 *  made absolute: `/practice/reading` means nothing inside an inbox. Only a
 *  single leading slash: `//host` is protocol-relative, and resolving it would
 *  hand the link to another site. */
function absolute(href: string): string {
  return href.startsWith("/") && !href.startsWith("//") ? `${serverEnv.outboundSiteUrl}${href}` : href;
}

/** Everything a broadcast may contain. */
const TAGS = ["p", "br", "h2", "h3", "strong", "em", "a", "ul", "ol", "li", "blockquote", "hr", "img"];

const CLEAN: sanitizeHtml.IOptions = {
  allowedTags: TAGS,
  allowedAttributes: { a: ["href"], img: ["src", "alt"], p: ["data-button"] },
  /* Defending the READER, not against the author (super-admin only): a
     `javascript:` or `data:` URL in an email is what a phishing filter looks
     for, and one sinks the whole broadcast. Pictures must be https — a mail
     client blocks or warns on anything else. */
  allowedSchemes: ["https", "http", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  transformTags: {
    b: "strong",
    i: "em",
    h1: "h2",
    h4: "h3",
    h5: "h3",
    h6: "h3",
    a: (tagName, attribs) => ({ tagName, attribs: attribs.href ? { ...attribs, href: absolute(attribs.href) } : attribs }),
  },
  // A picture whose address was refused is no picture at all.
  exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
};

/** Keep only what an email can carry. Idempotent, so it is safe to run twice. */
export function cleanBody(html: string): string {
  return (
    sanitizeHtml(html, CLEAN)
      // The editor puts a paragraph inside every list item and quote; in an
      // email its margin would double the gap. A single one is unwrapped.
      .replace(/<li><p>((?:(?!<\/?p[ >])[\s\S])*?)<\/p><\/li>/g, "<li>$1</li>")
      .replace(/<blockquote><p>((?:(?!<\/?p[ >])[\s\S])*?)<\/p><\/blockquote>/g, "<blockquote>$1</blockquote>")
      // Empty paragraphs at the end are the editor's, not the author's.
      .replace(/(<p><\/p>\s*)+$/, "")
      .trim()
  );
}

/** A body typed into the old textarea: blank line = paragraph, return = line break. */
export function legacyToHtml(text: string): string {
  const escape = (raw: string) => raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${escape(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

/** Either kind of stored body, as clean HTML. */
export function bodyToHtml(body: string): string {
  return isHtmlBody(body) ? cleanBody(body) : cleanBody(legacyToHtml(body));
}

/* ── 2. styles on every element ─────────────────────────────────────────── */

const STYLE: Record<string, string> = {
  p: "margin:0 0 14px;",
  h2: `margin:26px 0 10px;font-size:21px;line-height:1.3;font-weight:700;color:${P.ink};`,
  h3: `margin:22px 0 8px;font-size:17px;line-height:1.35;font-weight:700;color:${P.ink};`,
  a: `color:${P.brand};text-decoration:underline;`,
  ul: "margin:0 0 14px;padding-left:22px;",
  ol: "margin:0 0 14px;padding-left:22px;",
  li: "margin:0 0 6px;",
  blockquote: `margin:0 0 14px;padding:2px 0 2px 14px;border-left:3px solid ${P.brand};color:${P.ink};font-style:italic;`,
  hr: `border:none;border-top:1px solid ${P.rule};margin:22px 0;`,
  img: "display:block;max-width:100%;height:auto;border:0;border-radius:10px;margin:4px 0 16px;",
  strong: `font-weight:700;color:${P.ink};`,
};

const STYLED: sanitizeHtml.IOptions = {
  /* The input is already clean; this pass only dresses it. The tag list is
     still the short one, not `false`: "allow everything" would let a <script>
     through if one ever reached here, and sanitize-html says so on every call. */
  allowedTags: TAGS,
  allowedAttributes: false,
  transformTags: Object.fromEntries(
    Object.entries(STYLE).map(([tag, style]) => [
      tag,
      (tagName: string, attribs: sanitizeHtml.Attributes) => ({ tagName, attribs: { ...attribs, style } }),
    ]),
  ),
};

/** A button as a table cell: the one shape Outlook on Windows will pad and fill. */
function button(href: string, label: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 20px;"><tr>` +
    `<td style="border-radius:10px;background:${P.brandFill};">` +
    `<a href="${href}" style="display:inline-block;padding:12px 22px;font-family:${EMAIL_FONT};font-size:15px;font-weight:600;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:10px;">${label}</a>` +
    `</td></tr></table>`
  );
}

/** What `cleanBody` makes of the editor's button node. A button whose link
 *  was refused keeps its words as a plain paragraph. */
const BUTTON = /<p data-button>\s*(?:<a href="([^"]*)">([\s\S]*?)<\/a>|<a>([\s\S]*?)<\/a>|([\s\S]*?))\s*<\/p>/g;

/**
 * Clean HTML → HTML a mail client renders as written.
 *
 * The buttons are cut out FIRST and built by hand, because they are a
 * different shape (a table), not the same shape with a style; everything
 * between them is dressed by `STYLED`. A slice between two buttons is always a
 * run of whole blocks, since a button is a block of its own.
 */
export function toEmailHtml(clean: string): string {
  const style = (fragment: string) => (fragment.trim() ? sanitizeHtml(fragment, STYLED) : "");
  let out = "";
  let last = 0;
  for (const m of clean.matchAll(BUTTON)) {
    out += style(clean.slice(last, m.index));
    const href = m[1] ?? "";
    const label = m[2] ?? m[3] ?? m[4] ?? "";
    // A button with no words is an empty coloured box; it is left out.
    if (href && stripTags(label).trim()) out += button(href, label);
    else if (stripTags(label).trim()) out += style(`<p>${label}</p>`);
    last = m.index + m[0].length;
  }
  return out + style(clean.slice(last));
}

/* ── 3. the plain-text part ─────────────────────────────────────────────── */

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[e.toLowerCase()] ?? whole;
  });
}

const stripTags = (s: string) => s.replace(/<[^>]*>/g, "");

/**
 * Clean HTML → the text part. It reads the markup `cleanBody` produces —
 * lower-case tags, double-quoted attributes, escaped text — which is why a
 * handful of patterns can do it.
 */
export function htmlToText(clean: string): string {
  let s = clean
    // The button: its words, then where it goes — or nothing, as in the HTML.
    .replace(/<p data-button>\s*<a href="([^"]*)">([\s\S]*?)<\/a>\s*<\/p>/g, (_, href: string, label: string) =>
      stripTags(label).trim() ? `\n\n${stripTags(label).trim()}: ${href}\n\n` : "\n\n",
    )
    // Numbered lists keep their numbers; nesting is flattened.
    .replace(/<ol>([\s\S]*?)<\/ol>/g, (_, inner: string) => {
      let n = 0;
      return `\n\n${inner.replace(/<li>/g, () => `\n${++n}. `)}\n\n`;
    })
    .replace(/<li>/g, "\n- ")
    // A link: its words and its address, or the address alone if they are the same.
    .replace(/<a href="([^"]*)">([\s\S]*?)<\/a>/g, (_, href: string, label: string) => {
      const words = decode(stripTags(label)).trim();
      const url = decode(href);
      return !words || words === url ? href : `${stripTags(label).trim()} (${href})`;
    })
    .replace(/<img [^>]*?alt="([^"]+)"[^>]*>/g, "[$1]")
    .replace(/<br \/>/g, "\n")
    .replace(/<hr \/>/g, "\n\n---\n\n")
    .replace(/<\/?(p|p data-button|h2|h3|blockquote|ul|ol)>/g, "\n\n");
  s = decode(stripTags(s));
  return s
    .split("\n")
    // A non-breaking space arrives as the character itself (sanitize-html
    // decodes `&nbsp;`); in plain text it is just a space.
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
