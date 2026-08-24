import { describe, expect, it } from "vitest";

import { liveProposalTurn } from "./live-proposal";

const turn = (n = 0) => ({ proposals: Array.from({ length: n }, (_, i) => ({ i })) });

describe("only the newest draft is armed", () => {
  it("finds nothing in a conversation that has proposed nothing", () => {
    expect(liveProposalTurn([])).toBe(-1);
    expect(liveProposalTurn([turn(), turn()])).toBe(-1);
  });

  it("arms the only proposal there is", () => {
    expect(liveProposalTurn([turn(), turn(1), turn()])).toBe(1);
  });

  /* The exact sequence that created two classes: draft, correction, redraft.
     Both buttons were live and the older one carried the wrong days. */
  it("disarms a draft the moment a redraft exists", () => {
    expect(liveProposalTurn([turn(1), turn(), turn(1)])).toBe(2);
  });

  it("keeps the LAST one live through a long back-and-forth", () => {
    expect(liveProposalTurn([turn(1), turn(1), turn(1), turn()])).toBe(2);
  });

  it("treats an explicitly empty proposal list as no proposal", () => {
    // The server sends `proposals: []` on every ordinary answer, so an empty
    // array must not count — or every reply would disarm the open draft.
    expect(liveProposalTurn([turn(1), { proposals: [] }])).toBe(0);
  });

  it("treats a missing list the same as an empty one", () => {
    expect(liveProposalTurn([turn(1), {}])).toBe(0);
  });
});
