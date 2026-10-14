import type { MetadataRoute } from "next";

import { absoluteUrl, PUBLIC_ROUTES } from "@/lib/seo";

// Signed-in surfaces. These are behind auth anyway, but a crawler that follows
// them just collects redirects to /sign-in, which wastes crawl budget on a site
// whose indexable pages are all marketing.
const PRIVATE = [
  "/admin",
  "/api",
  "/auth",
  "/console",
  "/dashboard",
  "/activities",
  "/assignments",
  "/listen",
  "/speak",
  "/read",
  "/write",
  "/cefr",
  "/plan",
  "/vocabulary",
  // Authenticated (requireOrgUser) — redirects anonymous visitors to /sign-in.
  "/pricing",
];

/**
 * Public pages a private prefix would otherwise swallow.
 *
 * ⚠️ A ROBOTS RULE IS A PREFIX, NOT A PATH. `Disallow: /cefr` blocks
 * `/cefr-multilevel-practice` as surely as `/cefr` — and it did, for every
 * crawler including GPTBot and OAI-SearchBot, from the day that page was added
 * (2026-08-23) to 2026-10-15, while the sitemap listed it as a page to index.
 * The CEFR track's one marketing page was invisible to the answer engines it
 * was written for.
 *
 * Listing the page as an `Allow` wins: under RFC 9309 the LONGEST matching rule
 * applies, so the full path beats the shorter prefix. DERIVED from the public
 * routes, so the next page that happens to start like a private one is allowed
 * without anyone remembering this.
 */
const SHADOWED_PUBLIC = PUBLIC_ROUTES.map((r) => r.path as string).filter((p) =>
  PRIVATE.some((d) => p !== d && p.startsWith(d)),
);

/**
 * Answer engines are named explicitly rather than left to the `*` rule.
 *
 * They were already allowed by the wildcard, so this changes no behaviour — the
 * point is that these crawlers are the ones deciding how the product gets
 * described in an AI answer, and an explicit rule makes that intent legible to
 * whoever reads this file next (and survives someone later tightening `*`).
 *
 * GPTBot trains and indexes for ChatGPT; OAI-SearchBot and ChatGPT-User fetch
 * pages to answer live queries; the rest are the equivalents for Claude,
 * Perplexity and Google's AI surfaces.
 */
const ANSWER_ENGINES = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", ...SHADOWED_PUBLIC], disallow: PRIVATE },
      ...ANSWER_ENGINES.map((userAgent) => ({ userAgent, allow: ["/", ...SHADOWED_PUBLIC], disallow: PRIVATE })),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
