/**
 * WHAT A CRAWLER MAY READ — evaluated the way a crawler evaluates it.
 *
 * ⚠️ A ROBOTS RULE IS A PREFIX. `Disallow: /cefr` (the signed-in CEFR hub)
 * also blocked `/cefr-multilevel-practice` (the public CEFR page) for every
 * crawler — GPTBot, OAI-SearchBot and the rest — for seven weeks while the
 * sitemap listed it. Reading the generated rules as text would not have caught
 * that; matching every public URL against them, by RFC 9309's rule, does.
 */

import { describe, expect, it } from "vitest";

import { LOCALES, localePath } from "@/lib/i18n/locales";
import { PUBLIC_ROUTES } from "@/lib/seo";

import robots from "./robots";

type Rule = { userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[] };

const list = <T,>(v?: T | T[]): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/** RFC 9309: the longest matching path wins, and Allow wins a tie. (No rule
 *  here uses a wildcard, so a prefix match is the whole of the matching.) */
function allowed(path: string, rule: Rule): boolean {
  const longest = (paths: string[]) => Math.max(-1, ...paths.filter((p) => path.startsWith(p)).map((p) => p.length));
  return longest(list(rule.allow)) >= longest(list(rule.disallow));
}

const rules = list<Rule>(robots().rules as Rule | Rule[]);
const agent = (name: string) => rules.find((r) => list(r.userAgent).includes(name));

/** Every public URL in every language — more than the sitemap lists, which is
 *  fine: allowing a URL that 404s costs nothing. */
const PUBLIC_URLS = PUBLIC_ROUTES.flatMap((r) => LOCALES.map((l) => localePath(r.path, l)));

describe("robots.txt", () => {
  it("has rules for the wildcard and for the answer engines", () => {
    expect(rules.length).toBeGreaterThan(5);
    for (const name of ["*", "GPTBot", "OAI-SearchBot", "ChatGPT-User"]) expect(agent(name), name).toBeTruthy();
  });

  it("lets every crawler read every public page", () => {
    const blocked = rules.flatMap((r) =>
      PUBLIC_URLS.filter((p) => !allowed(p, r)).map((p) => `${list(r.userAgent).join(",")} blocks ${p}`),
    );
    expect(blocked).toEqual([]);
  });

  it("lets ChatGPT read the CEFR page in particular", () => {
    for (const name of ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "*"]) {
      expect(allowed("/cefr-multilevel-practice", agent(name)!), name).toBe(true);
    }
  });

  it("still keeps the signed-in surfaces private", () => {
    for (const r of rules) {
      for (const p of ["/cefr", "/cefr/free/abc", "/dashboard", "/write/123", "/console/groups"]) {
        expect(allowed(p, r), `${list(r.userAgent).join(",")} ${p}`).toBe(false);
      }
    }
  });
});
