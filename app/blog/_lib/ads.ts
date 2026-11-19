/**
 * Yandex Advertising Network (РСЯ) configuration for the blog.
 *
 * Two ways Yandex can fill a page, both from partner.yandex.ru:
 *  - AUTOPLACEMENT (what the account uses today): one page id; Yandex's
 *    `ap-loader.js` decides by itself where on the page ads go.
 *  - MANUAL UNITS: a block id per slot (`R-A-1234567-1`), rendered exactly
 *    where `<YandexAd>` sits. Dormant until a unit is created.
 * Unset (or malformed) = nothing renders and no Yandex script loads.
 *
 * ⚠️ `NEXT_PUBLIC_` IS INLINED AT BUILD TIME. Setting a variable in Vercel does
 * nothing until the next deploy.
 *
 * ⚠️ BLOG ONLY, ON PURPOSE. The marketing pages exist to sell our own plans,
 * and an ad there pays a few tiyin to send a would-be buyer to someone else.
 * The learner app, the console and /admin never carry ads: a paying learner,
 * a center's students (often minors) and a timed test are all the wrong place.
 * Autoplacement makes this matter more, not less — it puts ads ANYWHERE its
 * script runs, so the script itself is the only fence. `ads.test.ts` holds
 * every Yandex URL to `app/blog/`.
 */

const BLOCK_ID = /^R-A-\d+-\d+$/;
const PAGE_ID = /^\d+$/;

export function parseBlockId(raw: string | undefined): string | null {
  const id = raw?.trim();
  return id && BLOCK_ID.test(id) ? id : null;
}

export function parsePageId(raw: string | undefined): string | null {
  const id = raw?.trim();
  return id && PAGE_ID.test(id) ? id : null;
}

/** Autoplacement page id — the `data-page-id` on Yandex's ap-loader snippet. */
export const YANDEX_AUTO_PAGE_ID = parsePageId(process.env.NEXT_PUBLIC_YANDEX_AP_PAGE_ID);

export const YANDEX_AD_SLOTS = {
  /** Under the article body, before our own practice and account offers. */
  article: parseBlockId(process.env.NEXT_PUBLIC_YANDEX_RTB_ARTICLE),
} as const;
