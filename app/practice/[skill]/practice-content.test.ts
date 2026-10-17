/**
 * What the practice page says, and how it lays the practices out — the
 * owner's 2026-10-17 pass: "CEFR reading and writing mixed up", and "practices
 * must be attractive and keyword for SEO and GEO".
 *
 * Pinned: the CEFR list in a section per paper (never interleaved again), the
 * page's numbers taken from the pools rather than typed into the copy, a
 * search title that carries the searched words, and a heading the share card
 * can still draw in two lines.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ACCURACY_CLAIM } from "@/lib/blog/validate";
import { FREE_PAGE_SEO_TITLE, FREE_PAGE_TITLE } from "@/lib/free-practice/links";
import {
  CEFR_READING_QUESTIONS,
  MINUTES,
  WRITING_TASK,
  type PoolItem,
} from "@/lib/free-practice/pools";
import { FREE_SKILLS } from "@/lib/free-practice/rotation";
import { translator } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";
import { en } from "@/lib/i18n/messages/en";

import { practiceFacts, practiceSummary } from "./_lib/facts";
import { practiceSections } from "./_lib/sections";

const t = translator(SOURCE_LOCALE);
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

const paper = (key: string, kind: "reading" | "writing"): PoolItem => ({
  key,
  source: key,
  format: "full",
  testNo: 1,
  part: null,
  paper: kind,
  title: key,
  topic: null,
  kind: null,
  level: null,
  minutes: 60,
  questions: null,
});

describe("the CEFR list, Reading apart from Writing", () => {
  // As the pool deals it — `alternate(reading, writing)` — R, W, R, W …
  const list = Array.from({ length: 20 }, (_, i) => paper(`p${i}`, i % 2 ? "writing" : "reading"));
  const keysOf = (items: (PoolItem | null)[]) =>
    items.filter((i): i is PoolItem => i !== null).map((i) => i.key);

  it("puts each paper in its own section, with nothing of the other in it", () => {
    const sections = practiceSections("cefr", list);
    expect(sections.map((s) => s.paper)).toEqual(["reading", "writing"]);
    for (const s of sections) {
      const held = [s.lead, ...s.items].filter((i): i is PoolItem => i !== null);
      expect(
        held.every((i) => i.paper === s.paper),
        `the ${s.paper} section holds another paper`,
      ).toBe(true);
    }
  });

  it("keeps all twenty, with today's new practice leading its own paper", () => {
    const sections = practiceSections("cefr", list);
    expect(keysOf(sections.flatMap((s) => [s.lead, ...s.items])).sort()).toEqual(
      keysOf(list).sort(),
    );
    expect(sections[0].lead?.key).toBe("p0");
    expect(sections[1].lead).toBeNull();
  });

  it("opens on Writing when today's new practice is a Writing paper", () => {
    const sections = practiceSections("cefr", list.slice(1));
    expect(sections.map((s) => s.paper)).toEqual(["writing", "reading"]);
    expect(sections[0].lead?.key).toBe("p1");
  });

  it("leaves every other skill as one list, in the rotation's order", () => {
    const items = list.map((i) => ({ ...i, paper: null }));
    const [only, ...more] = practiceSections("reading", items);
    expect(more).toEqual([]);
    expect(keysOf([only.lead, ...only.items])).toEqual(keysOf(items));
  });
});

describe("the page says what a practice is, in the pools' own numbers", () => {
  const texts = (s: (typeof FREE_SKILLS)[number]) => [
    practiceSummary(s, t),
    ...practiceFacts(s, t).map((f) => f.value),
  ];

  it("quotes the times and counts the runner actually gives", () => {
    expect(practiceSummary("writing", t)).toContain(
      `${WRITING_TASK.task1_academic.minutes} minutes for Task 1`,
    );
    expect(practiceSummary("writing", t)).toContain(`${WRITING_TASK.task2.minutes} for Task 2`);
    expect(practiceSummary("reading", t)).toContain(`${MINUTES.readingTest} minutes`);
    expect(practiceSummary("listening", t)).toContain(`${MINUTES.listeningTest} minutes`);
    expect(practiceSummary("cefr", t)).toContain(
      `${CEFR_READING_QUESTIONS} questions in ${MINUTES.cefrReading} minutes`,
    );
  });

  it("takes those numbers as placeholders — never typed into the copy", () => {
    // A literal "60" here would read true until the day the pools changed.
    expect(en["free.summaryReading"]).toMatch(/\{full\}[\s\S]*\{part\}/);
    expect(en["free.summaryListening"]).toMatch(/\{full\}[\s\S]*\{part\}/);
    expect(en["free.summaryWriting"]).toMatch(/\{t1\}[\s\S]*\{t2\}/);
    expect(en["free.summaryCefr"]).toMatch(/\{questions\}[\s\S]*\{reading\}[\s\S]*\{writing\}/);
    for (const s of ["Writing", "Reading", "Listening", "Cefr"] as const) {
      expect(en[`free.factTime${s}`], s).toMatch(/\{\w+\}[\s\S]*\{\w+\}/);
    }
  });

  it("fills every placeholder it uses", () => {
    for (const s of FREE_SKILLS)
      for (const text of texts(s)) expect(text, s).not.toMatch(/\{\w+\}/);
  });

  it("makes no measured-accuracy claim about the grader", () => {
    for (const s of FREE_SKILLS)
      for (const text of texts(s)) expect(text, s).not.toMatch(ACCURACY_CLAIM);
  });

  it("leads with the summary, straight under the heading", () => {
    const page = read("app/practice/[skill]/page.tsx");
    const heading = page.indexOf("{t(TITLE[skill])}");
    const summary = page.indexOf("{practiceSummary(skill, t)}");
    expect(heading).toBeGreaterThan(-1);
    expect(summary).toBeGreaterThan(heading);
    expect(summary).toBeLessThan(page.indexOf('{t("free.pageLead")}'));
  });
});

describe("the page's search title and its heading", () => {
  it("titles the search result in the searched words, within 60 characters", () => {
    for (const s of FREE_SKILLS) {
      const title = t(FREE_PAGE_SEO_TITLE[s]);
      expect(title.length, title).toBeLessThanOrEqual(60);
      expect(title, s).toMatch(/^Free /);
      expect(title, `${s}: the search title is only the heading again`).not.toBe(
        t(FREE_PAGE_TITLE[s]),
      );
    }
  });

  it("keeps the heading short enough for the share card's 72px line", () => {
    for (const s of FREE_SKILLS)
      expect(t(FREE_PAGE_TITLE[s]).length, t(FREE_PAGE_TITLE[s])).toBeLessThanOrEqual(48);
  });

  it("puts the search title in <title>, the heading stays on the page", () => {
    const page = read("app/practice/[skill]/page.tsx");
    expect(page).toContain("const title = t(FREE_PAGE_SEO_TITLE[skill]);");
    expect(page).toContain("{t(TITLE[skill])}");
  });
});

describe("the CEFR papers as tabs (owner, 2026-10-17)", () => {
  const grid = read("app/practice/[skill]/_components/free-practice-grid.tsx");
  const tabs = read("app/practice/[skill]/_components/paper-tabs.tsx");

  it("opens on the paper that holds today's new practice", () => {
    // practiceSections puts that paper first; the tabs start on section 0.
    expect(grid).toMatch(/<PaperTabs[\s\S]*?initial=\{sections\[0\]\.paper as string\}/);
  });

  it("draws every panel and only hides the inactive one, so the HTML keeps all twenty", () => {
    expect(tabs).toContain("hidden={tab.id !== active}");
    expect(tabs).not.toMatch(/tab\.id === active \? tab\.panel|active === tab\.id && /);
  });

  it("is a real tablist — roles, the selected state and keyboard support", () => {
    for (const s of [
      'role="tablist"',
      'role="tab"',
      'role="tabpanel"',
      "aria-selected={on}",
      "aria-controls=",
      "onKeyDown",
    ]) {
      expect(tabs, s).toContain(s);
    }
  });

  it("exports components only from its client module", () => {
    expect(tabs.startsWith('"use client";')).toBe(true);
    const exported = [
      ...tabs.matchAll(/^export (?:async )?(function|const|let|class) (\w+)/gm),
    ].map((m) => `${m[1]} ${m[2]}`);
    expect(exported).toEqual(["function PaperTabs"]);
  });
});
