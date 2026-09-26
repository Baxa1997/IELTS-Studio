import { describe, expect, it } from "vitest";
import { z } from "zod";

import { sharedPromptId } from "./shared";
import { STARTER_PROMPTS } from "./starter-set";

describe("the shared writing prompts' ids", () => {
  it("are the name-based uuid the migration derives, byte for byte", () => {
    /* ⚠️ A LITERAL, ON PURPOSE. public.shared_prompt_id() in
       supabase/migrations/20260926150000 derives the same value from the same
       key; if the key format drifts on either side (the separator, the order,
       the bits) the migration's rows and this module's stop being the same rows,
       and nothing else would notice. md5("task2\nabc") is
       e1bca188525c449201f6a2506c0ea8be; version 3 and the RFC variant are set. */
    expect(sharedPromptId("task2", "abc")).toBe("e1bca188-525c-3492-81f6-a2506c0ea8be");
  });

  it("are well-formed uuids — a strict validator accepts every one", () => {
    for (const p of STARTER_PROMPTS) {
      expect(z.uuid().safeParse(sharedPromptId(p.task_type, p.prompt_text)).success).toBe(true);
    }
  });

  it("are distinct across the whole curated set", () => {
    // Two prompts sharing an id would collapse into one shared row.
    const ids = STARTER_PROMPTS.map((p) => sharedPromptId(p.task_type, p.prompt_text));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("depend on the task as well as the text", () => {
    expect(sharedPromptId("task2", "same words")).not.toBe(sharedPromptId("task1_general", "same words"));
  });
});
