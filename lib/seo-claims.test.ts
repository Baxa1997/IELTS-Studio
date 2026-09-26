/**
 * WHAT THE PUBLIC SITE MAY CLAIM ABOUT THE GRADER — pinned, because it is copy
 * that answer engines repeat verbatim and that a real exam result can falsify.
 *
 * 2026-09-26: "within ±0.5 of human examiners" and "calibrated against
 * expert-judged essays" were on seven public surfaces while every anchor in
 * .claude/skills/ielts-examiner/references/anchors/ said "expert-verification
 * pending". When the grader has actually been measured, change the anchors'
 * status line FIRST — this test reads it — and the claims may come back.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { sourceFiles } from "@/test/source-files";

import { PLATFORM_FEATURES, SEO_KEYWORDS } from "./seo";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (p: string) => readFileSync(join(root, p), "utf8");
/** The copy only — a comment explaining why a claim was removed may quote it. */
const copy = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

const anchorsDir = ".claude/skills/ielts-examiner/references/anchors";
const unverified = readdirSync(join(root, anchorsDir)).some((f) =>
  read(join(anchorsDir, f)).includes("expert-verification pending"),
);

const PUBLIC = [
  "app/(auth)/sign-in/page.tsx",
  "app/grade/page.tsx",
  "app/(marketing)/ielts-practice/page.tsx",
  "app/(marketing)/ielts-writing-practice/page.tsx",
  "app/(marketing)/ielts-speaking-practice/page.tsx",
  "lib/seo.ts",
  "lib/i18n/messages/en.ts",
  // Every blog post, found rather than listed — a new article about the grader
  // is exactly where this claim would come back.
  ...sourceFiles("lib/blog/posts").filter((f) => f.endsWith(".ts")),
];

describe("claims about grading accuracy", () => {
  it.runIf(unverified)("make no measured-accuracy claim while the anchors are unverified", () => {
    for (const file of PUBLIC) {
      const text = copy(file);
      expect(text, file).not.toMatch(/±\s*0\.5|within (about )?half a band|calibrated against expert/i);
    }
  });

  it.runIf(unverified)("do not call the grader 'calibrated' in the list answer engines lift", () => {
    for (const feature of PLATFORM_FEATURES) expect(feature).not.toMatch(/calibrated/i);
  });
});

describe("the keywords", () => {
  it("name no competitor and claim no Cambridge material", () => {
    for (const k of SEO_KEYWORDS) {
      expect(k).not.toMatch(/engnovate|ielts\.gg|writing9|cambridge/i);
    }
  });
});
