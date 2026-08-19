import { describe, expect, it } from "vitest";

import { phoneKey, samePhone } from "./phone";

/**
 * These exist because the phone is about to become an identity check: the bot
 * binds a student to their account by matching the number Telegram reports
 * against the one a teacher typed into a spreadsheet. A false match hands one
 * student another's password, and a false miss means nobody can connect.
 */

describe("the same number, written differently", () => {
  const forms = [
    "+998 90 123 45 67",
    "998901234567",
    "+998901234567",
    "90 123 45 67",
    "901234567",
    "(90) 123-45-67",
  ];

  it("all reduce to one key", () => {
    const keys = new Set(forms.map((f) => phoneKey(f)));
    expect(keys.size).toBe(1);
    expect([...keys][0]).toBe("901234567");
  });

  it("match each other in every direction", () => {
    for (const a of forms) for (const b of forms) expect(samePhone(a, b)).toBe(true);
  });
});

describe("what must never match", () => {
  it("two different numbers", () => {
    expect(samePhone("+998901234567", "+998901234568")).toBe(false);
  });

  it("a missing number against another missing number", () => {
    // THE DANGEROUS CASE. Most students have no phone stored, so if blank
    // matched blank the first person to ask would bind to the first empty row.
    expect(samePhone(null, null)).toBe(false);
    expect(samePhone("", "")).toBe(false);
    expect(samePhone(undefined, "")).toBe(false);
  });

  it("something too short to be a number", () => {
    expect(phoneKey("12345")).toBeNull();
    expect(samePhone("12345", "12345")).toBe(false);
  });

  it("text that happens to contain digits", () => {
    expect(phoneKey("room 12")).toBeNull();
  });
});

describe("what must still match", () => {
  it("a stored number with the country code against one without", () => {
    // Exactly the difference between a teacher's spreadsheet and what Telegram
    // reports, which is the whole reason this compares the tail.
    expect(samePhone("998901234567", "901234567")).toBe(true);
  });
});
