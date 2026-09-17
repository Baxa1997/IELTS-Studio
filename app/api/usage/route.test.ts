/**
 * GET /api/usage — the plan dialog's fresh numbers.
 *
 * It answers only for the people the plan card is drawn for. A center pays per
 * seat and enforces none of these limits, so quoting its students — or its
 * staff — a meter would be quoting a number nobody holds them to.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Profile } from "@/lib/auth";

const session = vi.hoisted(() => ({ profile: null as unknown }));
const getUsageSummary = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", async (importActual) => ({
  // The real `isHomeworkOnlyStudent`, so this cannot drift from the layouts
  // that decide whether the plan card is drawn at all.
  ...(await importActual<typeof import("@/lib/auth")>()),
  requireOrgUser: async () => ({ user: { id: "u1" }, profile: session.profile }),
}));
vi.mock("@/lib/quota", () => ({ getUsageSummary }));

const { GET } = await import("./route");

const SUMMARY = { plan: "trial", planName: "Free" };

function as(role: Profile["role"], kind: "personal" | "center"): void {
  session.profile = {
    id: "u1",
    organization_id: "org-1",
    role,
    org: { kind, status: "active" },
  };
}

beforeEach(() => {
  getUsageSummary.mockReset();
  getUsageSummary.mockResolvedValue(SUMMARY);
});

describe("GET /api/usage", () => {
  it("gives a solo learner their own org's numbers, uncached", async () => {
    as("student", "personal");
    const response = await GET();
    expect(getUsageSummary).toHaveBeenCalledWith("org-1");
    expect(await response.json()).toEqual({ usage: SUMMARY });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("quotes a center student nothing", async () => {
    as("student", "center");
    const response = await GET();
    expect(await response.json()).toEqual({ usage: null });
    expect(getUsageSummary).not.toHaveBeenCalled();
  });

  it.each(["teacher", "center_admin", "administrator"] as const)(
    "quotes a %s nothing",
    async (role) => {
      as(role, "center");
      const response = await GET();
      expect(await response.json()).toEqual({ usage: null });
      expect(getUsageSummary).not.toHaveBeenCalled();
    },
  );
});
