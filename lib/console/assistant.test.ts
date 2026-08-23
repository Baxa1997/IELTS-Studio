import { describe, expect, it } from "vitest";

import {
  ACTIONS,
  DOCUMENTS,
  describeActions,
  describeDocuments,
  vetDocuments,
  vetProposals,
  type VetContext,
} from "./assistant";

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

const asTeacher: VetContext = { ...ctx, role: "teacher" };

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
      vetProposals(
        propose("assign_practice", { group: "Pre-IELTS", skill: "telepathy" }),
        asTeacher,
      ),
    ).toEqual([]);
  });

  it("ignores an unparseable date rather than failing the whole proposal", () => {
    // "sometime next week" is a fine thing to say and a bad thing to guess at,
    // and the action treats a missing due date as no deadline.
    const [p] = vetProposals(
      propose("assign_practice", { group: "Pre-IELTS", skill: "writing", due: "next week" }),
      asTeacher,
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

  it("lets a bulk import through on a real class", () => {
    // The roster itself is never in the proposal — it goes browser → server
    // action — so all the vetting has to get right is the class.
    const [p] = vetProposals(propose("add_students_bulk", { group: "Pre-IELTS" }), ctx);
    expect(p.action).toBe("add_students_bulk");
    expect(p.args).toEqual({ group: "Pre-IELTS" });
  });

  it("will not smuggle a roster through the model's arguments", () => {
    const [p] = vetProposals(
      propose("add_students_bulk", { group: "Pre-IELTS", roster: "Fake Person, +99890" }),
      ctx,
    );
    expect(p.args.roster).toBeUndefined();
  });

  it("keeps bulk import away from a teacher's non-class", () => {
    expect(vetProposals(propose("add_students_bulk", { group: "Someone Else" }), ctx)).toEqual([]);
  });

  it("does not carry through an argument the action never declared", () => {
    const [p] = vetProposals(
      propose("invite_class_telegram", { group: "IELTS Evening", student_id: "smuggled" }),
      ctx,
    );
    expect(p.args).toEqual({ group: "IELTS Evening" });
  });
});

/**
 * What the model is actually TOLD it can do. The first real-data failure was a
 * centre owner asking for a new class and being told it could not be done from
 * here — with `create_group` sitting in the owner's own list. The prompt was at
 * fault that time, not the wiring, but nothing was checking the wiring either.
 */
describe("describeActions", () => {
  it("offers an owner everything except the one job that is the teacher's", () => {
    const text = describeActions("center_admin");
    for (const id of ACTIONS.map((a) => a.id)) {
      // `createAssignment` refuses anyone but the class's own teacher, so
      // offering an owner a button that would turn them away is worse than
      // not offering it.
      if (id === "assign_practice") expect(text).not.toContain(id);
      else expect(text).toContain(id);
    }
  });

  it("names every argument, so the model has no shape to guess at", () => {
    expect(describeActions("center_admin")).toContain("full_name");
    expect(describeActions("teacher")).toContain("writing|reading");
  });

  it("gives a teacher their own classes and withholds hiring", () => {
    const text = describeActions("teacher");
    expect(text).toContain("create_group");
    expect(text).toContain("add_students_bulk");
    expect(text).toContain("assign_practice");
    expect(text).not.toContain("add_teacher");
    expect(text).not.toContain("close_group");
  });

  it("tells a role with no actions nothing at all", () => {
    expect(describeActions("student")).toBe("");
  });
});

/**
 * WHO MAY RUN WHAT, pinned against the gate each server action actually
 * applies. This duplication is unavoidable — the actions check the caller
 * themselves and do not expose their rule — so the only protection is a table
 * somebody has to edit on purpose.
 *
 * It is not theoretical. `create_group` shipped as owner-only while
 * `createGroup` has always allowed teachers, and CLAUDE.md says teachers create
 * their own groups: a teacher asking for a new class was told the assistant
 * could not see how, which reads as broken rather than as forbidden. Five of
 * the twelve were wrong the same way.
 */
describe("action permissions match the server actions they call", () => {
  const EXPECTED: Record<string, string[]> = {
    // canManagePeople(role) || role === "teacher"
    invite_class_telegram: ["center_admin", "administrator", "teacher"],
    add_student: ["center_admin", "administrator", "teacher"],
    add_students_bulk: ["center_admin", "administrator", "teacher"],
    move_student: ["center_admin", "administrator", "teacher"],
    mark_student_left: ["center_admin", "administrator", "teacher"],
    create_group: ["center_admin", "administrator", "teacher"],
    set_schedule: ["center_admin", "administrator", "teacher"],
    // canManagePeople(role)
    assign_teacher: ["center_admin", "administrator"],
    close_group: ["center_admin", "administrator"],
    reopen_group: ["center_admin", "administrator"],
    // role === "center_admin"
    add_teacher: ["center_admin"],
    // role === "center_admin" || role === "teacher"
    send_announcement: ["center_admin", "teacher"],
    // role === "teacher" — an owner genuinely cannot set practice
    assign_practice: ["teacher"],
  };

  it("covers every action, so a new one cannot slip in unpinned", () => {
    expect(ACTIONS.map((a) => a.id).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  for (const [id, roles] of Object.entries(EXPECTED)) {
    it(`${id} is offered to exactly ${roles.join(", ")}`, () => {
      const spec = ACTIONS.find((a) => a.id === id);
      expect([...(spec?.roles ?? [])].sort()).toEqual([...roles].sort());
    });
  }

  it("gives a teacher the things a teacher actually does", () => {
    const text = describeActions("teacher");
    // The three that were wrongly withheld, and the one that is genuinely theirs alone.
    expect(text).toContain("create_group");
    expect(text).toContain("add_student");
    expect(text).toContain("assign_practice");
  });

  it("still keeps hiring to the owner", () => {
    expect(describeActions("teacher")).not.toContain("add_teacher");
    expect(describeActions("administrator")).not.toContain("add_teacher");
  });
});

/**
 * Files are the third kind of reply, and they get the same gate. The one that
 * matters most here is finance: a teacher must never be handed a debtors
 * sheet, and the export route refuses them — so the assistant must refuse them
 * first, rather than offer a button that 403s.
 */
describe("vetDocuments", () => {
  const docCtx = { ...ctx, studentIds: new Map([["madina zaynidinova", "stu-1"]]) };
  const offer = (doc: string, args: Record<string, unknown>) => [{ doc, args }];

  it("gives the owner a finance report with the right link", () => {
    const [d] = vetDocuments(
      offer("finance_report", { report: "debtors", format: "xlsx", month: "2026-08" }),
      docCtx,
    );
    expect(d.href).toBe(
      "/api/console/finance/export?report=debtors&format=xlsx&month=2026-08-01",
    );
  });

  it("refuses a teacher the finance reports, as the route itself does", () => {
    expect(
      vetDocuments(offer("finance_report", { report: "debtors", format: "xlsx", month: "2026-08" }), {
        ...docCtx,
        role: "teacher",
      }),
    ).toEqual([]);
  });

  it("drops an unknown report or format", () => {
    expect(
      vetDocuments(offer("finance_report", { report: "everything", format: "xlsx", month: "2026-08" }), docCtx),
    ).toEqual([]);
    expect(
      vetDocuments(offer("finance_report", { report: "ledger", format: "docx", month: "2026-08" }), docCtx),
    ).toEqual([]);
  });

  it("drops a month it cannot parse rather than guessing one", () => {
    expect(
      vetDocuments(offer("finance_report", { report: "ledger", format: "pdf", month: "August" }), docCtx),
    ).toEqual([]);
  });

  it("links a student report only for somebody already visible", () => {
    const [d] = vetDocuments(offer("student_report", { student: "Madina Zaynidinova" }), docCtx);
    expect(d.href).toBe("/api/console/students/stu-1/report");
    expect(vetDocuments(offer("student_report", { student: "A Stranger" }), docCtx)).toEqual([]);
  });

  it("offers nothing for a document id that does not exist", () => {
    expect(vetDocuments(offer("payroll_of_a_rival_centre", {}), docCtx)).toEqual([]);
  });

  it("tells a teacher about the student report and not the money", () => {
    const text = describeDocuments("teacher");
    expect(text).toContain("student_report");
    expect(text).not.toContain("finance_report");
    expect(describeDocuments("center_admin")).toContain("finance_report");
  });

  it("keeps every document pinned to a role", () => {
    for (const d of DOCUMENTS) expect(d.roles.length).toBeGreaterThan(0);
  });
});
