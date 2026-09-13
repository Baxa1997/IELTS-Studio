import { describe, expect, it } from "vitest";

import {
  accountDeletionBlocker,
  needsStripeCancellation,
  RESERVED_ORG_IDS,
  speakingAudioPaths,
} from "./deletion-rules";

const me = "user-1";
const org = "org-1";
const solo = {
  userId: me,
  organizationId: org,
  orgKind: "personal",
  members: [{ id: me, role: "student" }],
};

describe("accountDeletionBlocker", () => {
  it("lets a solo learner delete their own personal workspace", () => {
    expect(accountDeletionBlocker(solo)).toBeNull();
  });

  it("never deletes a reserved organisation, even one shaped like a personal workspace", () => {
    for (const id of RESERVED_ORG_IDS) {
      expect(accountDeletionBlocker({ ...solo, organizationId: id }), id).toMatch(
        /part of the platform/,
      );
    }
  });

  it("refuses a center account", () => {
    expect(accountDeletionBlocker({ ...solo, orgKind: "center" })).toMatch(/belongs to a center/);
    expect(accountDeletionBlocker({ ...solo, orgKind: null })).toMatch(/belongs to a center/);
  });

  it("refuses a workspace with anyone else in it", () => {
    const shared = {
      ...solo,
      members: [
        { id: me, role: "student" },
        { id: "user-2", role: "student" },
      ],
    };
    expect(accountDeletionBlocker(shared)).toMatch(/other people/);
  });

  it("refuses when the only member is somebody else, or nobody", () => {
    expect(
      accountDeletionBlocker({ ...solo, members: [{ id: "user-2", role: "student" }] }),
    ).toMatch(/other people/);
    expect(accountDeletionBlocker({ ...solo, members: [] })).toMatch(/other people/);
  });

  it("refuses a non-learner", () => {
    expect(
      accountDeletionBlocker({ ...solo, members: [{ id: me, role: "center_admin" }] }),
    ).toMatch(/Only a learner/);
  });
});

describe("needsStripeCancellation", () => {
  const live = {
    provider: "stripe",
    status: "active",
    external_subscription_id: "sub_123",
    external_customer_id: null,
  };

  it("cancels a live card subscription", () => {
    expect(needsStripeCancellation(live)).toBe(true);
    expect(needsStripeCancellation({ ...live, status: "past_due" })).toBe(true);
    expect(
      needsStripeCancellation({
        ...live,
        external_subscription_id: null,
        external_customer_id: "cus_1",
      }),
    ).toBe(true);
  });

  it("leaves alone what has nothing to cancel", () => {
    expect(needsStripeCancellation(null)).toBe(false);
    expect(needsStripeCancellation({ ...live, status: "canceled" })).toBe(false);
    expect(needsStripeCancellation({ ...live, provider: "payme" })).toBe(false);
    expect(
      needsStripeCancellation({
        ...live,
        external_subscription_id: null,
        external_customer_id: null,
      }),
    ).toBe(false);
  });
});

describe("speakingAudioPaths", () => {
  it("collects every recording once, skipping blanks", () => {
    expect(
      speakingAudioPaths(
        [{ audio_path: "a.webm" }, { audio_path: null }, { audio_path: "" }],
        [
          { candidate_audio_path: "b.webm", examiner_audio_path: "c.webm" },
          { candidate_audio_path: "a.webm", examiner_audio_path: null },
        ],
      ),
    ).toEqual(["a.webm", "b.webm", "c.webm"]);
  });
});
