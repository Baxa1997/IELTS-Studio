import { describe, expect, it } from "vitest";

import { vetProposals, type VetContext } from "./assistant";

/**
 * The gate between what a model said and what a person is offered a button for.
 * Everything else in the assistant is prose; this is the part that decides
 * whether a sentence can turn into a write, so it is the part worth pinning.
 */
const ctx: VetContext = {
  role: "center_admin",
  groups: new Set(["ielts evening", "pre-ielts"]),
  students: new Set(["madina zaynidinova"]),
};

const propose = (action: string, args: Record<string, unknown> = {}) => [
  { action, args, why: "because" },
];

describe("vetProposals", () => {
  it("passes a proposal whose every argument is real", () => {
    const [p] = vetProposals(propose("invite_class_telegram", { group: "IELTS Evening" }), ctx);
    expect(p.action).toBe("invite_class_telegram");
    expect(p.args.group).toBe("IELTS Evening");
  });

  it("drops an action that does not exist", () => {
    expect(vetProposals(propose("delete_everything", { group: "IELTS Evening" }), ctx)).toEqual([]);
  });

  it("drops an action this role may not run", () => {
    // Closing a class is the owner's, not a teacher's.
    const asTeacher = { ...ctx, role: "teacher" };
    expect(vetProposals(propose("close_group", { group: "IELTS Evening" }), asTeacher)).toEqual([]);
    expect(vetProposals(propose("close_group", { group: "IELTS Evening" }), ctx)).toHaveLength(1);
  });

  it("drops a class the caller cannot already see", () => {
    // The whole containment story: the snapshot is built through RLS, so a name
    // absent from it is either invented or another centre's.
    expect(vetProposals(propose("invite_class_telegram", { group: "Someone Else" }), ctx)).toEqual(
      [],
    );
  });

  it("drops a student the caller cannot already see", () => {
    expect(
      vetProposals(propose("move_student", { student: "Nobody", to_group: "Pre-IELTS" }), ctx),
    ).toEqual([]);
  });

  it("drops a proposal missing a required argument", () => {
    expect(vetProposals(propose("move_student", { student: "Madina Zaynidinova" }), ctx)).toEqual(
      [],
    );
  });

  it("keeps a proposal missing an optional one", () => {
    const [p] = vetProposals(
      propose("mark_student_left", { student: "Madina Zaynidinova" }),
      ctx,
    );
    expect(p.args.note).toBeUndefined();
  });

  it("drops a choice outside its list", () => {
    expect(
      vetProposals(propose("assign_practice", { group: "Pre-IELTS", skill: "telepathy" }), ctx),
    ).toEqual([]);
  });

  it("ignores an unparseable date rather than failing the whole proposal", () => {
    // "sometime next week" is a fine thing to say and a bad thing to guess at,
    // and the action treats a missing due date as no deadline.
    const [p] = vetProposals(
      propose("assign_practice", { group: "Pre-IELTS", skill: "writing", due: "next week" }),
      ctx,
    );
    expect(p.args.skill).toBe("writing");
    expect(p.args.due).toBeUndefined();
  });

  it("never offers more than one at a time", () => {
    const many = [
      ...propose("invite_class_telegram", { group: "IELTS Evening" }),
      ...propose("invite_class_telegram", { group: "Pre-IELTS" }),
    ];
    expect(vetProposals(many, ctx)).toHaveLength(1);
  });

  it("does not carry through an argument the action never declared", () => {
    const [p] = vetProposals(
      propose("invite_class_telegram", { group: "IELTS Evening", student_id: "smuggled" }),
      ctx,
    );
    expect(p.args).toEqual({ group: "IELTS Evening" });
  });
});
