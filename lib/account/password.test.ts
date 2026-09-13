import { describe, expect, it } from "vitest";

import { hasPasswordLogin, passwordChangeProblem } from "./password";

describe("hasPasswordLogin", () => {
  it("is true for an account with an email identity", () => {
    expect(hasPasswordLogin({ identities: [{ provider: "email" }] })).toBe(true);
    expect(hasPasswordLogin({ identities: [{ provider: "google" }, { provider: "email" }] })).toBe(
      true,
    );
  });

  it("is false for a Google-only account, or no user at all", () => {
    expect(hasPasswordLogin({ identities: [{ provider: "google" }] })).toBe(false);
    expect(hasPasswordLogin({ identities: [] })).toBe(false);
    expect(hasPasswordLogin({ identities: null })).toBe(false);
    expect(hasPasswordLogin(null)).toBe(false);
  });
});

describe("passwordChangeProblem", () => {
  const ok = { current: "old-password", next: "new-password", confirmation: "new-password" };

  it("accepts a valid change", () => {
    expect(passwordChangeProblem(ok)).toBeNull();
  });

  it("accepts setting a first password with no current one", () => {
    expect(passwordChangeProblem({ ...ok, current: null })).toBeNull();
  });

  it("asks for the current password when the account has one", () => {
    expect(passwordChangeProblem({ ...ok, current: "" })).toMatch(/current password/);
  });

  it("refuses a short password", () => {
    expect(passwordChangeProblem({ ...ok, next: "short", confirmation: "short" })).toMatch(
      /at least 8/,
    );
  });

  it("measures the upper limit in bytes, as bcrypt does", () => {
    // 36 two-byte characters: 36 characters long, 72 bytes — allowed.
    const edge = "é".repeat(36);
    expect(passwordChangeProblem({ ...ok, next: edge, confirmation: edge })).toBeNull();
    // One more is 74 bytes, though only 37 characters.
    const over = "é".repeat(37);
    expect(passwordChangeProblem({ ...ok, next: over, confirmation: over })).toMatch(/at most 72/);
  });

  it("refuses when the two new passwords differ", () => {
    expect(passwordChangeProblem({ ...ok, confirmation: "new-passwordX" })).toMatch(/don't match/);
  });

  it("refuses a new password identical to the current one", () => {
    expect(
      passwordChangeProblem({
        current: "same-password",
        next: "same-password",
        confirmation: "same-password",
      }),
    ).toMatch(/same as the current/);
  });
});
