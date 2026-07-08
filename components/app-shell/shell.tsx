"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronsLeft, ChevronsRight, ChevronUp, LogOut, Menu } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { EngProgressLogo, EngProgressMark } from "@/components/brand/engprogress-logo";

import { SidebarNav } from "./sidebar-nav";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INK = "#1A2138";
const BORDER = "#3333";
/** Light app canvas behind the floating content card. */
const CANVAS = "#F1F1F6";
/** The rail: the brand indigo (#3B43B5) taken down to the same calm darkness as
 *  the green reference — a whisper of a gradient so it doesn't read as a flat slab. */
const RAIL_BG = "linear-gradient(180deg, #1E2242 0%, #181B36 52%, #12142A 100%)";
const RAIL_LINE = "rgba(255,255,255,.07)"; // hairlines/borders on the rail
const RAIL_TEXT = "#CDD1DF"; // on-rail text
const RAIL_FAINT = "#9096B0"; // secondary on-rail text (email, chevrons)
const ACCENT = "#5BDD9B"; // soft mint accent (role chip, highlights)

/** Read the collapse choice from the live cookie on the client. The (app)↔(shell)
 *  layout boundary remounts this component, and Next's Router Cache can hand back a
 *  STALE `initialCollapsed` prop (captured when the rail was last expanded) — so a
 *  menu click would re-expand a collapsed rail. Reading the cookie at mount makes the
 *  current choice authoritative regardless of the cached prop. Falls back to the
 *  server-provided prop during SSR (no `document`). */
function readCollapsed(fallback: boolean): boolean {
  if (typeof document === "undefined") return fallback;
  const m = document.cookie.match(/(?:^|;\s*)sb_collapsed=([01])/);
  return m ? m[1] === "1" : fallback;
}

/**
 * The authenticated app shell (Option A brand). The sidebar is the only chrome: it
 * owns the brand (top), navigation (middle), and the signed-in user as a profile
 * menu pinned to the bottom — clicking it reveals account options (Sign out). There
 * is no desktop top header, so <main> runs the full height of the viewport; on
 * mobile a slim bar carries the hamburger + brand and the sidebar slides in as a
 * drawer. The frame itself doesn't scroll; only <main> does.
 *
 * On desktop the rail collapses to an icon-only strip (a CSS-only transform driven by
 * the `--collapsed` class). An optional `sidebarFooter` (e.g. the "Your target" card)
 * sits just above the profile menu and is hidden while collapsed.
 */
export function AppShell({
  role,
  home,
  name,
  roleLabel,
  email,
  contentClassName,
  sidebarFooter,
  quotaBar,
  initialCollapsed = false,
  children,
}: {
  role: string;
  home: string;
  name: string;
  roleLabel: string;
  /** Shown under the name in the profile card (falls back to the role label). */
  email?: string;
  /** Override the default content wrapper. Pass "" for a full-bleed surface
   *  (e.g. the writing library owns its own layout). */
  contentClassName?: string;
  /** Optional node pinned to the bottom of the sidebar rail (above the profile menu). */
  sidebarFooter?: React.ReactNode;
  /** Optional low-quota warning strip at the top of the content surface (the
   *  node itself decides whether to render — see quota-bar.tsx). */
  quotaBar?: React.ReactNode;
  /** Desktop rail starts collapsed — read from a cookie by the layout so the choice
   *  survives navigation across route groups (which remounts this component). */
  initialCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false); // mobile drawer
  // Seed from the live cookie (not just the prop) so a menu click that remounts the
  // shell can't re-expand a collapsed rail off a stale cached prop.
  const [collapsed, setCollapsed] = useState(() => readCollapsed(initialCollapsed)); // desktop icon-rail
  const close = () => setOpen(false);

  // Persist the collapse choice in a cookie so it holds across navigation — the
  // (app)↔(shell) layout boundary remounts the shell, which would otherwise reset it.
  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      document.cookie = `sb_collapsed=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });

  const asideClass = [
    "lp-shell-sidebar",
    open ? "lp-shell-sidebar--open" : "",
    collapsed ? "lp-shell-sidebar--collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
        background: CANVAS,
        fontFamily: SANS,
        color: INK,
      }}
    >
      {/* ===== mobile-only top bar (hamburger + brand) ===== */}
      <header
        className="lp-shell-topbar"
        style={{
          height: 56,
          flex: "none",
          alignItems: "center",
          gap: 10,
          padding: "0 14px",
          background: "#fff",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          style={{
            background: "none",
            border: "none",
            color: "#6E7388",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Menu size={22} />
        </button>
        <Link href={home} style={{ textDecoration: "none" }}>
          <Logo />
        </Link>
      </header>

      {/* ===== body: sidebar + main ===== */}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {open ? (
          <button
            aria-label="Close menu"
            onClick={close}
            className="md:hidden"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 30,
              background: "rgba(0,0,0,.4)",
              border: "none",
            }}
          />
        ) : null}

        <aside
          className={asideClass}
          style={{
            flex: "none",
            background: RAIL_BG,
            display: "flex",
            flexDirection: "column",
            padding: "18px 16px",
            // NOTE: positioning is owned by CSS (.lp-shell-sidebar), not inline —
            // an inline `position` would beat the class and stop the mobile drawer
            // from going `position: fixed` (it'd stay in-flow and crush <main>).
            // The desktop media query restores `position: relative` for the toggle.
          }}
        >
          {/* brand row — logo on the left, the collapse toggle opposite it (desktop).
              Margin/padding/divider live in .lp-sb-brandrow (globals.css): the row
              stretches edge-to-edge past the rail padding for a full-bleed hairline,
              and the collapsed media query re-tunes the offsets. */}
          <div
            className="lp-sb-brandrow"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <Link
              href={home}
              onClick={close}
              className="lp-sb-logo"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                minWidth: 0,
              }}
            >
              <Logo tone="dark" />
              {/* Role chip beside the logo (reference design); lp-sb-trail makes it
                  collapse away with the rest of the rail text. */}
              <span
                className="lp-sb-trail"
                style={{
                  flex: "none",
                  fontFamily: SANS,
                  fontSize: 12,
                  fontWeight: 600,
                  color: ACCENT,
                  background: "rgba(91,221,155,.08)",
                  border: "1px solid rgba(91,221,155,.30)",
                  padding: "2.5px 10px",
                  borderRadius: 8,
                }}
              >
                {roleLabel}
              </span>
            </Link>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="lp-sb-collapse lp-sb-item"
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                flex: "none",
                border: `1px solid rgba(255,255,255,.12)`,
                background: "#23274A",
                borderRadius: 8,
                cursor: "pointer",
                color: RAIL_FAINT,
                position: "absolute",
                right: "-15px",
              }}
            >
              {collapsed ? (
                <ChevronsRight size={16} color={RAIL_TEXT} />
              ) : (
                <ChevronsLeft size={16} color={RAIL_TEXT} />
              )}
            </button>
          </div>

          {/* nav — scrolls if it ever overflows; brand + footer stay pinned. When
              collapsed the overflow goes visible so hover tooltips can escape the rail. */}
          <div
            onClick={close}
            className="lp-sb-scroll"
            style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", paddingTop: 12 }}
          >
            <SidebarNav role={role} />
          </div>

          {/* footer: optional target card (hidden when collapsed), then profile menu.
              Separated from the nav by a full-bleed hairline (.lp-sb-footer). */}
          <div
            className="lp-sb-footer"
            style={{
              flex: "none",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {sidebarFooter}
            <ProfileMenu name={name} roleLabel={roleLabel} email={email} />
          </div>
        </aside>

        {/* main is a fixed 10px gutter; the content lives on a floating rounded card
            that scrolls internally, so it reads as a separated surface on the canvas. */}
        <main
          className="lp-shell-main"
          style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: 10 }}
        >
          <div
            className="lp-shell-surface"
            style={{
              height: "100%",
              overflow: "auto",
              background: "#fff",
              borderRadius: 18,
              border: "1px solid #E9E7F2",
              boxShadow: "0 1px 2px rgba(20,20,48,.04), 0 18px 40px -28px rgba(20,20,48,.18)",
            }}
          >
            {quotaBar}
            <div className={contentClassName ?? "w-full px-4 py-5 sm:px-6 sm:py-6"}>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * The signed-in user, pinned to the bottom of the sidebar. Click to reveal a small
 * account menu (opening upward) with Sign out. A transparent full-screen backdrop
 * closes it on any outside click. When the rail is collapsed only the avatar shows.
 */
function ProfileMenu({
  name,
  roleLabel,
  email,
}: {
  name: string;
  roleLabel: string;
  email?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      {open ? (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 20,
            background: "transparent",
            border: "none",
            cursor: "default",
          }}
        />
      ) : null}

      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            right: "auto",
            minWidth: 210,
            zIndex: 21,
            background: "#212545",
            border: `1px solid rgba(255,255,255,.10)`,
            borderRadius: 14,
            boxShadow: "0 22px 48px -18px rgba(6,8,22,.75)",
            padding: 7,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px 10px" }}>
            <Avatar name={name} size={36} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: "#F2F3FA",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: RAIL_FAINT,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {email ?? roleLabel}
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: RAIL_LINE, margin: "2px 4px 6px" }} />
          <form action={signOut}>
            {/* No inline background — the .lp-menu-item:hover wash (globals.css)
                can't beat an inline value. */}
            <button
              type="submit"
              role="menuitem"
              className="lp-menu-item"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 40,
                padding: "0 10px",
                border: "none",
                borderRadius: 9,
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 600,
                color: "#F0857A",
                cursor: "pointer",
              }}
            >
              <LogOut size={17} strokeWidth={2} />
              Sign out
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={name}
        className="lp-sb-profile-btn lp-sb-item"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "9px 10px",
          border: `1px solid ${open ? "rgba(255,255,255,.16)" : RAIL_LINE}`,
          // Resting background lives in .lp-sb-profile-btn (globals.css) so the
          // hover wash works; inline only when open (inline beats the class).
          background: open ? "rgba(255,255,255,.10)" : undefined,
          borderRadius: 13,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Avatar name={name} size={36} />
        <div className="lp-sb-profile-text" style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "#F2F3FA",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </span>
            <span
              style={{
                flex: "none",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".04em",
                color: "#C3C8E9",
                background: "rgba(255,255,255,.09)",
                border: `1px solid ${RAIL_LINE}`,
                padding: "1.5px 7px",
                borderRadius: 6,
              }}
            >
              {roleLabel}
            </span>
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: RAIL_FAINT,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: 1,
            }}
          >
            {email ?? roleLabel}
          </div>
        </div>
        <ChevronUp
          className="lp-sb-profile-chev"
          size={16}
          color={RAIL_FAINT}
          style={{
            flex: "none",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .15s ease",
          }}
        />
      </button>
    </div>
  );
}

function Avatar({ name, size }: { name: string; size: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#4ECF95,#2E9D6C)",
        color: "#fff",
        fontSize: Math.round(size * 0.36),
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
      }}
    >
      {initials(name)}
    </span>
  );
}

function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  // tone: "light" for the white mobile topbar, "dark" for the dark sidebar rail.
  // Expanded shows the full wordmark; the collapsed rail swaps to the boxed-"P"
  // logomark (CSS in globals).
  // The swap classes go on plain wrapper spans, not the brand components
  // themselves — EngProgressLogo/EngProgressMark set their own inline `display`, which
  // (being inline style) always wins over the external .lp-sb-logo-full/-mark
  // rules trying to show/hide them, so both rendered at once either way.
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <span className="lp-sb-logo-full">
        <EngProgressLogo tone={tone} fontSize={19} showTagline={false} />
      </span>
      <span className="lp-sb-logo-mark">
        <EngProgressMark size={36} />
      </span>
    </span>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
