import { describe, expect, it } from "vitest";

import { reachableSiblings } from "@/test/reachable";

/**
 * THE FREE LISTENING PAGE SHIPS THE RUNNER, NOT THE HUB.
 *
 * `PublicListeningRunner` used to live in `listening-client.tsx` beside the
 * signed-in hub, so /listen/free downloaded the library, its cards and the
 * generate banner to play one practice. Same fix and same guard as the CEFR
 * runner (`../cefr/public-runner.test.ts`).
 */

const HUB_ONLY = ["listening-client.tsx", "hub.tsx", "hub-pieces.tsx", "qtype-tags.ts"];

describe("the public Listening runner", () => {
  it("reaches the runner", () => {
    expect(reachableSiblings(__dirname, "public-runner.tsx")).toContain("runner.tsx");
  });

  it("never imports the signed-in hub, directly or through a sibling", () => {
    const files = [...reachableSiblings(__dirname, "public-runner.tsx")];
    expect(files.filter((f) => HUB_ONLY.includes(f))).toEqual([]);
  });
});
