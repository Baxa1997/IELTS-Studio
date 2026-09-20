import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, localePath } from "@/lib/i18n/locales";

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
  { path: "/how-to-use", priority: 0.7, changeFrequency: "monthly" },
  { path: "/how-to-use/education-centers", priority: 0.7, changeFrequency: "monthly" },
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
 * The landing page and the two documentation guides. The remaining marketing
 * pages are still English-only, and listing a `/ru/...` that 404s is worse than
 * listing nothing — so this list grows as each page gets a localised route, not
 * before.
 *
 * ⚠️ MIRRORED BY `LOCALISED_ROUTES` IN `components/i18n/locale-provider.tsx`,
 * and a test asserts the two sets are equal. Grow them together or the picker
 * offers a URL this sitemap does not claim.
 */
const LOCALISED = new Set(["/", "/how-to-use", "/how-to-use/education-centers"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.flatMap((route) => {
    const many = LOCALISED.has(route.path);
    /* A single-language route is served unprefixed, i.e. at the DEFAULT
       locale's URL — but being at that URL does not make it that language.
       The marketing pages below the landing page are all still written in
       English while the default locale is Uzbek. */
    const locales = many ? LOCALES : [DEFAULT_LOCALE];
    return locales.map((locale) => ({
      url: absoluteUrl(localePath(route.path, locale)),
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      /* Each entry names all three, which is the sitemap half of the same
         promise the pages' `hreflang` tags make. A crawler that finds one
         language through the sitemap learns the others exist without having to
         fetch the page first.

         ⚠️ ONLY FOR ROUTES THAT REALLY HAVE SIBLINGS. A one-language page used
         to emit an alternates block too, which was harmless while it named the
         language that page was written in. With the default moved to Uzbek the
         same code started labelling English-only pages `uz-Latn` — an hreflang
         that lies, which is worse than none, and a self-referencing alternate
         for a page with no siblings says nothing anyway. */
      ...(many
        ? {
            alternates: {
              languages: Object.fromEntries(
                locales.map((l) => [HTML_LANG[l], absoluteUrl(localePath(route.path, l))]),
              ),
            },
          }
        : {}),
    }));
  });
}
