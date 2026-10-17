import { INDEXNOW_KEY } from "@/lib/indexnow";

/**
 * GET /indexnow-key.txt — the file that proves to IndexNow we own this host
 * (see lib/indexnow.ts): the key and nothing else, as plain text. Every
 * submission names this URL as its `keyLocation`, and the engines fetch it
 * before they believe one.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(INDEXNOW_KEY, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
