/**
 * What the sign-up dialog and the blog's account card say a free account gets.
 *
 * Both read `FREE_PLAN_LINES`, and the numbers in it are the free plan's own
 * limits — the ones the quota code enforces. The way this goes wrong is quiet:
 * somebody "fixes" a translation by typing the number in, the plan changes, and
 * three languages go on promising the old allowance to the people deciding
 * whether to sign up.
 */

import { describe, expect, it } from "vitest";

import { PLAN_TIERS } from "@/lib/billing/plans";
import { en } from "@/lib/i18n/messages/en";
import { ru } from "@/lib/i18n/messages/ru";
import { uz } from "@/lib/i18n/messages/uz";

import { FREE_PLAN_LINES, PAID_FROM } from "./_lib/free-plan";

describe("what a free account is said to get", () => {
  it("has a line for every limit the free plan meters", () => {
    // A limit made unlimited drops out of the list rather than reading
    // "null a month" — and this is where that stops being silent.
    const free = PLAN_TIERS.trial;
    expect(FREE_PLAN_LINES.map((l) => l.n)).toEqual([
      free.gradeLimit,
      free.generateLimit,
      free.fullMockLimit,
      free.libraryLimit,
    ]);
  });

  it.each(Object.entries({ en, uz, ru }))("takes every number from the plan, none from the copy (%s)", (_, messages) => {
    for (const { key } of FREE_PLAN_LINES) {
      expect(messages[key], key).toContain("{n}");
      expect(messages[key], `${key} has a number typed into it`).not.toMatch(/\d/);
    }
    expect(messages["su.freeMore"]).toContain("{price}");
    expect(messages["su.freeMore"], "su.freeMore has a price typed into it").not.toMatch(/\d/);
  });

  it("quotes the cheapest plan billed monthly — not Free's $0, not a quarter's price", () => {
    expect(PAID_FROM).toBe(`$${PLAN_TIERS.starter.price}`);
  });
});
