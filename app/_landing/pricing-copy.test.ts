import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { DICTIONARIES } from "@/lib/i18n";
import { LOCALES } from "@/lib/i18n/locales";
import { PLAN_ORDER, PLAN_TIERS, type OrgPlan } from "@/lib/billing/plans";

/**
 * THE PRICE CARD IS WRITTEN IN TWO PLACES AND ONLY ONE OF THEM COMPILES AGAINST
 * THE OTHER.
 *
 * `lib/billing/plans.ts` is the single definition the quota code, the checkout
 * and the billing screens read, and it holds the feature copy in English.
 * `app/_landing/landing-page.tsx` renders those features from message keys, so
 * the landing page can speak three languages. Nothing in the type system ties
 * the two lists together: add a feature to the plan and the card silently drops
 * it, because the card iterates the KEYS, not the plan.
 *
 * So this counts them. It deliberately does not compare the text — the whole
 * point of the keys is that the text differs — only that every feature a plan
 * sells has somewhere to be said, in every language.
 */

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const landing = read("./landing-page.tsx");

/** `PLAN_FEATURES` as the landing page declares it: plan → message keys. */
function declaredFeatureKeys(): Record<string, string[]> {
  const block = /const PLAN_FEATURES: Record<OrgPlan, MessageKey\[\]> = \{([\s\S]*?)\n\};/.exec(
    landing,
  );
  expect(block, "PLAN_FEATURES not found in landing-page.tsx").toBeTruthy();
  const out: Record<string, string[]> = {};
  for (const m of (block?.[1] ?? "").matchAll(/(\w+):\s*\[([\s\S]*?)\]/g)) {
    out[m[1]] = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  }
  return out;
}

describe("the pricing card's feature copy", () => {
  const declared = declaredFeatureKeys();

  it("names every plan the pricing section renders", () => {
    expect(Object.keys(declared).sort()).toEqual([...PLAN_ORDER].sort());
  });

  for (const plan of PLAN_ORDER) {
    it(`${plan}: has one key per feature the plan sells`, () => {
      const keys = declared[plan] ?? [];
      const features = PLAN_TIERS[plan as OrgPlan].features;
      expect(
        keys.length,
        `plans.ts sells ${features.length} ${plan} features, the card can say ${keys.length}`,
      ).toBe(features.length);
    });

    it(`${plan}: every key exists in all three dictionaries`, () => {
      for (const key of declared[plan] ?? []) {
        for (const locale of LOCALES) {
          const dict = DICTIONARIES[locale] as Record<string, string>;
          expect(dict[key], `${locale} is missing ${key}`).toBeTruthy();
        }
      }
    });
  }
});
