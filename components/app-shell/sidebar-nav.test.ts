/**
 * Which rail item lights up.
 *
 * This is the most visible piece of state in the product — it is how somebody
 * knows where they are — and it broke silently the moment Attendance stopped
 * being its own rail item: nothing matched /console/attendance any more, so the
 * tab strip said "Attendance" while the rail said nowhere. These pin both rules
 * that fix, and the longest-match rule it must not have broken on the way.
 */

import { describe, expect, it } from "vitest";

import { resolveActiveHref } from "./sidebar-nav";

const RAIL = [
  { href: "/console" },
  { href: "/console/groups" },
  { href: "/console/students" },
  {
    href: "/console/calendar",
    // Timetable and Attendance are one item, two tabs.
    alsoMatches: ["/console/attendance"],
  },
  { href: "/console/finance" },
  { href: "/console/finance/payroll" },
  { href: "/console/practice" },
  { href: "/console/practice-ai" },
];

describe("resolveActiveHref", () => {
  it("matches a route exactly", () => {
    expect(resolveActiveHref(RAIL, "/console/groups")).toBe("/console/groups");
  });

  it("keeps the parent lit inside a detail route", () => {
    expect(resolveActiveHref(RAIL, "/console/groups/abc-123")).toBe("/console/groups");
  });

  it("gives the longest match the win", () => {
    // /console/finance/payroll sits under /console/finance; Salary should light
    // up, not Finance.
    expect(resolveActiveHref(RAIL, "/console/finance/payroll")).toBe("/console/finance/payroll");
    expect(resolveActiveHref(RAIL, "/console/finance")).toBe("/console/finance");
  });

  it("does not let a prefix match a different word", () => {
    // /console/practice-ai must not light up /console/practice. Without the
    // "/" in the startsWith check this is exactly the bug you get.
    expect(resolveActiveHref(RAIL, "/console/practice-ai")).toBe("/console/practice-ai");
    expect(resolveActiveHref(RAIL, "/console/practice")).toBe("/console/practice");
  });

  /** The regression the tab merge introduced, and the reason this file exists. */
  it("lights up Timetable while standing on Attendance", () => {
    expect(resolveActiveHref(RAIL, "/console/attendance")).toBe("/console/calendar");
  });

  it("lights up Timetable inside an Attendance detail route", () => {
    expect(resolveActiveHref(RAIL, "/console/attendance/group-7")).toBe("/console/calendar");
  });

  it("scores an alsoMatches route by its own length, not the item's", () => {
    // /console/attendance (19) is longer than /console/calendar (17). If the
    // secondary route were scored by its OWNER's href, a competing item with a
    // longer href would outrank it and steal the highlight.
    const withDecoy = [...RAIL, { href: "/console/att" }];
    expect(resolveActiveHref(withDecoy, "/console/attendance")).toBe("/console/calendar");
  });

  it("never lights up an item that is not built yet", () => {
    // A `soon` row is a disabled span, not a link — highlighting it would say
    // "you are here" about a page nobody can open. It drops out of the running
    // and the console root picks the path up instead, which is the honest
    // answer: you are somewhere in the console, on nothing in particular.
    const withSoon = [{ href: "/console/cohort", soon: true }, ...RAIL];
    expect(resolveActiveHref(withSoon, "/console/cohort")).toBe("/console");
  });

  it("returns nothing for a route the rail does not own", () => {
    expect(resolveActiveHref(RAIL, "/dashboard")).toBeUndefined();
  });

  it("does not treat the console root as owning everything", () => {
    // "/console" is a prefix of every console route; the `+ "/"` guard plus
    // longest-match is what keeps Dashboard from being permanently lit.
    expect(resolveActiveHref(RAIL, "/console/students")).toBe("/console/students");
    expect(resolveActiveHref(RAIL, "/console")).toBe("/console");
  });
});
