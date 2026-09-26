import { PLAN_ORDER, planTier } from "@/lib/billing/plans";
import { POSTS } from "@/lib/blog";
import { DEFAULT_LOCALE, LOCALE_NAMES, LOCALES, localePath } from "@/lib/i18n/locales";
import { absoluteUrl, PLATFORM_FEATURES, PUBLIC_ROUTES, SEO_DESCRIPTION, SITE_NAME } from "@/lib/seo";

/**
 * GET /llms.txt — the site, summarised for answer engines (llmstxt.org).
 *
 * WHY. ChatGPT, Perplexity and Claude answer "what is EngProgress / how much is
 * it / does it do speaking?" from whatever they last read, and the marketing
 * pages are long, partly client-rendered and mostly English under an Uzbek
 * `<html lang>`. This is the short, plain version they can quote.
 *
 * ⚠️ EVERY LINE IS DERIVED, NOTHING IS WRITTEN HERE. The description and the
 * capability list are the ones the JSON-LD already publishes (lib/seo.ts), the
 * pages are the sitemap's own list, and the plans come from PLAN_TIERS — so a
 * price change or a new page reaches this file without anyone remembering it.
 * And because PLATFORM_FEATURES is the list lib/seo-claims.test.ts polices,
 * no accuracy claim can arrive here that the rest of the site may not make.
 *
 * Static: built once per deploy, served from the edge.
 */
export const dynamic = "force-static";

export function GET(): Response {
  const product = PUBLIC_ROUTES.filter((r) => r.section === "product");
  const about = PUBLIC_ROUTES.filter((r) => r.section === "about");

  const plans = PLAN_ORDER.map((id) => {
    const t = planTier(id);
    const price =
      t.price === null
        ? "custom pricing"
        : t.price === 0
          ? "free"
          : `$${t.price} ${t.months === 1 ? "a month" : `for ${t.months} months`}`;
    const allowance = [
      t.gradeLimit === null ? "unlimited AI gradings" : `${t.gradeLimit} AI gradings a month`,
      t.generateLimit === null ? "unlimited practice sets" : `${t.generateLimit} practice sets a month`,
      `${t.fullMockLimit} live speaking mock${t.fullMockLimit === 1 ? "" : "s"} a month`,
    ].join(", ");
    return `- ${t.name}: ${price} — ${allowance}`;
  });

  const languages = LOCALES.map(
    (l) => `${LOCALE_NAMES[l]} at ${absoluteUrl(localePath("/", l))}${l === DEFAULT_LOCALE ? " (default)" : ""}`,
  ).join("; ");

  const body = [
    `# ${SITE_NAME}`,
    "",
    `> ${SEO_DESCRIPTION}`,
    "",
    `${SITE_NAME} is an independent practice platform. It is not affiliated with or endorsed by IELTS®, ` +
      "the British Council, IDP or Cambridge Assessment English, and it uses no official or copyrighted " +
      "test material — every passage, recording and prompt is original. Bands are practice estimates, " +
      "not official results.",
    "",
    `The landing page is available in ${languages}. Exam content and feedback are in English.`,
    "",
    "## What it does",
    "",
    ...PLATFORM_FEATURES.map((f) => `- ${f}`),
    "",
    "## Plans",
    "",
    ...plans,
    "",
    `Education centres are set up separately, not on these plans — see ${absoluteUrl("/for-education-centers")}.`,
    "",
    "## Pages",
    "",
    ...product.map((r) => `- [${r.label}](${absoluteUrl(r.path)})`),
    "",
    "## Blog",
    "",
    ...POSTS.map((p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}): ${p.standfirst}`),
    "",
    "## Optional",
    "",
    ...about.map((r) => `- [${r.label}](${absoluteUrl(r.path)})`),
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
