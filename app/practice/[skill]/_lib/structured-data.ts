import type { BlogPost } from "@/lib/blog";
import { SKILL_TOPIC } from "@/lib/blog";
import type { PoolItem } from "@/lib/free-practice/assignment";
import { freePracticePage, freeRunner } from "@/lib/free-practice/links";
import type { FreeSkill } from "@/lib/free-practice/rotation";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

/**
 * A free-practice page's structured data, as one graph — the page, the
 * practices on it, the breadcrumb, and its questions.
 *
 * WHY. Until this, the four practice pages were in the sitemap and llms.txt
 * with nothing on them a machine could read: an answer engine asked "where can
 * I practise IELTS Reading for free?" found a title and twenty headlines. Now
 * each says what it is (a CollectionPage of free LearningResources about one
 * exam skill), what is on it, and answers the questions a searcher asks — in
 * the vocabulary search engines and answer engines parse.
 *
 * ⚠️ `@id`S JOIN IT TO THE REST OF THE SITE: the publisher is the landing
 * page's `/#organization`, and the related articles are the blog's own
 * `#article` nodes — so EngProgress, its blog and its practice read as one
 * entity, not three that happen to share a name.
 *
 * The practice list is THIS visitor's (the rotation is per visitor), so a
 * crawler sees one window of the library — honest, since it is what a person
 * arriving from the same place would see. The runner pages it points at are
 * noindex,follow: the list is the page that ranks.
 */
export function practiceGraph({
  skill,
  title,
  description,
  items,
  faq,
  posts,
  name,
  home,
}: {
  skill: FreeSkill;
  title: string;
  description: string;
  items: PoolItem[];
  faq: { q: string; a: string }[];
  posts: BlogPost[];
  /** The visible name of each practice: "Test 12 · Full reading". */
  name: (item: PoolItem) => string;
  /** The breadcrumb's first step, as the blog names it. */
  home: string;
}) {
  const site = absoluteUrl("/").replace(/\/$/, "");
  const url = absoluteUrl(freePracticePage(skill));
  const org = { "@type": "Organization", "@id": `${site}/#organization`, name: SITE_NAME, url: site };
  const about = { "@type": "Thing", name: SKILL_TOPIC[skill] };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        name: title,
        description,
        url,
        inLanguage: "en",
        isAccessibleForFree: true,
        about,
        publisher: org,
        mainEntity: { "@id": `${url}#practices` },
        ...(posts.length ? { relatedLink: posts.map((p) => absoluteUrl(`/blog/${p.slug}`)) } : {}),
      },
      {
        "@type": "ItemList",
        "@id": `${url}#practices`,
        name: title,
        numberOfItems: items.length,
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "LearningResource",
            name: `${name(item)}: ${item.title}`,
            url: absoluteUrl(freeRunner(skill, item.key)),
            learningResourceType: "Practice test",
            educationalUse: "Exam practice",
            isAccessibleForFree: true,
            inLanguage: "en",
            timeRequired: `PT${item.minutes}M`,
            about,
            provider: org,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: home, item: `${site}/` },
          { "@type": "ListItem", position: 2, name: title, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}
