import { getSiteUrl } from "@/lib/seo";

/**
 * IndexNow: telling the search engines the moment a page changes, instead of
 * waiting for them to come back on their own.
 *
 * WHY. ChatGPT search and Copilot answer from Bing's index, so an article Bing
 * has not crawled is one ChatGPT cannot cite. One POST to api.indexnow.org
 * reaches every engine in the protocol (Bing, Yandex, Seznam, Naver, Yep),
 * because they share what they receive. Google is not among them; it reads
 * the sitemap.
 *
 * THE KEY IS PUBLIC BY DESIGN. It proves we own the host only because nobody
 * else can publish it at INDEXNOW_KEY_PATH, where anyone may read it; it guards
 * nothing else, so it is a constant rather than a secret.
 */
export const INDEXNOW_KEY = "90623ee565905a6a0bd1b7e8aaecb66a";

/**
 * Where the key file is served (app/indexnow-key.txt/route.ts).
 *
 * ⚠️ AT THE SITE ROOT. A key file vouches only for URLs at or below its own
 * folder, so a key under /blog could not submit the landing page.
 *
 * ⚠️ AND IN PUBLIC_PATHS (lib/supabase/middleware.ts), which keeps its own copy
 * of this path because the middleware imports nothing it does not need. An
 * engine fetching the key has no session, so without that entry it is sent to
 * /sign-in, reads HTML instead of the key, and rejects every submission.
 * lib/indexnow.test.ts fails if the two drift.
 */
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";

const ENDPOINT = "https://api.indexnow.org/indexnow";

/** The request IndexNow takes: our host, the key, where to find it, and the
 *  changed pages as absolute URLs on that host. Paths are resolved against the
 *  site; repeats are dropped. */
export function indexNowBody(urls: readonly string[], site: string = getSiteUrl()) {
  const base = new URL(site);
  return {
    host: base.host,
    key: INDEXNOW_KEY,
    keyLocation: new URL(INDEXNOW_KEY_PATH, base).toString(),
    urlList: [...new Set(urls.map((u) => new URL(u, base).toString()))],
  };
}

/**
 * One submission; resolves to IndexNow's status. 200 is accepted and 202
 * accepted while the key is checked. 403 means the key file did not answer
 * with the key, and 422 that a URL is not on the host. Throws only when the
 * request never got an answer.
 */
export async function postToIndexNow(body: ReturnType<typeof indexNowBody>): Promise<number> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  return res.status;
}

/**
 * Tell the engines these pages changed: paths, or absolute URLs on this site.
 *
 * ⚠️ PRODUCTION ONLY. .env.local points at the production database, so a post
 * saved from a laptop is a real post, but the laptop refreshes only its own
 * cache. An engine sent to www before www has re-rendered reads the old page
 * (or caches a 404 for a new slug) and keeps it. A preview deployment has a
 * host the key does not cover.
 *
 * ⚠️ NEVER THROWS. Callers run it in `after()`, once the save has been
 * answered: a notice that did not go out costs a slower crawl, never a save.
 */
export async function submitToIndexNow(urls: readonly string[]): Promise<void> {
  if (process.env.VERCEL_ENV !== "production" || urls.length === 0) return;
  const body = indexNowBody(urls);
  try {
    const status = await postToIndexNow(body);
    if (status !== 200 && status !== 202) console.warn(`[indexnow] ${status} for ${body.urlList.length} URL(s)`);
  } catch (err) {
    console.warn("[indexnow] not sent:", err instanceof Error ? err.message : err);
  }
}
