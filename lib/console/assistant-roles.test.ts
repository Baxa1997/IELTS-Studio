/**
 * What the assistant will tell each role it can do.
 *
 * The isolation itself is enforced in three places and none of them is this
 * file: `loadCentreSnapshot` gates the money block on `canManagePeople` and
 * builds every query through the caller's own RLS client, the confirm step
 * re-checks the role server-side before any write, and RLS refuses the rest.
 * These assertions guard the FOURTH thing — the list of capabilities handed to
 * the model, and through it to the person.
 *
 * That list matters more than it looks. It is what the assistant advertises. A
 * teacher shown "download the payroll" gets a refusal when they ask, which
 * teaches them the assistant is unreliable rather than that they lack
 * permission. So the rule under test is: never offer what will be refused.
 */

import { describe, expect, it } from "vitest";

import { ACTIONS, describeActions, describeDocuments, DOCUMENTS } from "./assistant";

const ROLES = ["center_admin", "administrator", "teacher"] as const;

/** Anything that reveals what the centre earns, owes or pays out. */
const MONEY_ACTIONS = ["finance_report"];
/** Anything that changes who works here, or what they are paid. */
const STAFFING_ACTIONS = ["add_teacher"];

describe("action visibility by role", () => {
  it("every action names at least one role", () => {
    for (const a of ACTIONS) {
      expect(a.roles.length, `${a.id} is offered to nobody`).toBeGreaterThan(0);
    }
  });

  it("a teacher is never offered money", () => {
    for (const id of MONEY_ACTIONS) {
      const spec = [...ACTIONS, ...DOCUMENTS].find((x) => x.id === id);
      expect(spec, `${id} not found`).toBeDefined();
      expect(spec!.roles).not.toContain("teacher");
      expect(spec!.roles).not.toContain("administrator");
    }
  });

  it("only the owner can hire", () => {
    for (const id of STAFFING_ACTIONS) {
      const spec = ACTIONS.find((a) => a.id === id);
      expect(spec!.roles).toEqual(["center_admin"]);
    }
  });

  it("the front desk cannot see payroll", () => {
    // An administrator takes money IN. What staff are paid is the owner's.
    const finance = DOCUMENTS.find((d) => d.id === "finance_report");
    expect(finance!.roles).toEqual(["center_admin"]);
  });

  it("a teacher can still pull one student's progress report", () => {
    // Their students' bands ARE theirs — this is the report a parent evening
    // runs on, and withholding it would make the assistant useless to them.
    const report = DOCUMENTS.find((d) => d.id === "student_report");
    expect(report!.roles).toContain("teacher");
  });

  it("setting homework belongs to the person who teaches the class", () => {
    const assign = ACTIONS.find((a) => a.id === "assign_practice");
    expect(assign!.roles).toEqual(["teacher"]);
  });
});

describe("describeActions / describeDocuments", () => {
  it("describe only what the role may actually run", () => {
    for (const role of ROLES) {
      const text = `${describeActions(role)}\n${describeDocuments(role)}`;
      for (const spec of [...ACTIONS, ...DOCUMENTS]) {
        const offered = text.includes(`• ${spec.id} —`);
        expect(
          offered,
          `${role} was ${offered ? "offered" : "not offered"} ${spec.id}, roles=${spec.roles.join("|")}`,
        ).toBe((spec.roles as readonly string[]).includes(role));
      }
    }
  });

  /**
   * The specific leak this file was written for: the prompt is assembled from
   * these two strings, so a money word appearing in a teacher's copy means the
   * model has been told the capability exists and will try to use it.
   */
  it("a teacher's prompt never mentions payroll, debtors or the ledger", () => {
    const text = `${describeActions("teacher")}\n${describeDocuments("teacher")}`.toLowerCase();
    // Deliberately NOT "invoice" or "salary". `move_student` explains that a
    // student "keeps every mark, register and invoice" when they change class,
    // which is prose a teacher needs and not a capability being advertised —
    // a substring match flags it, and a test that cries wolf gets deleted.
    // These four only ever appear as the name of a finance report.
    for (const word of ["payroll", "debtor", "ledger", "expenses"]) {
      expect(text, `"${word}" reached a teacher's capability list`).not.toContain(word);
    }
  });

  it("no owner-only capability id appears in a teacher's list", () => {
    // The structural version of the check above, immune to how anything is
    // worded: whatever center_admin can do and a teacher cannot must not be
    // named in a teacher's prompt at all.
    const teacherText = `${describeActions("teacher")}\n${describeDocuments("teacher")}`;
    const ownerOnly = [...ACTIONS, ...DOCUMENTS].filter(
      (x) => !(x.roles as readonly string[]).includes("teacher"),
    );
    expect(ownerOnly.length, "nothing is owner-only — the fixture is wrong").toBeGreaterThan(0);
    for (const spec of ownerOnly) {
      expect(teacherText, `${spec.id} was named to a teacher`).not.toContain(spec.id);
    }
  });

  it("the owner's prompt does mention them", () => {
    // The inverse check, so the test above cannot pass by the strings simply
    // having been renamed out of existence.
    const text =
      `${describeActions("center_admin")}\n${describeDocuments("center_admin")}`.toLowerCase();
    expect(text).toContain("payroll");
    expect(text).toContain("debtors");
  });

  it("says nothing at all to a role that is not staff", () => {
    expect(describeActions("student")).toBe("");
    expect(describeDocuments("student")).toBe("");
  });
});
