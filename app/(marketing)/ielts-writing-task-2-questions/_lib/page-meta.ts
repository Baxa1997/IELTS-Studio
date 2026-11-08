import type { Metadata } from "next";

import {
  BANK_DESCRIPTION,
  BANK_TOPICS,
  QUESTION_BANK_PATH,
  topicDescription,
  topicPath,
  type BankTopic,
} from "@/lib/prompts/question-bank";
import { absoluteUrl, organization, pageUpdated, PREVIEW_IMAGE, previewImage, SITE_NAME } from "@/lib/seo";

/**
 * The question bank's names, metadata and structured data — the hub and every
 * topic page, from one place so the <title>, the <h1>, the share card and the
 * JSON-LD cannot name a page three ways.
 */

/** "1 question", "12 questions". */
export const questionCount = (n: number) => `${n} question${n === 1 ? "" : "s"}`;

/** The headings, in sentence case like every marketing page's <h1>. */
export const HUB_HEADING = "IELTS Writing Task 2 questions by topic";
export const topicHeading = (t: BankTopic) => `IELTS Writing Task 2 ${t.slug} questions`;

/**
 * The search-result titles. The root layout appends " | EngProgress", and a
 * result shows about 60 characters, so these stay at 47 or under —
 * question-bank.test.ts measures every one with the suffix on.
 */
export const HUB_TITLE = "IELTS Writing Task 2 Questions by Topic";
export const topicTitle = (t: BankTopic) => `IELTS Writing Task 2 ${t.label} Questions`;

/** A page's metadata. `openGraph` names the share image again because a page's
 *  `openGraph` replaces the root layout's whole object (see previewImage). */
function metadata(path: string, title: string, description: string, alt: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url: path,
      title,
      description,
      images: [previewImage(alt)],
    },
    twitter: { card: "summary_large_image", title, description, images: [PREVIEW_IMAGE] },
  };
}

export const hubMetadata = (): Metadata =>
  metadata(QUESTION_BANK_PATH, HUB_TITLE, BANK_DESCRIPTION, HUB_HEADING);

export const topicMetadata = (t: BankTopic): Metadata =>
  metadata(topicPath(t.slug), topicTitle(t), topicDescription(t), topicHeading(t));

/* ── structured data ───────────────────────────────────────────────────────── */
/*
 * Each page is a CollectionPage whose main entity is an ItemList — of topic
 * pages on the hub, of the questions themselves on a topic page — plus its
 * breadcrumb.
 *
 * ⚠️ THE PUBLISHER IS organization(), REFERENCED BY `@id`. One node per graph,
 * the same `/#organization` every other page names, so an engine reading the
 * hub and a topic page knows they are one publisher's. A literal Organization
 * here is refused by lib/seo-structured-data.test.ts.
 *
 * The question names are the library's text, untouched — the page's test reads
 * them back against the library.
 */

const ABOUT = { "@type": "Thing", name: "IELTS Writing Task 2" };

function breadcrumb(url: string, trail: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [{ name: SITE_NAME, url: absoluteUrl("/") }, ...trail].map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: step.url,
    })),
  };
}

/** `dateModified` is the day PUBLIC_ROUTES records for the page — the one its
 *  "Updated" line and the sitemap state (pageUpdated in lib/seo). */
function collectionPage(url: string, name: string, description: string, orgId: string, dateModified: string) {
  return {
    "@type": "CollectionPage",
    "@id": `${url}#page`,
    name,
    description,
    url,
    inLanguage: "en",
    dateModified,
    isAccessibleForFree: true,
    about: ABOUT,
    publisher: { "@id": orgId },
    mainEntity: { "@id": `${url}#list` },
    breadcrumb: { "@id": `${url}#breadcrumb` },
  };
}

export function hubGraph() {
  const url = absoluteUrl(QUESTION_BANK_PATH);
  const org = organization();
  return {
    "@context": "https://schema.org",
    "@graph": [
      org,
      collectionPage(url, HUB_HEADING, BANK_DESCRIPTION, org["@id"], pageUpdated(QUESTION_BANK_PATH)),
      {
        "@type": "ItemList",
        "@id": `${url}#list`,
        name: HUB_HEADING,
        numberOfItems: BANK_TOPICS.length,
        itemListElement: BANK_TOPICS.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${topicHeading(t)} (${t.count})`,
          url: absoluteUrl(topicPath(t.slug)),
        })),
      },
      breadcrumb(url, [{ name: HUB_HEADING, url }]),
    ],
  };
}

export function topicGraph(topic: BankTopic) {
  const hub = absoluteUrl(QUESTION_BANK_PATH);
  const url = absoluteUrl(topicPath(topic.slug));
  const heading = topicHeading(topic);
  const org = organization();
  const questions = topic.groups.flatMap((g) => g.questions);
  return {
    "@context": "https://schema.org",
    "@graph": [
      org,
      { ...collectionPage(url, heading, topicDescription(topic), org["@id"], pageUpdated(topicPath(topic.slug))), isPartOf: { "@id": `${hub}#page` } },
      {
        "@type": "ItemList",
        "@id": `${url}#list`,
        name: heading,
        numberOfItems: questions.length,
        itemListElement: questions.map((q) => ({
          "@type": "ListItem",
          position: q.n,
          item: {
            "@type": "LearningResource",
            "@id": `${url}#q-${q.n}`,
            name: q.text,
            learningResourceType: "Essay question",
            educationalUse: "Exam practice",
            isAccessibleForFree: true,
            inLanguage: "en",
            about: ABOUT,
          },
        })),
      },
      breadcrumb(url, [
        { name: HUB_HEADING, url: hub },
        { name: heading, url },
      ]),
    ],
  };
}
