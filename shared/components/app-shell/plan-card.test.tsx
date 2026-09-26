// @vitest-environment jsdom
/**
 * The plan button at the foot of the rail, and the dialog it opens.
 *
 * It replaced a card that showed every meter in the rail (owner, 2026-09-17:
 * "make it a button like Base44, clicking opens a modal with what is left of
 * each practice and an upgrade button"). These pin the parts of that trade that
 * are easy to lose: the detail must still be one click away and correct, the
 * "you have run out" warning must stay visible without the click, and the
 * dialog must be drawn where the app's typefaces and the viewport can reach it.
 */

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OrgPlan, Quota, UsageSummary } from "@/lib/quota";

vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  default: ({ children, href, onClick, prefetch, ...rest }: Record<string, unknown>) => (
    <a
      href={href as string}
      onClick={(e) => {
        (onClick as React.MouseEventHandler | undefined)?.(e);
        // jsdom cannot navigate; it would only log that it tried.
        e.preventDefault();
      }}
      {...(rest as Record<string, unknown>)}
    >
      {children as React.ReactNode}
    </a>
  ),
}));

const { PlanCard } = await import("./plan-card");

const NO_BREAK_SPACE = String.fromCharCode(0xa0);

const RESET = "2026-10-01T00:00:00.000Z";

function quota(limit: number | null, used: number): Quota {
  return {
    limit,
    used,
    remaining: limit === null ? null : Math.max(0, limit - used),
    resetAt: RESET,
    exceeded: limit !== null && used >= limit,
  };
}

function summary(
  plan: OrgPlan,
  planName: string,
  grade: Quota,
  generate: Quota,
  speaking: Quota,
): UsageSummary {
  return { plan, planName, grade, generate, speaking };
}

const FREE = summary("trial", "Free", quota(5, 2), quota(5, 1), quota(1, 0));
const PRO = summary("pro", "Pro", quota(null, 0), quota(null, 0), quota(8, 1));
const ENTERPRISE = summary("enterprise", "Enterprise", quota(null, 0), quota(null, 0), quota(8, 0));

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  // By default the refresh answers with nothing, so the layout's numbers stand.
  fetchMock.mockResolvedValue({ ok: false, json: async () => null });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Mounted the way the shell mounts it: inside the app root, inside the rail. */
function renderInRail(usage: UsageSummary) {
  return render(
    <div className="lp-root">
      <aside className="lp-shell-sidebar">
        <div className="lp-sb-footer">
          <PlanCard usage={usage} />
        </div>
      </aside>
    </div>,
  );
}

const railButton = () =>
  document.querySelector<HTMLButtonElement>(".lp-plan-btn") as HTMLButtonElement;
const rail = () => document.querySelector<HTMLElement>(".lp-shell-sidebar") as HTMLElement;

function openDialog(): HTMLElement {
  fireEvent.click(railButton());
  return screen.getByRole("dialog");
}

describe("in the rail it is one compact button", () => {
  it("reads like the reference: a title over one short line", () => {
    renderInRail(FREE);
    expect(railButton()).toHaveTextContent("Upgrade your plan");
    expect(railButton()).toHaveTextContent("Free · see what's left");
  });

  it("keeps the meters and the upgrade link out of the rail", () => {
    renderInRail(FREE);
    expect(within(rail()).queryByText("Gradings")).toBeNull();
    expect(within(rail()).queryByText(/\d+ (of \d+ )?left/)).toBeNull();
    expect(within(rail()).queryByText("Unlimited")).toBeNull();
    expect(rail().querySelector('a[href="/pricing"]')).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("still says so in the rail when an allowance has run out", () => {
    // The one piece of the old card's detail that must not wait for a click.
    renderInRail(summary("trial", "Free", quota(5, 2), quota(5, 1), quota(1, 1)));
    expect(railButton()).toHaveTextContent("No speaking mocks left");
  });

  it("does not call an allowance the plan never had 'spent'", () => {
    renderInRail(summary("trial", "Free", quota(5, 0), quota(5, 0), quota(0, 0)));
    expect(railButton()).toHaveTextContent("Free · see what's left");
  });

  it("offers no upgrade on the top plan", () => {
    renderInRail(ENTERPRISE);
    expect(railButton()).toHaveTextContent("Enterprise plan");
    expect(railButton()).not.toHaveTextContent("Upgrade");
  });
});

describe("the dialog", () => {
  it("opens on click and says what is left of each allowance", () => {
    renderInRail(FREE);
    const dialog = openDialog();
    expect(within(dialog).getByRole("heading", { name: "Free plan" })).toBeTruthy();

    const rows = within(dialog).getAllByRole("listitem");
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringMatching(/^Gradings3 of 5 left/),
      expect.stringMatching(/^Practice sets4 of 5 left/),
      expect.stringMatching(/^Speaking mocks1 of 1 left/),
    ]);
  });

  it("says when the counts reset, in UTC, without splitting the date", () => {
    renderInRail(FREE);
    expect(openDialog().textContent).toContain("Counts reset on 1" + NO_BREAK_SPACE + "October.");
  });

  it("shows an unlimited allowance as unlimited", () => {
    renderInRail(PRO);
    const dialog = openDialog();
    expect(within(dialog).getAllByText("Unlimited")).toHaveLength(2);
    expect(within(dialog).getByText("7 of 8 left")).toBeTruthy();
  });

  it("names a spent allowance plainly", () => {
    renderInRail(summary("starter", "Standard", quota(25, 25), quota(25, 3), quota(2, 0)));
    expect(within(openDialog()).getByText("None left")).toBeTruthy();
  });

  it("carries the upgrade button, which closes it on the way to pricing", () => {
    renderInRail(FREE);
    const dialog = openDialog();
    const upgrade = within(dialog).getByRole("link", { name: "Upgrade your plan" });
    expect(upgrade).toHaveAttribute("href", "/pricing");
    fireEvent.click(upgrade);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has no upgrade button on the top plan, but still reaches billing", () => {
    renderInRail(ENTERPRISE);
    const dialog = openDialog();
    expect(dialog.querySelector('a[href="/pricing"]')).toBeNull();
    expect(within(dialog).getByRole("link", { name: /billing/i })).toHaveAttribute(
      "href",
      "/settings/billing",
    );
  });

  it("is drawn outside the rail but inside the app root", () => {
    /* Inside the rail, `position: fixed` would stick to the phone drawer's
       transform instead of the screen. Outside `.lp-root`, the app's typeface
       variables do not exist and the dialog renders in the system font. */
    renderInRail(FREE);
    const dialog = openDialog();
    expect(dialog.closest(".lp-shell-sidebar")).toBeNull();
    expect(dialog.closest(".lp-root")).not.toBeNull();
  });

  it("reports its state on the button that opens it", () => {
    renderInRail(FREE);
    expect(railButton()).toHaveAttribute("aria-haspopup", "dialog");
    expect(railButton()).toHaveAttribute("aria-expanded", "false");
    openDialog();
    expect(railButton()).toHaveAttribute("aria-expanded", "true");
  });

  it("closes on Escape and hands focus back to the button", () => {
    renderInRail(FREE);
    openDialog();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(railButton());
  });
});

describe("the dialog's numbers are fresh", () => {
  it("asks for them again when it opens", async () => {
    // The layout's copy can be a practice behind; the dialog shows the answer.
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ usage: { ...FREE, grade: quota(5, 5) } }),
    });
    renderInRail(FREE);
    const dialog = openDialog();
    expect(fetchMock).toHaveBeenCalledWith("/api/usage", { cache: "no-store" });
    expect(await within(dialog).findByText("None left")).toBeTruthy();
    // …and the rail's warning follows the fresh numbers too.
    expect(railButton()).toHaveTextContent("No gradings left");
  });

  it("keeps the layout's numbers when the refresh fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    renderInRail(FREE);
    const dialog = openDialog();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(within(dialog).getByText("3 of 5 left")).toBeTruthy();
    expect(within(dialog).getByText("4 of 5 left")).toBeTruthy();
  });

  it("lets newer numbers from the layout win over an older fetch", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ usage: { ...FREE, generate: quota(5, 0) } }),
    });
    const view = renderInRail(FREE);
    const dialog = openDialog();
    expect(await within(dialog).findByText("5 of 5 left")).toBeTruthy();

    // The layout renders again with a later count.
    fetchMock.mockResolvedValue({ ok: false, json: async () => null });
    const later = { ...FREE, generate: quota(5, 4) };
    view.rerender(
      <div className="lp-root">
        <aside className="lp-shell-sidebar">
          <div className="lp-sb-footer">
            <PlanCard usage={later} />
          </div>
        </aside>
      </div>,
    );
    const rows = within(screen.getByRole("dialog")).getAllByRole("listitem");
    expect(rows[1]).toHaveTextContent("1 of 5 left");
  });
});
