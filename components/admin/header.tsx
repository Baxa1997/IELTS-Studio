import { loadCenters } from "@/lib/admin/platform";
import { loadConductFlags } from "@/lib/admin/moderation";

import { AlertsBell, type AlertRow } from "./alerts-bell";
import { HeaderCrumb } from "./header-crumb";
import { CREAM, FAINT, MUTED, SANS, TONE } from "./ui";
import { CHIP_LINE, HEAD_BG, HEAD_LINE, INK, PANEL } from "@/lib/theme/tokens";

/**
 * The bar that runs across the top of every admin screen.
 *
 * Part of the design's MAIN column, not its sidebar — which is why it is here
 * even though the owner's decision was to keep the app's own rail. It carries
 * where you are, a way to find a person, and what is waiting.
 *
 * WHAT IT DELIBERATELY OMITS. The design also draws a "Create" menu offering
 * "Add an education center", "Invite a user" and "Broadcast announcement".
 * None of those flows exist — centres arrive by applying, invites are issued
 * inside a centre, and there is no broadcast — so the menu would be four
 * buttons that do nothing. The search is real: it goes to the users list, which
 * is what it says it does.
 */
export async function AdminHeader() {
  // Both are cheap and already cached per request by the pages below; a header
  // that lied about the count would be worse than no badge.
  const [centers, conduct] = await Promise.all([loadCenters(), loadConductFlags(50)]);
  const pending = centers.filter((c) => c.status === "pending").length;
  // Approved, and has still graded nothing — the churn signal the centre page
  // leads with, surfaced here so it is noticed without going looking.
  const stalled = centers.filter((c) => c.status === "active" && c.practice30d === 0).length;
  const alerts = pending + stalled + conduct.length;

  const rows: AlertRow[] = [];
  if (pending > 0) {
    rows.push({
      title: `${pending} center application${pending === 1 ? "" : "s"} waiting`,
      detail: "Nobody can teach until these are approved",
      href: "/admin/centers?tab=pending",
      tone: "indigo",
      icon: "building",
    });
  }
  if (stalled > 0) {
    rows.push({
      title: `${stalled} center${stalled === 1 ? "" : "s"} at zero practice`,
      detail: "Approved, staffed, and nothing graded yet",
      href: "/admin/centers?sort=idle",
      tone: "amber",
      icon: "warn",
    });
  }
  if (conduct.length > 0) {
    rows.push({
      title: `${conduct.length} speaking mock${conduct.length === 1 ? "" : "s"} flagged`,
      detail: "Examiner abuse or refusal, reported only",
      href: "/admin/moderation",
      tone: "red",
      icon: "shield",
    });
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        /* 20, NOT 40 — AND THE 40 IS WHY THE RAIL'S COLLAPSE TOGGLE VANISHED HERE.
           That toggle straddles the rail edge at z-index 40, on the stated
           assumption (see components/app-shell/shell.tsx) that every content
           layer sits at 21 or below; the centre console's own sticky bar is 20.
           This header claimed 40 as well, and an equal z-index is decided by DOM
           order — the header is inside <main>, which comes after the rail — so
           it won the tie and its near-opaque cream painted straight over the
           half of the button that hangs onto the page. Only the rail-side half
           stayed visible, which reads as a button that is broken rather than one
           that is covered. `backdrop-filter` made it certain by creating a
           stacking context of its own. */
        zIndex: 20,
        /* ⚠️ A TOKEN, NOT AN rgba() LITERAL. This was rgba(244,243,239,.9) —
           near-white — so in dark mode the console's top bar stayed pale
           across a near-black page. It is the first thing on the screen, so it
           made every /admin page look broken. The token keeps the alpha,
           because content scrolls under this bar and the translucency is the
           design. */
        background: HEAD_BG,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: `1px solid ${HEAD_LINE}`,
        padding: "12px 28px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontFamily: SANS,
      }}
    >
      <HeaderCrumb />

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9 }}>
        <form
          method="get"
          action="/admin/users"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: PANEL,
            border: `1px solid ${CHIP_LINE}`,
            borderRadius: 8,
            padding: "6px 11px",
            minWidth: 220,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={MUTED}
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            name="q"
            placeholder="Find a user…"
            aria-label="Find a user"
            style={{
              border: 0,
              outline: "none",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: 12.5,
              color: INK,
              width: "100%",
              minWidth: 0,
            }}
          />
        </form>

        <span
          title="Every figure on these screens covers the last 30 days"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: PANEL,
            border: `1px solid ${CHIP_LINE}`,
            borderRadius: 8,
            padding: "7px 11px",
            fontSize: 12.5,
            color: MUTED,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{ width: 7, height: 7, borderRadius: "50%", background: TONE.green.ink }}
          />
          Last 30 days
        </span>

        <AlertsBell count={alerts} alerts={rows} />
      </div>
    </header>
  );
}

/** Kept so the cream constant has one owner even as the header evolves. */
export const HEADER_BG = CREAM;
export const HEADER_FAINT = FAINT;
