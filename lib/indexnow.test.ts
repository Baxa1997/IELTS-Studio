/**
 * IndexNow — what the engines are sent, when, and whether they can verify it.
 *
 * Every case here is a way the feature fails without anybody noticing: a key
 * file a crawler is redirected away from (every submission then rejected with
 * a 403 that only shows up in a log line), a laptop sending Bing to a www that
 * has not re-rendered yet, a save that breaks because a notice could not go out.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { absoluteUrl } from "@/lib/seo";

import { INDEXNOW_KEY, INDEXNOW_KEY_PATH, indexNowBody, submitToIndexNow } from "./indexnow";

const mw = readFileSync(join(process.cwd(), "lib/supabase/middleware.ts"), "utf8");
const publicPaths = mw.slice(mw.indexOf("const PUBLIC_PATHS = ["), mw.indexOf("];", mw.indexOf("const PUBLIC_PATHS = [")));

describe("the key", () => {
  it("has the form IndexNow accepts", () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-zA-Z0-9-]{8,128}$/);
  });

  it("is served at the site root, where it vouches for every URL", () => {
    expect(INDEXNOW_KEY_PATH).toMatch(/^\/[^/]+\.txt$/);
  });

  it("is public — a crawler sent to /sign-in reads HTML, not the key", () => {
    expect(publicPaths).toContain(`"${INDEXNOW_KEY_PATH}"`);
  });
});

describe("the request", () => {
  it("names our host and the key file, with every URL absolute and listed once", () => {
    const body = indexNowBody(["/blog/a", "/blog", "/blog/a", "https://www.engprogress.com/x"], "https://www.engprogress.com");
    expect(body).toEqual({
      host: "www.engprogress.com",
      key: INDEXNOW_KEY,
      keyLocation: `https://www.engprogress.com${INDEXNOW_KEY_PATH}`,
      urlList: ["https://www.engprogress.com/blog/a", "https://www.engprogress.com/blog", "https://www.engprogress.com/x"],
    });
  });
});

describe("submitting", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends nothing outside production", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    vi.stubGlobal("fetch", fetch);
    for (const env of [undefined, "development", "preview"]) {
      vi.stubEnv("VERCEL_ENV", env);
      await submitToIndexNow(["/blog/a"]);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends one POST in production, with the pages it was given", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetch);
    await submitToIndexNow(["/blog/a", "/blog"]);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://api.indexnow.org/indexnow");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body)).urlList).toEqual([absoluteUrl("/blog/a"), absoluteUrl("/blog")]);
  });

  it("never fails the save it follows — offline, or refused", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn<typeof globalThis.fetch>(async () => Promise.reject(new Error("offline"))));
    await expect(submitToIndexNow(["/blog/a"])).resolves.toBeUndefined();
    vi.stubGlobal("fetch", vi.fn<typeof globalThis.fetch>(async () => new Response(null, { status: 403 })));
    await expect(submitToIndexNow(["/blog/a"])).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
