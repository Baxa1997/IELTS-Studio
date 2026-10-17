import type { Metadata } from "next";

import { HTML_LANG, LOCALES, localePath, SOURCE_LOCALE, type Locale } from "@/lib/i18n/locales";
import { absoluteUrl, getSiteUrl, organization } from "@/lib/seo";

import type { FaqItem, PageMeta } from "./copy";

/** The two calculators. ⚠️ ALSO SPELLED in lib/seo.ts (PUBLIC_ROUTES — lib/
 *  may not import app/), in PUBLIC_PATHS and in both LOCALISED sets;
 *  `tools-routes.test.ts` fails if any of them loses one. */
export const IELTS_CALCULATOR_PATH = "/ielts-band-score-calculator";
export const MULTILEVEL_CALCULATOR_PATH = "/multilevel-score-calculator";

export interface Photo {
  src: string;
  width: number;
  height: number;
  /** The photographer, as Unsplash names them. */
  credit: string;
}

export const PHOTOS = {
  ielts: { src: "/calculators/ielts-student.jpg", width: 1400, height: 933, credit: "Julio Lopez" },
  multilevel: { src: "/calculators/tashkent.jpg", width: 1200, height: 823, credit: "Far Chinberdiev" },
} as const satisfies Record<string, Photo>;

/**
 * A calculator's metadata in one language: its own canonical, the three
 * languages declared to each other, and the page's photo as the share card.
 *
 * `x-default` follows SOURCE_LOCALE like every other localised page here: a
 * visitor whose language is none of the three is not an Uzbek speaker.
 */
export function toolMetadata(path: string, locale: Locale, meta: PageMeta, photo: Photo, photoAlt: string): Metadata {
  const url = localePath(path, locale);
  const image = { url: photo.src, width: photo.width, height: photo.height, alt: photoAlt };
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], localePath(path, l)])),
        "x-default": localePath(path, SOURCE_LOCALE),
      },
    },
    openGraph: {
      type: "website",
      url,
      locale: HTML_LANG[locale],
      title: meta.ogTitle,
      description: meta.description,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: meta.ogTitle, description: meta.description, images: [photo.src] },
  };
}

/**
 * The page as an answer engine reads it: a free web application, where it
 * sits, and the questions it answers.
 *
 * The FAQ is the SAME list the page renders, so the structured data cannot
 * claim an answer the visitor does not see (a Google requirement).
 */
export function toolGraph(opts: {
  path: string;
  locale: Locale;
  name: string;
  description: string;
  home: string;
  faq: FaqItem[];
  photo: Photo;
}) {
  const site = getSiteUrl();
  const url = absoluteUrl(localePath(opts.path, opts.locale));
  return {
    "@context": "https://schema.org",
    "@graph": [
      organization(),
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: opts.name,
        url,
        description: opts.description,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        inLanguage: HTML_LANG[opts.locale],
        isAccessibleForFree: true,
        image: absoluteUrl(opts.photo.src),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@id": `${site}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: opts.home, item: absoluteUrl(localePath("/", opts.locale)) },
          { "@type": "ListItem", position: 2, name: opts.name, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: opts.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}
