import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { DEFAULT_LOCALE, HTML_LANG, LOCALES } from "@/lib/i18n/locales";

// NOTE: /pricing is deliberately absent. It lives under app/(app) and calls
// requireOrgUser(), so an anonymous request 307s to /sign-in — listing it here
// advertised a URL no crawler could index. The public pricing lives in the
// landing page's #pricing section.
const publicRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/grade", priority: 0.85, changeFrequency: "monthly" },
  { path: "/demo", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-practice", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-writing-practice", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-reading-practice", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-listening-practice", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-speaking-practice", priority: 0.8, changeFrequency: "monthly" },
  { path: "/cefr-multilevel-practice", priority: 0.8, changeFrequency: "monthly" },
  { path: "/for-education-centers", priority: 0.8, changeFrequency: "monthly" },
  { path: "/sign-in", priority: 0.3, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
] satisfies Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}>;

/**
 * Which routes exist in more than one language.
 *
 * Only the landing page so far. The other marketing pages are still
 * English-only, and listing a `/uz/...` that 404s is worse than listing
 * nothing — so this list grows as each page gets a localised route, not before.
 */
const LOCALISED = new Set(["/"]);

const localisedPath = (path: string, locale: string) =>
  locale === DEFAULT_LOCALE ? path : path === "/" ? `/${locale}` : `/${locale}${path}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.flatMap((route) => {
    const locales = LOCALISED.has(route.path) ? LOCALES : [DEFAULT_LOCALE];
    return locales.map((locale) => ({
      url: absoluteUrl(localisedPath(route.path, locale)),
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      /* Each entry names all three, which is the sitemap half of the same
         promise the pages' `hreflang` tags make. A crawler that finds one
         language through the sitemap learns the others exist without having to
         fetch the page first. */
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [HTML_LANG[l], absoluteUrl(localisedPath(route.path, l))]),
        ),
      },
    }));
  });
}
