import Link from "next/link";

import { loadCenters } from "@/lib/admin/platform";
import { loadConductFlags } from "@/lib/admin/moderation";

import { HeaderCrumb } from "./header-crumb";
import { CREAM, FAINT, MUTED, SANS, TONE } from "./ui";

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
  const alerts = pending + conduct.length;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(244,243,239,.9)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid #E4E2DC",
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
            background: "#fff",
            border: "1px solid #E0DED8",
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
              color: "#16162E",
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
            background: "#fff",
            border: "1px solid #E0DED8",
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

        <Link
          href="/admin"
          title={
            alerts > 0
              ? `${pending} application${pending === 1 ? "" : "s"} and ${conduct.length} flagged mock${conduct.length === 1 ? "" : "s"}`
              : "Nothing waiting"
          }
          style={{
            position: "relative",
            width: 34,
            height: 34,
            background: "#fff",
            border: "1px solid #E0DED8",
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            color: "#4C4A63",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 01-3.4 0" />
          </svg>
          {alerts > 0 ? (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: TONE.red.ink,
                color: "#fff",
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 20,
                padding: "1px 5px",
              }}
            >
              {alerts}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}

/** Kept so the cream constant has one owner even as the header evolves. */
export const HEADER_BG = CREAM;
export const HEADER_FAINT = FAINT;
