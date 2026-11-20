/**
 * Yandex Advertising Network (РСЯ) configuration for the public site.
 *
 * Two ways Yandex can fill a page, both from partner.yandex.ru:
 *  - MANUAL BANNERS: a block id (`R-A-1234567-1`), rendered exactly where
 *    `<YandexAd>` sits. On the blog articles, the landing page, the free
 *    practice pages and /grade (owner, 2026-11-19).
 *  - AUTOPLACEMENT: one page id; Yandex's `ap-loader.js` decides by itself
 *    where ads go. BLOG ONLY — see below.
 * Unset (or malformed) = nothing renders and no Yandex script loads.
 *
 * ONE BANNER BY DEFAULT. Every slot falls back to the article banner, so a
 * single block id lights up every page; give a slot its own block only to read
 * its revenue separately in Yandex's statistics.
 *
 * ⚠️ `NEXT_PUBLIC_` IS INLINED AT BUILD TIME, and only when written out in full
 * — `process.env[name]` is never replaced. Setting a variable in Vercel does
 * nothing until the next deploy.
 *
 * ⚠️ NEVER IN THE PRODUCT. The learner app, the studios, the console and
 * /admin carry no ads: a paying learner, a center's students (often minors)
 * and a timed test are all the wrong place. `ads.test.ts` holds every Yandex
 * URL to `yandex-ad.tsx` and every import of it to the public pages.
 *
 * ⚠️ AUTOPLACEMENT STAYS ON THE BLOG. It puts ads ANYWHERE its script runs and
 * cannot be unloaded, so it is fenced by forcing a full reload on leaving the
 * blog (`YandexAutoAds`). Widening it to the landing page would put the fence
 * on the one path every new sign-up takes into the dashboard.
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

const ARTICLE = parseBlockId(process.env.NEXT_PUBLIC_YANDEX_RTB_ARTICLE);

export const YANDEX_AD_SLOTS = {
  /** Under a blog article's body, before our own practice and account offers. */
  article: ARTICLE,
  /** The landing page, after the FAQ and before the closing sign-up panel. */
  landing: parseBlockId(process.env.NEXT_PUBLIC_YANDEX_RTB_LANDING) ?? ARTICLE,
  /** A free practice page, after its FAQ. */
  practice: parseBlockId(process.env.NEXT_PUBLIC_YANDEX_RTB_PRACTICE) ?? ARTICLE,
  /** /grade, under the grader and above the FAQ. */
  grade: parseBlockId(process.env.NEXT_PUBLIC_YANDEX_RTB_GRADE) ?? ARTICLE,
  /**
   * The rail in the right-hand margin of an article and a practice page, wide
   * screens only (`YandexRail`).
   *
   * ⚠️ NO FALLBACK, unlike the slots above. Those are one per page; the rail
   * shares its page with the bottom banner, and Yandex renders a block id once
   * per page — falling back to ARTICLE would put the same block on the page
   * twice and leave one of the two empty. Unset = no rail.
   */
  sidebar: parseBlockId(process.env.NEXT_PUBLIC_YANDEX_RTB_SIDEBAR),
} as const;
