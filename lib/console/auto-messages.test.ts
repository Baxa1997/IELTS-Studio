import { describe, expect, it } from "vitest";

import {
  AUTO_MESSAGES,
  AUTO_MESSAGE_BY_KEY,
  composeAutoMessage,
  placeholdersIn,
  renderTemplate,
  templateOf,
  validateTemplate,
  type AutoMessageSetting,
} from "./auto-messages";

/**
 * These messages go out over a centre's name, unattended, to students and
 * parents. Nobody proof-reads them. Every test here is about the gap between a
 * template and the facts available when it fires.
 */

const setting = (over: Partial<AutoMessageSetting> = {}): AutoMessageSetting => ({
  key: "results_ready",
  enabled: true,
  template: null,
  updatedAt: null,
  ...over,
});

describe("the catalogue", () => {
  it("is exactly §12's six", () => {
    expect(AUTO_MESSAGES).toHaveLength(6);
    expect(AUTO_MESSAGES.map((m) => m.key)).toEqual([
      "practice_set",
      "results_ready",
      "absent_today",
      "gone_quiet",
      "two_absences",
      "invoice_due",
    ]);
  });

  it("ships default wording that is itself valid", () => {
    // A default template referencing a placeholder its own event cannot fill
    // would mean the message never sends and nobody could tell why.
    for (const spec of AUTO_MESSAGES) {
      expect(validateTemplate(spec.defaultTemplate, spec), spec.key).toEqual([]);
    }
  });

  it("only defaults ON the two messages that already fire today", () => {
    // Applying the migration must not switch off notifications students are
    // already getting, and must not start sending three new kinds of message to
    // a centre that never asked for them.
    const on = AUTO_MESSAGES.filter((m) => m.onByDefault).map((m) => m.key);
    expect(on).toEqual(["practice_set", "results_ready"]);
  });
});

describe("validateTemplate", () => {
  it("refuses a misspelled placeholder rather than shipping it to a student", () => {
    // "{studnet}, you have not practised" — printing it verbatim puts our
    // internals in front of a learner; deleting it silently produces a sentence
    // with a missing name and no clue why.
    const problems = validateTemplate("{studnet}, practise today", AUTO_MESSAGE_BY_KEY.gone_quiet);
    expect(problems).toHaveLength(1);
    expect(problems[0].kind).toBe("unknown");
    expect(problems[0].message).toContain("{student}");
  });

  it("refuses a real placeholder the event cannot fill", () => {
    // {band} is spelled right and means something — but nothing fills it when a
    // register is saved, so this template would silently never send.
    const problems = validateTemplate(
      "{student} missed {group}, band {band}",
      AUTO_MESSAGE_BY_KEY.absent_today,
    );
    expect(problems.map((p) => p.token)).toEqual(["band"]);
    expect(problems[0].kind).toBe("unsupported");
    expect(problems[0].message).toContain("would not send");
  });

  it("refuses an empty message", () => {
    expect(validateTemplate("   ", AUTO_MESSAGE_BY_KEY.gone_quiet)[0].kind).toBe("empty");
  });

  it("accepts a template with no placeholders at all", () => {
    expect(validateTemplate("Practice today.", AUTO_MESSAGE_BY_KEY.gone_quiet)).toEqual([]);
  });

  it("reports each bad token once, not once per use", () => {
    const problems = validateTemplate(
      "{oops} and {oops} again",
      AUTO_MESSAGE_BY_KEY.gone_quiet,
    );
    expect(problems).toHaveLength(1);
  });
});

describe("placeholdersIn", () => {
  it("finds tokens and ignores braces that are not one", () => {
    expect(placeholdersIn("{student} owes {amount} — see {}")).toEqual(["student", "amount"]);
    expect(placeholdersIn("nothing here")).toEqual([]);
  });
});

describe("renderTemplate", () => {
  it("substitutes every value it has", () => {
    const { text, missing } = renderTemplate("{student} in {group} scored {band}", {
      student: "Aziza",
      group: "Evening B2",
      band: "6.5",
    });
    expect(text).toBe("Aziza in Evening B2 scored 6.5");
    expect(missing).toEqual([]);
  });

  it("reports a missing value instead of writing a hole into the sentence", () => {
    // "came back at band ." and "band undefined" are both messages a centre
    // would rather not have sent.
    const { missing } = renderTemplate("came back at band {band}", { band: null });
    expect(missing).toEqual(["band"]);
  });

  it("treats blank and whitespace as missing", () => {
    expect(renderTemplate("{student} practised", { student: "" }).missing).toEqual(["student"]);
    expect(renderTemplate("{student} practised", { student: "  " }).missing).toEqual(["student"]);
  });

  it("substitutes a repeated placeholder everywhere it appears", () => {
    const { text } = renderTemplate("{student}, well done {student}", { student: "Jasur" });
    expect(text).toBe("Jasur, well done Jasur");
  });

  it("does not re-scan substituted text", () => {
    // A student legitimately named with braces, or a practice titled
    // "Task 2 — {group} living", must not have its own content substituted.
    const { text, missing } = renderTemplate("{practice} for {group}", {
      practice: "Task 2 — {group} living",
      group: "Evening B2",
    });
    expect(text).toBe("Task 2 — {group} living for Evening B2");
    expect(missing).toEqual([]);
  });
});

describe("composeAutoMessage", () => {
  const spec = AUTO_MESSAGE_BY_KEY.results_ready;

  it("sends nothing when the centre switched it off", () => {
    // The whole feature is this line. A toggle that does not stop the send is a
    // lie told to the person who flipped it.
    expect(
      composeAutoMessage({
        spec,
        setting: setting({ enabled: false }),
        values: { practice: "Task 2", band: "6.5" },
      }),
    ).toBeNull();
  });

  it("falls back to the code default when a centre has never edited it", () => {
    const composed = composeAutoMessage({
      spec,
      setting: null,
      values: { practice: "Task 2", band: "6.5" },
    });
    expect(composed?.body).toBe("Task 2 came back at band 6.5. Open it to see what capped it.");
  });

  it("prefers the centre's own wording", () => {
    const composed = composeAutoMessage({
      spec,
      setting: setting({ template: "Natija tayyor: {band}" }),
      values: { practice: "Task 2", band: "7.0" },
    });
    expect(composed?.body).toBe("Natija tayyor: 7.0");
  });

  it("treats a blank saved template as unedited rather than as a blank message", () => {
    expect(templateOf(spec, setting({ template: "   " }))).toBe(spec.defaultTemplate);
  });

  it("stays silent rather than sending a sentence with a hole in it", () => {
    // A reading quick practice has a score but no band. The template is valid,
    // the message is on, and there is still nothing to say.
    expect(
      composeAutoMessage({ spec, setting: setting(), values: { practice: "Reading 3", band: null } }),
    ).toBeNull();
  });

  it("never sends a message whose trigger does not exist yet", () => {
    // invoice_due is in the catalogue so the page shows the whole set. Enabling
    // it must not imply anything will arrive.
    expect(
      composeAutoMessage({
        spec: AUTO_MESSAGE_BY_KEY.invoice_due,
        setting: setting({ key: "invoice_due", enabled: true }),
        values: { student: "Aziza" },
      }),
    ).toBeNull();
  });

  it("respects the code default when a centre has no row at all", () => {
    expect(
      composeAutoMessage({
        spec: AUTO_MESSAGE_BY_KEY.gone_quiet,
        setting: null,
        values: { student: "Aziza" },
      }),
      "gone_quiet is off until a centre asks for it",
    ).toBeNull();

    expect(
      composeAutoMessage({
        spec: AUTO_MESSAGE_BY_KEY.practice_set,
        setting: null,
        values: { practice: "Task 2", group: "Evening B2" },
      }),
      "practice_set already fires today and must keep firing",
    ).not.toBeNull();
  });
});
