/**
 * Tell IndexNow (Bing, Yandex and the rest) about every page in the live
 * sitemap, once. It is the catch-up after a deploy that changed many pages at
 * once, like the 2026-10-15 crawl fixes. Day to day it is not needed:
 * publishing, editing or deleting a live article in /admin/blog already sends
 * that article (app/admin/blog/actions.ts).
 *
 * ── Running ─────────────────────────────────────────────────────────────────
 *   npm run seo:indexnow                # dry run: checks the key, prints the plan
 *   npm run seo:indexnow -- --send      # sends one POST to api.indexnow.org
 *   … -- --site=https://example.com     # another host (default: the live site)
 *
 * Writes nothing, anywhere. ⚠️ It refuses to send until the key file answers on
 * the live site, i.e. until the deploy that adds it is out: the engines fetch
 * that file before they believe a submission, and reject the lot with a 403
 * without it.
 *
 * The site is not read from .env.local. A laptop's site URL is usually
 * localhost, and IndexNow only takes URLs on the host its key file is on.
 */

import { INDEXNOW_KEY, INDEXNOW_KEY_PATH, indexNowBody, postToIndexNow } from "../lib/indexnow";

const args = process.argv.slice(2);
const SEND = args.includes("--send");
const SITE = (args.find((a) => a.startsWith("--site="))?.slice("--site=".length) ?? "https://www.engprogress.com").replace(/\/+$/, "");

/* The URLs English had before it became the default locale (2026-10-05).
   They now 308 to the unprefixed pages, and an engine that recrawls them
   moves what it had indexed onto the new URL instead of keeping a dead one. */
const OLD_ENGLISH_URLS = ["/en", "/en/how-to-use", "/en/how-to-use/education-centers"];

async function main() {
  const sitemap = await fetch(`${SITE}/sitemap.xml`);
  if (!sitemap.ok) throw new Error(`${SITE}/sitemap.xml answered ${sitemap.status}`);
  const pages = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (!pages.length) throw new Error("The sitemap lists no pages.");

  const body = indexNowBody([...pages, ...OLD_ENGLISH_URLS], SITE);

  const keyFile = await fetch(body.keyLocation, { redirect: "manual" });
  const keyLive = keyFile.status === 200 && (await keyFile.text()).trim() === INDEXNOW_KEY;

  console.log(`site         ${SITE} (host ${body.host})`);
  console.log(`key file     ${body.keyLocation} → ${keyFile.status}${keyLive ? ", the key ✓" : ", NOT the key"}`);
  console.log(`urls         ${body.urlList.length} (${pages.length} from the sitemap + ${OLD_ENGLISH_URLS.length} old /en URLs)`);
  for (const u of body.urlList.slice(0, 5)) console.log(`             ${u}`);
  if (body.urlList.length > 5) console.log(`             … and ${body.urlList.length - 5} more`);

  if (!keyLive) {
    console.error(`\nThe key file is not live at ${INDEXNOW_KEY_PATH} yet. Deploy first; nothing was sent.`);
    process.exit(1);
  }
  if (!SEND) {
    console.log("\nDry run: nothing sent. Add --send to submit.");
    return;
  }

  const status = await postToIndexNow(body);
  const meaning: Record<number, string> = {
    200: "accepted",
    202: "accepted; the engines are still checking the key",
    400: "bad request",
    403: "the key file did not verify",
    422: "a URL is not on this host",
    429: "too many requests; try again later",
  };
  console.log(`\nIndexNow → ${status} (${meaning[status] ?? "unexpected"})`);
  if (status !== 200 && status !== 202) process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
