/**
 * WHAT YANDEX METRICA MAY SEE.
 *
 * A third party's reports are readable by anyone with access to the counter,
 * and this site's URLs carry credentials: a shared lesson's path is its key,
 * invites and unsubscribes put tokens in the query, Supabase puts them in the
 * hash. These tests hold every page view and referrer to "path plus campaign
 * tags", and keep the staff screens blurred in Session Replay.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { hitUrl, HIDE_IN_REPLAY, isProductionHost, isSecretPath, isStaffPath, safeReferrer } from "./metrika";

const O = "https://www.engprogress.com";
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("page views sent to Yandex", () => {
  it("drop every query parameter but campaign tags and the referral code", () => {
    expect(hitUrl(O, "/grade", "?utm_source=chatgpt.com&token=abc&ref=ali")).toBe(
      `${O}/grade?utm_source=chatgpt.com&ref=ali`,
    );
    expect(hitUrl(O, "/dashboard", "?code=secret")).toBe(`${O}/dashboard`);
    expect(hitUrl(O, "/", "")).toBe(`${O}/`);
  });

  it("never carry the hash, where Supabase puts its tokens", () => {
    expect(hitUrl(O, "/sign-in", "")).not.toContain("#");
  });

  it("are never made for a page whose URL is a credential", () => {
    for (const p of ["/p/abc123", "/accept-invite", "/reset-password", "/recover-account", "/unsubscribe", "/auth/callback"]) {
      expect(isSecretPath(p), p).toBe(true);
    }
    for (const p of ["/", "/grade", "/practice/reading", "/pricing", "/privacy", "/blog/x"]) {
      expect(isSecretPath(p), p).toBe(false);
    }
  });
});

describe("the first page view's referrer", () => {
  it("is scrubbed when it is one of our own token pages", () => {
    expect(safeReferrer(`${O}/accept-invite?token=abc`, O)).toBe(O);
    expect(safeReferrer(`${O}/p/lesson-token`, O)).toBe(O);
    expect(safeReferrer(`${O}/grade?utm_source=x&token=abc`, O)).toBe(`${O}/grade?utm_source=x`);
  });

  it("passes another site through (the browser already cut it to its origin) and drops junk", () => {
    expect(safeReferrer("https://chatgpt.com/", O)).toBe("https://chatgpt.com/");
    expect(safeReferrer("", O)).toBe("");
  });
});

describe("where the counter runs", () => {
  it("only on the real site — never local dev or a preview deployment", () => {
    expect(isProductionHost("www.engprogress.com")).toBe(true);
    expect(isProductionHost("engprogress.com")).toBe(true);
    expect(isProductionHost("localhost")).toBe(false);
    expect(isProductionHost("ielts-studio-five.vercel.app")).toBe(false);
  });

  it("is mounted once, at the root, with no automatic page view", () => {
    expect(read("app/layout.tsx")).toContain("<YandexMetrika />");
    const tracker = read("app/_components/yandex-metrika.tsx");
    expect(tracker).toContain("defer: true");
    // Nothing reads the raw URL into a hit — everything goes through hitUrl.
    expect(tracker).not.toMatch(/location\.href/);
  });
});

describe("Session Replay on screens with other people's data", () => {
  it("is blurred in the console and /admin", () => {
    expect(isStaffPath("/console/groups/1")).toBe(true);
    expect(isStaffPath("/admin")).toBe(true);
    expect(isStaffPath("/dashboard")).toBe(false);
    expect(read("app/(app)/console/layout.tsx")).toContain("${HIDE_IN_REPLAY}");
    expect(read("app/admin/layout.tsx")).toContain("${HIDE_IN_REPLAY}");
    expect(HIDE_IN_REPLAY).toBe("ym-hide-content");
  });
});

describe("the privacy policy", () => {
  it("names Yandex Metrica and its session recordings", () => {
    const policy = read("app/(legal)/privacy/page.tsx");
    expect(policy).toContain("Yandex Metrica");
    expect(policy).toMatch(/records sessions/);
  });
});
