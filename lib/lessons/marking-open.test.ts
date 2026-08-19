import { describe, expect, it } from "vitest";

import { openMarkingSchema } from "./grade-open";

/**
 * What the marker will accept from a model.
 *
 * These exist because two of the first three real attempts came back
 * `grading_status: failed` while the AI call itself had SUCCEEDED — valid JSON
 * arrived and the schema rejected it. Rejecting throws away the marking for
 * every item in the batch, and nothing retries a lesson attempt afterwards, so
 * a strict schema here costs a learner all their written feedback permanently.
 */

const good = {
  marked: [
    {
      id: "f1",
      criteria: [{ met: true, evidence: '"I go"' }],
      corrected: "I go to the gym.",
      note: "Fine.",
    },
  ],
};

describe("shapes it must accept", () => {
  it("the shape actually asked for", () => {
    expect(openMarkingSchema.safeParse(good).success).toBe(true);
  });

  it("a bare array, which is the other shape models return", () => {
    const r = openMarkingSchema.safeParse(good.marked);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.marked).toHaveLength(1);
  });

  it("trims an over-long quote instead of failing the batch", () => {
    const r = openMarkingSchema.safeParse({
      marked: [{ id: "f1", criteria: [{ met: true, evidence: "x".repeat(900) }] }],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.marked[0].criteria[0].evidence.length).toBe(300);
  });

  it("trims an over-long correction and note", () => {
    const r = openMarkingSchema.safeParse({
      marked: [
        {
          id: "f1",
          criteria: [{ met: false, evidence: "" }],
          corrected: "y".repeat(2000),
          note: "z".repeat(2000),
        },
      ],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.marked[0].corrected).toHaveLength(600);
      expect(r.data.marked[0].note).toHaveLength(400);
    }
  });

  it("a stringified or numeric verdict", () => {
    const r = openMarkingSchema.safeParse({
      marked: [{ id: "f1", criteria: [{ met: "true" }, { met: 1 }, { met: "false" }] }],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.marked[0].criteria.map((c) => c.met)).toEqual([true, true, false]);
  });

  it("a missing verdict, which must read as NOT met", () => {
    // The round-down rule: a learner told they were right when they were not is
    // worse off than one told nothing.
    const r = openMarkingSchema.safeParse({ marked: [{ id: "f1", criteria: [{}] }] });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.marked[0].criteria[0].met).toBe(false);
  });

  it("a missing correction or note", () => {
    const r = openMarkingSchema.safeParse({ marked: [{ id: "f1", criteria: [{ met: true }] }] });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.marked[0].corrected).toBeNull();
      expect(r.data.marked[0].note).toBeNull();
    }
  });
});

describe("what it must still refuse", () => {
  it("an item with no criteria at all", () => {
    expect(openMarkingSchema.safeParse({ marked: [{ id: "f1", criteria: [] }] }).success).toBe(false);
  });

  it("an item with no id — there is nothing to attach it to", () => {
    expect(
      openMarkingSchema.safeParse({ marked: [{ criteria: [{ met: true }] }] }).success,
    ).toBe(false);
  });

  it("something that is not marking at all", () => {
    expect(openMarkingSchema.safeParse({ error: "no" }).success).toBe(false);
  });
});
