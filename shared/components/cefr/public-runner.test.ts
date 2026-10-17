import { describe, expect, it } from "vitest";

import { reachableSiblings } from "@/test/reachable";

/**
 * THE FREE CEFR PAGE SHIPS THE RUNNERS, NOT THE HUB.
 *
 * `PublicCefrRunner` used to live in `multilevel-client.tsx` beside the
 * signed-in hub, so a visitor with no account downloaded the hub, its practice
 * cards and the generate picker to sit one paper. It has its own module now;
 * this walks that module's sibling imports and fails the day one of them
 * reaches the hub again — which nothing on screen would ever show.
 */

const HUB_ONLY = ["hub.tsx", "reading-generate-modal.tsx", "catalogue.ts", "multilevel-client.tsx"];

describe("the public CEFR runner", () => {
  it("reaches both runners", () => {
    const files = reachableSiblings(__dirname, "public-runner.tsx");
    expect(files).toContain("reading-runner.tsx");
    expect(files).toContain("writing-runner.tsx");
  });

  it("never imports the signed-in hub, directly or through a sibling", () => {
    const files = [...reachableSiblings(__dirname, "public-runner.tsx")];
    expect(files.filter((f) => HUB_ONLY.includes(f))).toEqual([]);
  });
});
