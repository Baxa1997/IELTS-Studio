import { describe, expect, it } from "vitest";

import { ESSAY_TASK_TYPES } from "@/lib/prompts/constants";

import { DEFAULT_WRITE_TAB, WRITE_TABS, resolveWriteTab, writeHubHref } from "./hub-tabs";

describe("the Writing hub's tab", () => {
  it("is Task 1 on a bare /write — what the menu opens", () => {
    // The owner's rule. "Check your own writing" used to come first.
    expect(DEFAULT_WRITE_TAB).toBe("task1_academic");
    expect(resolveWriteTab(undefined)).toBe("task1_academic");
    expect(writeHubHref(DEFAULT_WRITE_TAB)).toBe("/write");
  });

  it("is whatever ?tab= names, when it names a real tab", () => {
    expect(resolveWriteTab("task2")).toBe("task2");
    expect(resolveWriteTab(["task1_general", "task2"])).toBe("task1_general");
    expect(resolveWriteTab("check_own")).toBe("check_own");
  });

  it("falls back to Task 1 for anything else, rather than an empty page", () => {
    expect(resolveWriteTab("custom")).toBe("task1_academic");
    expect(resolveWriteTab("")).toBe("task1_academic");
    expect(writeHubHref("nonsense")).toBe("/write");
  });

  it("can be named for every task a prompt can have, so the studio's way back lands on it", () => {
    // Derived from the task list rather than spelled out: a fourth task type
    // added there without a tab here would send its writers back to Task 1.
    const tabs = new Set<string>(WRITE_TABS.map((t) => t.key));
    for (const task of ESSAY_TASK_TYPES) {
      expect(tabs.has(task), `no hub tab for ${task}`).toBe(true);
      expect(resolveWriteTab(writeHubHref(task).split("tab=")[1])).toBe(task);
    }
  });
});
