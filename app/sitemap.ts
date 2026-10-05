import type { MetadataRoute } from "next";

import { loadPosts } from "@/lib/blog/store";
import { absoluteUrl, PUBLIC_ROUTES } from "@/lib/seo";
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, localePath } from "@/lib/i18n/locales";

/**
 * Which routes exist in more than one language.
 *
 * The landing page and the two documentation guides. The remaining marketing
 * pages are still English-only, and listing a `/ru/...` that 404s is worse than
 * listing nothing — so this list grows as each page gets a localised route, not
 * before.
 *
 * ⚠️ MIRRORED BY `LOCALISED_ROUTES` IN `shared/components/i18n/locale-provider.tsx`,
 * and a test asserts the two sets are equal. Grow them together or the picker
 * offers a URL this sitemap does not claim.
 */
const LOCALISED = new Set(["/", "/how-to-use", "/how-to-use/education-centers"]);

/** Rebuilt from the cached post list; a save in /admin refreshes it. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  /* Every article, from the same list /blog renders — publishing a post puts it
     here with no second edit. English-only and unprefixed, like the other
     single-language pages, and dated by the post rather than by the build so a
     crawler can tell an old article from a changed one. */
  const posts: MetadataRoute.Sitemap = (await loadPosts()).map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: new Date(`${p.updated ?? p.published}T00:00:00Z`),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...pages(lastModified), ...posts];
}

function pages(lastModified: Date): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.flatMap((route) => {
    const many = LOCALISED.has(route.path);
    /* A single-language route is served unprefixed, i.e. at the DEFAULT
       locale's URL. The marketing pages below the landing page are written
       in English, which is also the default locale. */
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
