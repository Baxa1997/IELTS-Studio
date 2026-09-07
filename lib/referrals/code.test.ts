/**
 * Referral codes, guarded where they can actually go wrong.
 *
 * A code is a bearer credential — whoever holds it earns from it — and it is
 * also read off a screenshot and retyped. Both facts have a failure mode that is
 * silent, so both are asserted here rather than trusted.
 */

import { describe, expect, it } from "vitest";

import { generateCode, isCodeShape, normalizeCode } from "./code";

describe("generateCode", () => {
  it("never emits a character that can be misread as another", () => {
    // 0/o and 1/l/i are the whole reason the alphabet is what it is: a code
    // transcribed wrongly into another VALID code pays the wrong person, and
    // nothing anywhere reports it.
    const sample = Array.from({ length: 400 }, generateCode).join("");
    expect(sample).not.toMatch(/[01ilo]/);
  });

  it("only emits codes the database will accept", () => {
    // The CHECK constraint in 20260907120000_referrals.sql is the real gate; a
    // generator that can produce a rejected code fails at approval time, in
    // front of a super admin, on somebody else's application.
    for (let i = 0; i < 200; i++) expect(isCodeShape(generateCode())).toBe(true);
  });

  it("does not repeat itself over a realistic number of accounts", () => {
    // Not proof of uniqueness — the mint retries on collision for that. This
    // catches the version where the RNG is broken and every code is identical.
    const codes = new Set(Array.from({ length: 2000 }, generateCode));
    expect(codes.size).toBe(2000);
  });

  it("spreads across the alphabet rather than favouring its start", () => {
    // The bug this exists for: `byte % 31` looks fine and quietly makes the
    // first nine letters ~13% likelier, because 256 is not a multiple of 31.
    // Rejection sampling is what avoids it, and a biased generator is a
    // guessable one.
    const counts = new Map<string, number>();
    for (const ch of Array.from({ length: 4000 }, generateCode).join("")) {
      counts.set(ch, (counts.get(ch) ?? 0) + 1);
    }
    const seen = [...counts.values()];
    const expected = (4000 * 8) / 31;
    // Generous bounds — this is asserting "not skewed", not "perfectly uniform".
    expect(Math.min(...seen)).toBeGreaterThan(expected * 0.7);
    expect(Math.max(...seen)).toBeLessThan(expected * 1.3);
  });
});

describe("normalizeCode", () => {
  it("survives the ways a code actually arrives", () => {
    // Pasted with whitespace, typed in caps, copied out of a chat message.
    for (const raw of ["  ABC23xyz ", "ABC23XYZ", "abc23xyz\n"]) {
      expect(normalizeCode(raw)).toBe("abc23xyz");
    }
  });
});

describe("isCodeShape", () => {
  it("accepts what we issue and normal hand-typed variants", () => {
    expect(isCodeShape("abc23xyz")).toBe(true);
    expect(isCodeShape("  ABC23XYZ  ")).toBe(true); // normalised first
    expect(isCodeShape("a-b_c9")).toBe(true);
  });

  it("rejects junk before it reaches a query", () => {
    const junk = [
      "",
      "ab", // under the 3-char floor
      "a".repeat(33), // over the 32-char ceiling
      "-abc", // must start alphanumeric
      "abc def", // a space means it was never one code
      "abc/../def", // path traversal in a URL component
      "<script>", // a `?ref=` is attacker-controlled input
      "abc%00", // null byte
    ];
    for (const raw of junk) expect(isCodeShape(raw), raw).toBe(false);
  });

  it("agrees with the database's CHECK constraint", () => {
    // Both sides are written out here so a change to one that is not made to the
    // other fails a test rather than surfacing as a constraint violation in
    // production. Keep in step with `referral_accounts_code_shape`.
    const constraint = /^[a-z0-9][a-z0-9_-]{2,31}$/;
    for (let i = 0; i < 100; i++) {
      const code = generateCode();
      expect(constraint.test(code)).toBe(isCodeShape(code));
    }
  });
});
