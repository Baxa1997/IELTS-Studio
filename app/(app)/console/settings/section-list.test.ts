/**
 * Who sees which settings section.
 *
 * The frame's list and the route's guard both read `sectionsFor`, so this is the
 * one place a section can leak to the wrong role — a teacher reaching Billing, or
 * an administrator the center's subjects.
 */

import { describe, expect, it } from "vitest";

import { resolveSection, sectionsFor } from "./section-list";

const keys = (role: string) => sectionsFor(role).map((s) => s.key);

describe("sectionsFor", () => {
  it("gives the center admin every section, account first", () => {
    expect(keys("center_admin")).toEqual([
      "account",
      "appearance",
      "center",
      "telegram",
      "billing",
      "subjects",
      "roles",
    ]);
  });

  it("gives teachers and administrators only their own account, look and Telegram", () => {
    expect(keys("teacher")).toEqual(["account", "appearance", "telegram"]);
    expect(keys("administrator")).toEqual(["account", "appearance", "telegram"]);
  });

  it("gives students and unknown roles nothing", () => {
    expect(keys("student")).toEqual([]);
    expect(keys("super_admin")).toEqual([]);
  });
});

describe("resolveSection", () => {
  it("opens a section the role has", () => {
    expect(resolveSection("center_admin", "billing")).toBe("billing");
    expect(resolveSection("teacher", "telegram")).toBe("telegram");
  });

  it("refuses an owner-only section to staff", () => {
    for (const key of ["center", "billing", "subjects", "roles"]) {
      expect(resolveSection("teacher", key), key).toBeNull();
      expect(resolveSection("administrator", key), key).toBeNull();
    }
  });

  it("treats an unknown section like a forbidden one", () => {
    expect(resolveSection("center_admin", "payroll")).toBeNull();
    expect(resolveSection("center_admin", "")).toBeNull();
  });
});
