/**
 * /llms-full.txt — executed, like /llms.txt: the test reads what an answer
 * engine will read.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GET as llms } from "@/app/llms.txt/route";
import { POSTS } from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";

import { GET } from "./route";

const body = await GET().text();

describe("/llms-full.txt", () => {
  it("carries every article in full, each with its own URL to cite", () => {
    for (const p of POSTS) {
      expect(body).toContain(`# ${p.title}`);
      expect(body).toContain(absoluteUrl(`/blog/${p.slug}`));
      for (const pt of p.summary) expect(body).toContain(pt);
    }
  });

  it("states it is not the official exam", () => {
    expect(body).toMatch(/not affiliated with or endorsed by IELTS®/);
  });

  it("is linked from /llms.txt, where answer engines look first", async () => {
    expect(await llms().text()).toContain(absoluteUrl("/llms-full.txt"));
  });

  it("is reachable signed out — otherwise every crawler reads a redirect", () => {
    const mw = readFileSync(join(process.cwd(), "lib/supabase/middleware.ts"), "utf8");
    const start = mw.indexOf("const PUBLIC_PATHS = [");
    expect(mw.slice(start, mw.indexOf("];", start))).toMatch(/"\/llms-full\.txt"/);
  });
});
