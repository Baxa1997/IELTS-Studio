/**
 * /grade'S "AT A GLANCE" FACTS ARE WHAT AN ANSWER ENGINE QUOTES, SO THEY MUST
 * STAY TRUE.
 *
 * The page tells ChatGPT and every other reader how many free gradings there
 * are, what the grader is based on and when that was checked. Each of those is
 * a number or a link that can drift from the code without anything noticing —
 * this file is the noticing.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { en } from "@/lib/i18n/messages/en";
import { ru } from "@/lib/i18n/messages/ru";
import { uz } from "@/lib/i18n/messages/uz";

import { FREE_LIMIT, GRADE_FACTS_CHECKED, IELTS_WRITING_DESCRIPTORS_URL } from "./facts";

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const env = read("../../../lib/env.ts");
const page = read("../page.tsx");
const grader = read("../_components/grader.tsx");

describe("/grade facts", () => {
  it("quote the same free allowance the server enforces", () => {
    /* The page says "{n} gradings with no account"; the API refuses the next
       one at PUBLIC_GRADER_PER_IP. A page promising more than the server gives
       is a false claim repeated in every AI answer that cites it. */
    const serverDefault = Number(env.match(/PUBLIC_GRADER_PER_IP,\s*(\d+)\)/)?.[1]);
    expect(serverDefault).toBe(FREE_LIMIT);
    expect(en["grade.factCostV"]).toContain("{n}");
  });

  it("keep one copy of the allowance, shared by the page and the checker", () => {
    expect(grader).toMatch(/import \{ FREE_LIMIT \} from "\.\.\/_lib\/facts"/);
    expect(grader).not.toMatch(/const FREE_LIMIT\s*=/);
  });

  it("cite the official descriptors on ielts.org, on the page and in the structured data", () => {
    expect(new URL(IELTS_WRITING_DESCRIPTORS_URL).protocol).toBe("https:");
    expect(new URL(IELTS_WRITING_DESCRIPTORS_URL).hostname).toBe("ielts.org");
    expect(page).toContain("isBasedOn: IELTS_WRITING_DESCRIPTORS_URL");
    expect(page).toContain("href: IELTS_WRITING_DESCRIPTORS_URL");
  });

  it("carry a real check date, shown and sent as dateModified", () => {
    expect(GRADE_FACTS_CHECKED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(GRADE_FACTS_CHECKED))).toBe(false);
    expect(page).toContain("dateModified: GRADE_FACTS_CHECKED");
    expect(page).toContain("<time dateTime={GRADE_FACTS_CHECKED}>");
  });

  it("name the exam in the page's one <h1>, in every language", () => {
    /* The <h1> is the pill. It said "Free writing checker" — the main heading of
       the page meant to answer "IELTS writing checker" never said IELTS. */
    for (const m of [en, ru, uz]) expect(m["grade.eyebrow"]).toContain("IELTS");
    // JSX comments stripped: the retired display title is still in the file, commented out.
    const live = page.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    expect(live.match(/<h1\b/g)).toHaveLength(1);
  });
});
