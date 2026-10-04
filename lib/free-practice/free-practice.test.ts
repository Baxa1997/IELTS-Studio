/**
 * The free daily practice's wiring — the parts that fail silently.
 *
 *  - The proxy mints the visitor cookie; the app reads it. They cannot share a
 *    constant (the proxy runs on the edge, the reader is server-only), and a
 *    drift would not throw: every visitor would quietly rotate on their IP.
 *  - A runner that is not public 307s every visitor to /sign-in, which would
 *    make "no account needed" false on the only page that matters.
 *  - The "done today" record is a signed cookie; if it could be forged or
 *    replayed from yesterday, the one-a-day rule would mean nothing.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FREE_RUNNER_BASE, freePracticePage, freeRunner, PRACTICE_CARD_SKILLS, signInFor } from "./links";
import { FREE_LIST_SIZE, FREE_SKILLS, listIndices, recentDays } from "./rotation";
import { readDone, readSpentOn, VISITOR_COOKIE, writeDone, writeSpentOn } from "./visitor";

const mw = readFileSync(join(process.cwd(), "lib/supabase/middleware.ts"), "utf8");
const list = (name: string) => {
  const start = mw.indexOf(`const ${name} = [`);
  expect(start, `${name} not found in middleware.ts`).toBeGreaterThan(-1);
  return mw.slice(start, mw.indexOf("];", start));
};
const covers = (block: string, path: string) =>
  [...block.matchAll(/"([^"]+)"/g)].some(([, p]) => path === p || path.startsWith(`${p}/`));

describe("the proxy and the app agree", () => {
  it("on the visitor cookie's name", () => {
    expect(mw).toContain(`const VISITOR_COOKIE = "${VISITOR_COOKIE}";`);
  });

  it("mint a visitor id on every page and route the free practice uses", () => {
    const paths = list("FREE_PRACTICE_PATHS");
    for (const s of FREE_SKILLS) {
      expect(covers(paths, freeRunner(s, "some-id")), freeRunner(s, "some-id")).toBe(true);
      expect(covers(paths, freePracticePage(s)), freePracticePage(s)).toBe(true);
    }
    expect(covers(paths, "/api/public/practice/reading")).toBe(true);
  });

  it("let a visitor with no account reach every one of them", () => {
    const pub = list("PUBLIC_PATHS");
    for (const s of FREE_SKILLS) {
      const runner = freeRunner(s, "some-id");
      expect(covers(pub, runner), `${runner} would redirect to /sign-in`).toBe(true);
      expect(covers(pub, freePracticePage(s)), `${freePracticePage(s)} would redirect to /sign-in`).toBe(true);
    }
  });
});

describe("the done-today record", () => {
  const day = "2026-09-27";

  it("round-trips", () => {
    const one = writeDone(new Set(), "reading", day);
    const two = writeDone(readDone(one, day), "writing", day);
    expect([...readDone(two, day)].sort()).toEqual(["reading", "writing"]);
  });

  it("means nothing on another day", () => {
    expect(readDone(writeDone(new Set(), "reading", day), "2026-09-28").size).toBe(0);
  });

  it("cannot be edited to say something else", () => {
    const real = writeDone(new Set(), "reading", day);
    const forged = real.replace("reading", "listening");
    expect(readDone(forged, day).size).toBe(0);
    // Nor re-dated to today from an old one.
    const old = writeDone(new Set(), "reading", "2026-09-20");
    expect(readDone(old.replace("2026-09-20", day), day).size).toBe(0);
  });

  it("treats junk as nothing done", () => {
    for (const junk of [undefined, "", "abc", "2026-09-27:reading", "x.y.z"]) {
      expect(readDone(junk, day).size).toBe(0);
    }
  });
});

describe("the record of which practice the day went on", () => {
  /* A CEFR Writing paper is three tasks graded one by one; this record is what
     lets the paper finish after its first grade marked the day done. If it
     could be forged, it would be a way past the one-a-day rule. */
  const day = "2026-09-27";
  const key = "11111111-2222-4333-8444-555555555555";

  it("round-trips, for the right day and skill only", () => {
    const raw = writeSpentOn(day, "cefr", key);
    expect(readSpentOn(raw, day, "cefr")).toBe(key);
    expect(readSpentOn(raw, "2026-09-28", "cefr")).toBeNull();
    expect(readSpentOn(raw, day, "reading")).toBeNull();
  });

  it("cannot be edited to name another paper", () => {
    const raw = writeSpentOn(day, "cefr", key);
    expect(readSpentOn(raw.replace("1111", "9999"), day, "cefr")).toBeNull();
    expect(readSpentOn(undefined, day, "cefr")).toBeNull();
    expect(readSpentOn(`${day}:cefr:${key}`, day, "cefr")).toBeNull();
  });
});

describe("the links", () => {
  it("offers the free skills, CEFR among them, then Speaking behind sign-in", () => {
    expect(FREE_SKILLS).toContain("cefr");
    expect(PRACTICE_CARD_SKILLS).toEqual([...FREE_SKILLS, "speaking"]);
    expect(Object.keys(FREE_RUNNER_BASE)).not.toContain("speaking");
  });

  it("opens every practice on our own runner — never the dashboard or sign-in", () => {
    for (const s of FREE_SKILLS) {
      const url = freeRunner(s, "abc_2");
      expect(url.startsWith(`${FREE_RUNNER_BASE[s]}/`)).toBe(true);
      expect(url).not.toMatch(/sign-in|dashboard/);
    }
  });

  it("sends sign-in back to the skill the visitor reached for", () => {
    expect(signInFor("speaking")).toBe("/sign-in?next=%2Fspeak");
  });

  it("keeps Speaking out of the practice pages", () => {
    const page = readFileSync(join(process.cwd(), "app/practice/[skill]/page.tsx"), "utf8");
    expect(page).toMatch(/export const dynamicParams = false/);
    expect(page).toMatch(/FREE_SKILLS\.map/);
  });
});

describe("every free practice recommends signing in for more", () => {
  /* THE OWNER'S RULE (2026-09-27): each time a visitor uses a free practice,
     recommend signing in to get more free practices. A runner that stopped
     passing the copy, or stopped rendering it, would drop the one message the
     free practice exists to deliver — silently, since nothing would break. */
  const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

  it("says it in the owner's words", async () => {
    const { en } = await import("@/lib/i18n/messages/en");
    expect(en["free.moreCta"]).toBe("Sign in to get more free practices");
    expect(en["free.moreBody"]).toMatch(/^Sign in to get more free practices/);
  });

  it("hands the message to every runner, and gates a used day with it", () => {
    const pages: [string, string][] = [
      ["app/(studio)/write/free/[id]/page.tsx", "writing"],
      ["app/(studio)/read/free/[id]/page.tsx", "reading"],
      ["app/(studio)/listen/free/[key]/page.tsx", "listening"],
      ["app/(studio)/cefr/free/[key]/page.tsx", "cefr"],
    ];
    for (const [file, skill] of pages) {
      const src = read(file);
      expect(src, file).toContain(`freeTrialCopy(t, "${skill}")`);
      // CEFR's gate opens for the paper the day went on — see the cefr route.
      expect(src, `${file}: a used day must show the gate`).toMatch(
        /if \(entry\.done(?: && \(await spentOnToday\(entry\.day, "cefr"\)\) !== entry\.item\.key)?\)[\s\S]{0,120}<FreeTrialGate/,
      );
      expect(src, `${file}: must check the visitor's list`).toContain(`onTodaysList("${skill}"`);
    }
    // Every free skill has a runner page in this list.
    expect(pages.map(([, skill]) => skill).sort()).toEqual([...FREE_SKILLS].sort());
  });

  it("shows it while practising and again on the result, in every runner", () => {
    const runners: [string, string][] = [
      ["app/(studio)/write/_components/writing-studio.tsx", "publicMode.copy"],
      ["app/(studio)/read/_components/reading-runner.tsx", "publicMode.copy"],
      ["app/(studio)/read/_components/test-runner.tsx", "publicMode.copy"],
      ["shared/components/listening/listening-client.tsx", "publicRun.copy"],
      ["shared/components/cefr/multilevel-client.tsx", "publicMode.copy"],
    ];
    for (const [file, copy] of runners) {
      const src = read(file);
      expect(src, `${file}: no strip while practising`).toContain(`<FreeTrialStrip copy={${copy}} />`);
      expect(src, `${file}: no card on the result`).toContain(`<FreeTrialCard copy={${copy}} />`);
    }
  });

  it("lays the landing section's cards out for exactly as many skills as it has", () => {
    // `.bl-grid-N` is sized for N cards; a skill added without it strands one.
    expect(read("app/_landing/_components/landing-page.tsx")).toContain(`bl-grid-${PRACTICE_CARD_SKILLS.length}`);
    expect(read("app/_landing/_lib/blog-css.ts")).toContain(`.bl-grid-${PRACTICE_CARD_SKILLS.length}{`);
  });

  it("offers it on the practice pages and under the landing section's cards", () => {
    expect(read("app/practice/[skill]/page.tsx")).toContain("<MorePracticeBanner skill={skill} t={t} />");
    expect(read("app/_landing/_components/landing-page.tsx")).toContain('{t("free.moreCta")} →');
  });
});

describe("a full test is the whole test, on the full-test runner (owner, 2026-09-27)", () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

  it("opens a full Reading test in the three-passage runner, in public mode", () => {
    const page = read("app/(studio)/read/free/[id]/page.tsx");
    expect(page).toMatch(/if \(entry\.item\.format === "full"\)[\s\S]*<ReadingTestRunner[\s\S]*publicMode=\{publicMode\}/);
    expect(page).toMatch(/<ReadingRunner[\s\S]*publicMode=\{publicMode\}/);
  });

  it("asks the engine for the whole Listening test, or the one part, from the list's entry", () => {
    expect(read("app/(studio)/listen/free/[key]/page.tsx")).toContain('listeningPublic<RenderView>("render", publicTarget(entry.item))');
    expect(read("app/api/public/practice/listening/route.ts")).toContain("publicTarget(today.item)");
  });

  it("marks a Listening practice by the list's key, never the engine's view id", () => {
    /* The engine names a part `id:part` and the list `id_part`. Grading by
       `view.id` sent the former, so every free part came back "not today" —
       live from the first release until this was pinned. */
    const client = read("shared/components/listening/listening-client.tsx");
    expect(client).toContain("JSON.stringify({ key: practiceKey, answers })");
    expect(read("app/(studio)/listen/free/[key]/page.tsx")).toContain("practiceKey={entry.item.key}");
  });
});

describe("a free CEFR paper (owner, 2026-10-04)", () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
  const client = read("shared/components/cefr/multilevel-client.tsx");

  it("is marked by the list's key, through the app's route — never the engine directly", () => {
    expect(client).toContain("JSON.stringify({ key: mode.practiceKey, ...body })");
    expect(read("app/(studio)/cefr/free/[key]/page.tsx")).toContain("practiceKey: entry.item.key");
    expect(read("app/(studio)/cefr/free/[key]/page.tsx")).toContain('submitUrl: "/api/public/practice/cefr"');
  });

  it("gives a visitor no coach and no word lookup — both are signed-in APIs", () => {
    expect(client.match(/const \[coachOpen, setCoachOpen\] = useState\(!publicMode\);/g)).toHaveLength(2);
    expect(client).toContain("hl.tool === null && !publicMode ? (");
  });

  it("asks the engine for the paper by the list's own entry", () => {
    expect(read("app/(studio)/cefr/free/[key]/page.tsx")).toContain(
      'multilevelPublic<ReadingPaper | WritingPaper>("render", { item_id: entry.item.source })',
    );
  });
});

describe("every practice list", () => {
  it("shows at least twenty practices whenever the pool has them (owner, 2026-09-27)", () => {
    expect(FREE_LIST_SIZE).toBeGreaterThanOrEqual(20);
    for (const size of [25, 76, 140, 176]) {
      expect(listIndices(size, "v", "reading", "2026-09-27")).toHaveLength(FREE_LIST_SIZE);
    }
  });

  it("shows a smaller pool whole, never padded with repeats", () => {
    const list = listIndices(7, "v", "reading", "2026-09-27");
    expect(list).toHaveLength(7);
    expect(new Set(list).size).toBe(7);
  });

  it("never lists the same practice twice", () => {
    const list = listIndices(25, "v", "writing", "2026-09-27");
    expect(new Set(list).size).toBe(list.length);
  });

  it("brings one new practice a day, per visitor", () => {
    const [today, yesterday] = recentDays("2026-09-27", 2);
    const a = listIndices(76, "v", "writing", yesterday);
    const b = listIndices(76, "v", "writing", today);
    expect(b.slice(0, -1)).toEqual(a.slice(1)); // yesterday's list, shifted by one
    expect(a).not.toContain(b[b.length - 1]); // and one practice it did not have
  });

  it("gives two visitors different lists", () => {
    expect(listIndices(140, "visitor-a", "listening", "2026-09-27")).not.toEqual(
      listIndices(140, "visitor-b", "listening", "2026-09-27"),
    );
  });
});


describe("the practice page's cards", () => {
  /* The owner's calls on one day (2026-09-27): not the signed-in hubs'
     PracticeCard ("no practice card"); the blog's covered card, kept ("design
     as previous"); and on the cover, the practice's ICON followed by its skill
     ("Reading") — the icon added before the word, not in place of it. The
     practice behind each card is still the signed-in runner; only the list's
     look is pinned here. */
  const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
  const grid = read("app/practice/[skill]/_components/free-practice-grid.tsx");
  const landing = read("app/_landing/_components/practice-cards.tsx");
  const cover = read("app/_landing/_components/blog-stories.tsx");

  it("are not the signed-in practice card", () => {
    expect(grid).not.toMatch(/shared\/components\/practice\/card/);
  });

  it("are the blog's covered cards — the lead and the grid", () => {
    expect(grid).toContain('className="bl-story bl-lead"');
    expect(grid).toContain('className="bl-story bl-card"');
  });

  it("show the icon, the TEST'S NUMBER and full-or-part on every practice cover", async () => {
    // The owner's words (2026-09-27): "show the Test count and below the Full
    // reading or part reading, and the same for all practice".
    expect(grid.match(/<GeneratedCover [^>]*\{\.\.\.coverOf\(skill, item, t\)\}/g)?.length).toBe(2);
    expect(grid).toContain("icon: coverIcon(skill, item)");
    expect(grid).toContain('kicker: t("free.testNo", { n: item.testNo })');
    expect(grid).toContain("caption: formatLabel(skill, item, t)");
    const { en } = await import("@/lib/i18n/messages/en");
    expect([en["free.testNo"], en["free.fullReading"], en["free.partReading"]]).toEqual([
      "Test {n}",
      "Full reading",
      "Part reading",
    ]);
    expect([en["free.fullListening"], en["free.partListening"]]).toEqual(["Full listening", "Part listening"]);
    // The landing section's four skill cards keep the skill's own name.
    expect(landing).toMatch(/<GeneratedCover [^>]*icon=\{SKILL_ICON\[skill\]\} kicker=\{t\(SKILL_NAME\[skill\]\)\}/);
  });

  it("set the icon before the number, in one line, and full-or-part under it", () => {
    expect(cover).toMatch(
      /<span className="bl-kicker-line">\s*\{icon \? <span className="bl-kicker-icon">\{icon\}<\/span> : null\}\s*<span className="bl-kicker-text">\{kicker\}<\/span>\s*<\/span>\s*\{caption \? <span className="bl-kicker-sub">\{caption\}<\/span> : null\}/,
    );
  });

  it("colour the icon through CSS, never the SVG attribute", () => {
    // Lucide puts `color` in the stroke attribute, where var(--…) is black.
    for (const src of [grid, landing]) {
      expect(src).not.toMatch(/<(BookOpen|Headphones|BarChart3|Mail|PenLine|Mic) [^>]*color=/);
    }
    // Sliced rather than matched with [^}]*: the rule holds `${DISPLAY}`,
    // whose own brace would end a naive match before it reached the colour.
    const css = read("app/_landing/_lib/blog-css.ts");
    const rule = css.slice(css.indexOf(".bl-kicker{"), css.indexOf("\n  }", css.indexOf(".bl-kicker{")));
    expect(rule).toContain("color:${WHITE}");
  });
});
