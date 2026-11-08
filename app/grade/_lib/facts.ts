/**
 * Free anonymous gradings before the sign-up wall. Mirrors the server's per-IP
 * cap (PUBLIC_GRADER_PER_IP, default 3) so the UI blocks at the same point the
 * API does. ONE count across the three tabs, because the server's is one count
 * too.
 *
 * ⚠️ IN A PLAIN MODULE, NOT IN grader.tsx. The page quotes this number in its
 * "at a glance" facts, and a value exported from a "use client" module arrives
 * in a server component as a client reference, not a number.
 */
export const FREE_LIMIT = 3;

/* The day the page's facts were last checked is NOT here any more: it is
   `/grade`'s `updated` in PUBLIC_ROUTES (lib/seo.ts), which the sitemap states
   as this page's `lastmod`, and page.tsx reads it with `pageUpdated()`.
   ⚠️ Do not bring it back as a value in this file — the client grader imports
   this module, and a call into lib/seo here would ship every public route to
   the browser with it. */

/** The official public IELTS Writing band descriptors (May 2023), on ielts.org —
 *  the document the rubric in .claude/skills/ielts-examiner restates. */
export const IELTS_WRITING_DESCRIPTORS_URL =
  "https://ielts.org/cdn/ielts-downloadable-assets/ielts-guidance-and-support/ielts-guides/ielts-writing-band-descriptors.pdf";
