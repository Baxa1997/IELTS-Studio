// @vitest-environment jsdom
/**
 * The group row, exercised rather than read.
 *
 * The rest of the rail's guards are static scans over the source, because the
 * things that break there are CSS declarations jsdom cannot evaluate. This one
 * is different: what the owner asked for is a real interaction, and it is one
 * control doing two jobs.
 *
 *   shut  → go to the first page inside the group, and unfold it.
 *   open  → fold it, and stay where you are.
 *
 * Three ways that goes wrong, all behavioural and none visible to a type check:
 *
 *   1. The row only navigates, so a group you opened cannot be closed by
 *      pressing the same place that opened it (this is what shipped first, and
 *      what the owner sent back).
 *   2. The row only toggles, so "choose the first menu inside" never happens.
 *   3. Folding follows the href anyway, so closing a group navigates you off the
 *      page you were reading.
 */

import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pathname = { current: "/console" };
/* ⚠️ WHAT THE MOCK <Link> HAS TO RECORD, and why the obvious test was wrong.
   The mock calls preventDefault itself, so jsdom does not log "Not implemented:
   navigation" on every click. That makes `event.defaultPrevented` useless to the
   tests — it is true after EVERY click, whether the component prevented or not.
   So the mock reads the flag straight after the component's own handler, before
   adding its own, and the tests assert on that. */
const lastClick = vi.hoisted(() => ({ preventedByNav: false }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));
vi.mock("next/link", () => ({
  default: ({ children, href, onClick, ...rest }: Record<string, unknown>) => {
    const h = href as string;
    return (
      <a
        href={h}
        onClick={(e) => {
          (onClick as React.MouseEventHandler | undefined)?.(e);
          lastClick.preventedByNav = e.defaultPrevented;
          // Only now, so jsdom does not log "Not implemented: navigation".
          e.preventDefault();
        }}
        {...(rest as Record<string, unknown>)}
      >
        {children as React.ReactNode}
      </a>
    );
  },
  useLinkStatus: () => ({ pending: false }),
}));

const { SidebarNav } = await import("./sidebar-nav");

/* ⚠️ SCOPED TO THE GROUP ROWS, because the labels are not unique and a plain
   `getByRole("link", { name: "Practice" })` is ambiguous: the teacher's rail has
   a "Practice" GROUP and a "Practice" item (/console/practice) inside Learning.
   Querying the whole document finds both and throws. */
function groupRow(title: string): HTMLElement {
  const rows = Array.from(document.querySelectorAll<HTMLElement>(".lp-sb-grouprow"));
  const row = rows.find((r) => r.querySelector(".lp-sb-label")?.textContent === title);
  expect(row, `no group row for ${title}`).toBeTruthy();
  return row as HTMLElement;
}

/* The row IS the link — one control doing both jobs — so this is the same
   element as `groupRow`. Kept as its own name because the tests below read very
   differently depending on which job they are talking about. */
const groupLink = groupRow;

const panelOf = (title: string) =>
  document.getElementById(`sb-group-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);

beforeEach(() => {
  pathname.current = "/console";
  window.localStorage.clear();
  lastClick.preventedByNav = false;
});
afterEach(cleanup);

describe("pressing a shut group chooses its first destination", () => {
  it("links the label to the first item inside, not to a page of its own", () => {
    render(<SidebarNav role="teacher" />);
    // Teaching holds Groups, Students, Calendar, My pay — Groups is first.
    expect(groupLink("Teaching")).toHaveAttribute("href", "/console/groups");
    // Practice leads with Practice AI.
    expect(groupLink("Practice")).toHaveAttribute("href", "/console/practice-ai");
  });

  it("unfolds on the way in, and folds again on the next press", () => {
    render(<SidebarNav role="teacher" />);

    // Groups default to open, so fold it first to get a shut one.
    fireEvent.click(groupLink("Teaching"));
    expect(panelOf("Teaching")).toHaveAttribute("data-open", "0");

    fireEvent.click(groupLink("Teaching"));
    expect(panelOf("Teaching")).toHaveAttribute("data-open", "1");

    /* THE REGRESSION THIS PINS, and it is the one the owner sent back: pressing
       an OPEN group used to re-navigate to its first child and leave it open, so
       there was no way to close a group from the row that opened it. */
    fireEvent.click(groupLink("Teaching"));
    expect(panelOf("Teaching")).toHaveAttribute("data-open", "0");
  });

  it("does not follow the link when it is folding", () => {
    // Closing a group must not navigate you off the page you are reading.
    render(<SidebarNav role="teacher" />);
    fireEvent.click(groupLink("Teaching")); // open by default → this folds
    expect(panelOf("Teaching")).toHaveAttribute("data-open", "0");
    expect(lastClick.preventedByNav, "folding must not navigate").toBe(true);
  });

  it("follows the link when it is opening", () => {
    render(<SidebarNav role="teacher" />);
    fireEvent.click(groupLink("Teaching")); // fold
    fireEvent.click(groupLink("Teaching")); // open → must navigate
    expect(panelOf("Teaching")).toHaveAttribute("data-open", "1");
    expect(lastClick.preventedByNav, "opening must go to the first child").toBe(false);
  });

  it("lets a modified click through untouched, for a new tab", () => {
    render(<SidebarNav role="teacher" />);
    // ⌘-click is a request for a new tab, not a request to fold anything.
    fireEvent.click(groupLink("Practice"), { metaKey: true });
    expect(lastClick.preventedByNav).toBe(false);
    expect(panelOf("Practice")).toHaveAttribute("data-open", "1");
  });
});

describe("the row says what it is doing", () => {
  it("carries the disclosure state itself — there is no second control", () => {
    render(<SidebarNav role="teacher" />);
    const row = groupRow("Practice");
    // One control. A nested button would be a tab stop doing the same job.
    expect(within(row).queryByRole("button")).toBeNull();

    const link = groupLink("Practice");
    expect(link).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(link);
    expect(groupLink("Practice")).toHaveAttribute("aria-expanded", "false");
  });

  it("points at the list it controls", () => {
    render(<SidebarNav role="teacher" />);
    expect(groupLink("Learning")).toHaveAttribute("aria-controls", "sb-group-learning");
    expect(panelOf("Learning")).not.toBeNull();
  });
});

describe("the group you are standing in", () => {
  it("unfolds itself on arrival", () => {
    // Marking lives inside Learning; landing there must not leave the rail
    // showing nothing lit.
    pathname.current = "/console/marking";
    render(<SidebarNav role="teacher" />);
    expect(panelOf("Learning")).toHaveAttribute("data-open", "1");
  });

  it("can still be folded while you are inside it", () => {
    // A disclosure you cannot close is not a disclosure — the auto-open must
    // fire once on arrival, not hold the group open.
    pathname.current = "/console/marking";
    render(<SidebarNav role="teacher" />);
    fireEvent.click(groupLink("Learning"));
    expect(panelOf("Learning")).toHaveAttribute("data-open", "0");
  });
});

describe("a folded group still shows what is waiting behind it", () => {
  it("carries its children's badge onto its own row", () => {
    render(<SidebarNav role="teacher" counts={{ newWork: 3 }} />);
    const row = groupRow("Learning");
    // Open, the count belongs to Results and not to the group row.
    expect(within(row).queryByText("3")).toBeNull();

    fireEvent.click(groupLink("Learning"));
    expect(within(groupRow("Learning")).getByText("3")).toBeTruthy();
  });
});
