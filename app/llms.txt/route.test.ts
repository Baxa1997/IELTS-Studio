/**
 * /llms.txt — executed, because it is generated: the test reads what an answer
 * engine will read.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { PLAN_ORDER, planTier } from "@/lib/billing/plans";
import { absoluteUrl, PLATFORM_FEATURES, PUBLIC_ROUTES } from "@/lib/seo";

import { GET } from "./route";

const body = await GET().text();

describe("/llms.txt", () => {
  it("carries every capability, page and plan the rest of the site publishes", () => {
    for (const f of PLATFORM_FEATURES) expect(body).toContain(f);
    for (const r of PUBLIC_ROUTES) expect(body).toContain(`(${absoluteUrl(r.path)})`);
    for (const id of PLAN_ORDER) expect(body).toContain(`- ${planTier(id).name}:`);
  });

  it("states it is not the official exam — CLAUDE.md's disclaimer, on every surface", () => {
    expect(body).toMatch(/not affiliated with or endorsed by IELTS®/);
  });

  it("never points at /pricing, which 307s every crawler to /sign-in", () => {
    expect(body).not.toMatch(/\/pricing\)/);
  });

  it("is reachable signed out — otherwise every crawler reads a redirect", () => {
    const mw = readFileSync(fileURLToPath(new URL("../../lib/supabase/middleware.ts", import.meta.url)), "utf8");
    const list = mw.slice(mw.indexOf("const PUBLIC_PATHS = ["), mw.indexOf("];", mw.indexOf("const PUBLIC_PATHS = [")));
    expect(list).toMatch(/"\/llms\.txt"/);
  });
});
