import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

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
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      ...ANSWER_ENGINES.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE })),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
