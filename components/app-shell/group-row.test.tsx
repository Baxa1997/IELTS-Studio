// @vitest-environment jsdom
/**
 * The group row, exercised rather than read.
 *
 * The rest of the rail's guards are static scans over the source, because the
 * things that break there are CSS declarations jsdom cannot evaluate. This one
 * is different: opening and closing a group is a real interaction.
 *
 * ⚠️ THE ROW IS A DISCLOSURE AND NOTHING ELSE. It went through a round of also
 * navigating — pressing a shut group took you to the first page inside it — and
 * the owner had that removed after using it. These tests pin the removal as
 * hard as they pin the folding, because "helpfully" re-adding navigation here is
 * an easy and plausible-looking change: a row that both moves you and changes
 * shape puts two outcomes behind one press, and which one you get depends on
 * state you have to read the chevron to know.
 */

import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pathname = { current: "/console" };
/* The mock <Link> records where a click would have taken you, so a test can say
   "this press went nowhere" — which is the whole claim about a group row now.
   It also preventDefaults, so jsdom does not log "Not implemented: navigation"
   for every click on a real nav item. */
const lastClick = vi.hoisted(() => ({ navigatedTo: null as string | null }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));
vi.mock("next/link", () => ({
  // `prefetch` and `unstable_dynamicOnHover` are Next's, not the DOM's — dropped
  // here so React does not warn about unknown attributes on every row.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  default: ({ children, href, onClick, prefetch, unstable_dynamicOnHover, ...rest }: Record<string, unknown>) => {
    const h = href as string;
    return (
      <a
        href={h}
        onClick={(e) => {
          (onClick as React.MouseEventHandler | undefined)?.(e);
          if (!e.defaultPrevented) lastClick.navigatedTo = h;
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
   `getByRole("link", { name: "Practices" })` is ambiguous: the teacher's rail has
   a "Practices" GROUP and a "Practices" item (/console/practice) inside Learning.
   Querying the whole document finds both and throws. */
function groupRow(title: string): HTMLElement {
  const rows = Array.from(document.querySelectorAll<HTMLElement>(".lp-sb-grouprow"));
  const row = rows.find((r) => r.querySelector(".lp-sb-label")?.textContent === title);
  expect(row, `no group row for ${title}`).toBeTruthy();
  return row as HTMLElement;
}

/** The row's control. It IS the row — there is no second element inside it. */
const groupToggle = groupRow;

const panelOf = (title: string) =>
  document.getElementById(`sb-group-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);

beforeEach(() => {
  pathname.current = "/console";
  window.localStorage.clear();
  lastClick.navigatedTo = null;
});
afterEach(cleanup);

describe("the row folds and unfolds, and does nothing else", () => {
  it("is a button, not a link — it has nowhere to send you", () => {
    /* THE REGRESSION THIS PINS. An anchor here would mean the rail's menu
       headings are destinations, which they are not; it would also be a lie to
       the browser and to a screen reader, since there is no href worth
       middle-clicking. */
    render(<SidebarNav role="teacher" />);
    const row = groupRow("Teaching");
    expect(row.tagName).toBe("BUTTON");
    expect(row).not.toHaveAttribute("href");
    expect(within(row).queryByRole("link")).toBeNull();
  });

  it("opens no page when pressed", () => {
    // If a group ever navigates again, the mock <Link> records it.
    render(<SidebarNav role="teacher" />);
    fireEvent.click(groupToggle("Teaching"));
    fireEvent.click(groupToggle("Teaching"));
    expect(lastClick.navigatedTo, "folding a group must not navigate").toBeNull();
  });

  it("toggles on every press", () => {
    render(<SidebarNav role="teacher" />);
    // Groups default to open.
    expect(panelOf("Teaching")).toHaveAttribute("data-open", "1");
    fireEvent.click(groupToggle("Teaching"));
    expect(panelOf("Teaching")).toHaveAttribute("data-open", "0");
    fireEvent.click(groupToggle("Teaching"));
    expect(panelOf("Teaching")).toHaveAttribute("data-open", "1");
  });

  it("leaves the rows inside it as the only destinations", () => {
    // The group is the lid; its children are the doors.
    render(<SidebarNav role="teacher" />);
    const panel = panelOf("Teaching") as HTMLElement;
    const hrefs = Array.from(panel.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([
      "/console/groups",
      "/console/students",
      "/console/calendar",
      "/console/finance/payroll",
    ]);
  });
});

describe("the row says what it is doing", () => {
  it("carries the disclosure state itself — there is no second control", () => {
    render(<SidebarNav role="teacher" />);
    const row = groupToggle("Practices");
    expect(row).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(row);
    expect(groupToggle("Practices")).toHaveAttribute("aria-expanded", "false");
  });

  it("points at the list it controls", () => {
    render(<SidebarNav role="teacher" />);
    expect(groupToggle("Learning")).toHaveAttribute("aria-controls", "sb-group-learning");
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
    fireEvent.click(groupToggle("Learning"));
    expect(panelOf("Learning")).toHaveAttribute("data-open", "0");
  });
});

describe("a folded group still shows what is waiting behind it", () => {
  it("carries its children's badge onto its own row", () => {
    render(<SidebarNav role="teacher" counts={{ newWork: 3 }} />);
    const row = groupRow("Learning");
    // Open, the count belongs to Results and not to the group row.
    expect(within(row).queryByText("3")).toBeNull();

    fireEvent.click(groupToggle("Learning"));
    expect(within(groupRow("Learning")).getByText("3")).toBeTruthy();
  });
});

/**
 * ONE OPEN AT A TIME.
 *
 * The groups were independent switches, so a teacher's rail could have Teaching,
 * Practice and Learning all unfolded at once and stand twenty rows tall — most
 * of them somewhere they were not. The disclosures exist to keep the rail short
 * enough to read without scrolling, which four switches nobody turns back off
 * does not achieve.
 */
describe("the groups behave as an accordion", () => {
  it("folds the others when one is opened", () => {
    render(<SidebarNav role="teacher" />);
    // They all start open; fold Teaching so there is one to re-open.
    fireEvent.click(groupToggle("Teaching"));
    expect(panelOf("teaching")).toHaveAttribute("data-open", "0");

    fireEvent.click(groupToggle("Teaching"));
    expect(panelOf("teaching")).toHaveAttribute("data-open", "1");
    expect(panelOf("practices")).toHaveAttribute("data-open", "0");
    expect(panelOf("learning")).toHaveAttribute("data-open", "0");
  });

  it("closes only the group you pressed", () => {
    /* ⚠️ ONLY OBSERVABLE FROM THE INITIAL STATE, which is why this starts there
       and does not first open something. Once exclusivity holds, at most one
       group is open, so "close just this one" and "close everything" leave the
       identical result and no test can tell them apart. They differ exactly
       once: on the first fold, when the others are still open.

       THE REGRESSION IT PINS: closing is not the mirror of opening. Folding
       every other group as a side effect of closing the one you are in is
       surprising, and it is one `exclusivelyFor(…, null)` away — an earlier
       version of this file shipped that way. */
    render(<SidebarNav role="teacher" />);
    fireEvent.click(groupToggle("Teaching"));

    expect(panelOf("teaching")).toHaveAttribute("data-open", "0");
    expect(panelOf("practices"), "closing Teaching must not fold Practice").toHaveAttribute(
      "data-open",
      "1",
    );
    expect(panelOf("learning"), "closing Teaching must not fold Learning").toHaveAttribute(
      "data-open",
      "1",
    );
  });

  it("folds the others when you navigate into one", () => {
    /* ⚠️ IT HAS TO BE A REAL NAVIGATION, not a first render. The adjustment
       fires on a CHANGE of active group, and on first mount there is no change
       — `lastActiveGroup` is seeded with the current one. A test that simply
       rendered at /console/marking would pass whatever the code did, because
       every group defaults to open anyway. */
    pathname.current = "/console";
    const view = render(<SidebarNav role="teacher" />);
    expect(panelOf("teaching")).toHaveAttribute("data-open", "1");

    pathname.current = "/console/marking"; // Marking lives inside Learning
    view.rerender(<SidebarNav role="teacher" />);
    expect(panelOf("learning")).toHaveAttribute("data-open", "1");
    expect(panelOf("teaching")).toHaveAttribute("data-open", "0");
    expect(panelOf("practices")).toHaveAttribute("data-open", "0");
  });
});

/**
 * THE CLICK ANSWERS BEFORE THE SERVER DOES.
 *
 * The highlight used to follow the URL, and the URL changes only once the next
 * page has arrived — so for the whole server round trip the rail still lit the
 * page you were leaving, and a press looked ignored.
 */
describe("the row you press", () => {
  const link = (href: string) => document.querySelector<HTMLElement>(`a[href="${href}"]`) as HTMLElement;
  const lit = () =>
    Array.from(document.querySelectorAll<HTMLElement>(".lp-sb-link--active")).map((a) =>
      a.getAttribute("href"),
    );

  it("lights at once, while the old page is still on screen", () => {
    render(<SidebarNav role="teacher" />);
    fireEvent.click(link("/console/students"));
    expect(lit()).toEqual(["/console/students"]);
  });

  it("does not claim to be the page until it is", () => {
    // The look is optimistic; what a screen reader is told is not.
    render(<SidebarNav role="teacher" />);
    fireEvent.click(link("/console/students"));
    expect(link("/console/students")).not.toHaveAttribute("aria-current");
  });

  it("stays lit when the page arrives", () => {
    const view = render(<SidebarNav role="teacher" />);
    fireEvent.click(link("/console/students"));
    pathname.current = "/console/students";
    view.rerender(<SidebarNav role="teacher" />);
    expect(lit()).toEqual(["/console/students"]);
    expect(link("/console/students")).toHaveAttribute("aria-current", "page");
  });

  it("does not light for a click that opens a new tab", () => {
    // Cmd/Ctrl-click leaves this tab where it is, so its rail must not move.
    render(<SidebarNav role="teacher" />);
    fireEvent.click(link("/console/students"), { metaKey: true });
    expect(lit()).not.toContain("/console/students");
  });
});
