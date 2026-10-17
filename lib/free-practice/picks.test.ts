import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { freeRunner, signInFor } from "./links";
import { toPick } from "./picks";
import type { PoolItem } from "./pools";

/**
 * THE LANDING PAGE'S "PICKED FOR YOU" CARDS (owner, 2026-10-17: the practice
 * section was "too simple, and not showing as recommendation for user").
 *
 * What would break without a sound: the front door going dynamic because the
 * picks were read on the server, a visitor's picks cached and served to the
 * next visitor, an empty pool cached as "no practice" for ten minutes, and a
 * card naming a practice its runner does not open.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

const item: PoolItem = {
  key: "k1",
  source: "library-row-1",
  format: "full",
  testNo: 12,
  part: null,
  paper: null,
  title: "Cities and heat",
  topic: "environment",
  kind: "3 passages",
  level: 3,
  minutes: 60,
  questions: 40,
};

describe("a pick", () => {
  it("carries only what a card shows, and opens the practice's own runner", () => {
    const pick = toPick("reading", item, false);
    expect(Object.keys(pick).sort()).toEqual(
      [
        "skill",
        "key",
        "href",
        "signInHref",
        "title",
        "testNo",
        "paper",
        "format",
        "kind",
        "minutes",
        "questions",
        "done",
      ].sort(),
    );
    expect(pick.href).toBe(freeRunner("reading", "k1"));
    expect(pick.signInHref).toBe(signInFor("reading"));
  });
});

describe("where the picks are read", () => {
  it("is a private, uncached route — the answer differs per visitor", () => {
    const route = read("app/api/public/practice/picks/route.ts");
    expect(route).toContain('export const dynamic = "force-dynamic";');
    expect(route.match(/"Cache-Control": "private, no-store"/g)).toHaveLength(2);
  });

  it("is fetched by the browser, so the front door stays static", () => {
    const client = read("app/_landing/_components/practice-picks.tsx");
    expect(client.startsWith('"use client";')).toBe(true);
    expect(client).toContain('const PICKS_URL = "/api/public/practice/picks";');
    // The route the client calls is the route that exists.
    expect(read("app/api/public/practice/picks/route.ts")).toContain("practicePicks()");
    for (const file of [
      "app/_landing/_components/landing-page.tsx",
      "app/_landing/_components/practice-cards.tsx",
    ]) {
      const src = read(file);
      expect(src, file).not.toMatch(/from "next\/headers"|\bcookies\(|\bheaders\(/);
      expect(src, file).not.toMatch(
        /from "@\/lib\/free-practice\/(picks|assignment|pools|visitor)"/,
      );
    }
    // The client takes the pick's TYPE from the server module, nothing else.
    expect(client).toMatch(/import type \{ PracticePick \} from "@\/lib\/free-practice\/picks";/);
    expect(client).not.toMatch(
      /import \{[^}]*\} from "@\/lib\/free-practice\/(picks|assignment|pools|visitor)"/,
    );
  });

  it("exports components only from the client module", () => {
    // CLAUDE.md's client boundary: a value exported from a "use client"
    // module reaches a server module as a client reference, i.e. junk.
    const client = read("app/_landing/_components/practice-picks.tsx");
    const exported = [...client.matchAll(/^export (?:async )?(function|const|let|class) (\w+)/gm)];
    expect(exported.length).toBeGreaterThan(0);
    for (const [, kind, name] of exported) expect(`${kind} ${name}`).toMatch(/^function [A-Z]/);
  });
});

describe("the pools behind the picks", () => {
  const pools = read("lib/free-practice/pools.ts");

  it("are cached across requests for the picks, and fresh for everything that marks", () => {
    expect(read("lib/free-practice/picks.ts")).toContain("practiceList(skill, loadPoolCached)");
    // The practice page and the runners' list check take the default — fresh.
    expect(read("app/practice/[skill]/page.tsx")).toContain("practiceList(skill)");
    expect(read("lib/free-practice/assignment.ts")).toMatch(
      /const list = await practiceList\(skill\);/,
    );
  });

  it("never cache an empty pool — a failed query reads as one", () => {
    const cached = pools.slice(
      pools.indexOf("const cachedPool = unstable_cache("),
      pools.indexOf("export async function loadPoolCached"),
    );
    expect(cached).toMatch(/if \(!pool\.length\) throw /);
  });
});

describe('the "Start here" card', () => {
  /* The landing draws the first skill in the frame before the picks arrive,
     so the rule is a fixed order — and the frame only moves for a visitor
     who has already done that skill today. */
  const pick = (done: boolean) => ({ done });

  it("is the first skill in card order until the picks say otherwise", async () => {
    const { featuredSkill, FEATURE_ORDER } = await import("@/app/_landing/_lib/featured-pick");
    expect(FEATURE_ORDER).toEqual(["writing", "reading", "listening", "cefr"]);
    expect(featuredSkill(null)).toBe("writing");
    expect(featuredSkill({ writing: pick(false), reading: pick(false) })).toBe("writing");
  });

  it("moves on past a skill already done today, or one with nothing to pick", async () => {
    const { featuredSkill } = await import("@/app/_landing/_lib/featured-pick");
    expect(featuredSkill({ writing: pick(true), reading: pick(false) })).toBe("reading");
    expect(featuredSkill({ reading: pick(true), listening: pick(false) })).toBe("listening");
    // Everything done: the first card stays, now saying how to get more.
    expect(
      featuredSkill({
        writing: pick(true),
        reading: pick(true),
        listening: pick(true),
        cefr: pick(true),
      }),
    ).toBe("writing");
  });

  it("shows every card exactly once — the frame's, then the row without it", () => {
    const client = read("app/_landing/_components/practice-picks.tsx");
    expect(client).toContain("{cards[featured]}");
    expect(client).toContain("PRACTICE_CARD_SKILLS.filter((skill) => skill !== featured)");
  });
});
