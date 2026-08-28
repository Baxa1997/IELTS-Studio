import { describe, expect, it } from "vitest";

import { landingFor, roleHome, safeNextPath } from "./auth";

/**
 * Where somebody lands after signing in.
 *
 * ⚠️ THE BUG THIS PINS looked like an account problem and was not one. Signing
 * in with a LEARNER account landed in the centre console, so it read as "the
 * education centre and the individual account are mixed up". The database was
 * clean the whole time — one email, one account, one role. What happened is
 * that /console bounces an unauthenticated visitor to /sign-in?next=/console,
 * and sign-in honoured `next` ahead of the role's own home. Any learner who
 * signed in on that URL was redirected into staff territory.
 *
 * `safeNextPath` could never have caught it: it asks whether a path is local
 * and non-looping, which /console is. Nothing asked whether the person going
 * there was allowed to.
 */
describe("landingFor", () => {
  it("sends a learner home when the URL asks for the staff console", () => {
    expect(landingFor("student", "/console")).toBe("/dashboard");
    expect(landingFor("student", "/console/groups/123")).toBe("/dashboard");
  });

  it("sends staff home when the URL asks for a learner page", () => {
    expect(landingFor("teacher", "/dashboard")).toBe("/console");
    expect(landingFor("center_admin", "/activities/essay/abc")).toBe("/console");
  });

  it("keeps a path the role does own", () => {
    expect(landingFor("teacher", "/console/attendance")).toBe("/console/attendance");
    expect(landingFor("student", "/assignments")).toBe("/assignments");
    expect(landingFor("student", "/learn/lesson-1")).toBe("/learn/lesson-1");
  });

  it("leaves a path nobody claims alone", () => {
    // Shared surfaces — the skill hubs, settings, billing — belong to everyone.
    expect(landingFor("student", "/read")).toBe("/read");
    expect(landingFor("teacher", "/listen")).toBe("/listen");
  });

  it("falls back to the role's home when there is no next at all", () => {
    for (const role of ["student", "teacher", "center_admin", "super_admin"] as const) {
      expect(landingFor(role, null)).toBe(roleHome(role));
      expect(landingFor(role, "")).toBe(roleHome(role));
    }
  });

  it("still refuses everything safeNextPath refuses", () => {
    // Open redirects and auth loops — the protections that were already there
    // must survive the new check being layered on top.
    for (const bad of [
      "//evil.example.com",
      "https://evil.example.com",
      "/sign-in",
      "/auth/callback",
    ]) {
      expect(safeNextPath(bad)).toBeNull();
      expect(landingFor("student", bad)).toBe("/dashboard");
    }
  });

  it("does not let a prefix collision open a door", () => {
    // "/consoles-are-fun" is not "/console" — matching must be on a segment
    // boundary, or the guard both over- and under-blocks.
    expect(landingFor("student", "/consoles-are-fun")).toBe("/consoles-are-fun");
  });
});
