"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  CreditCard,
  LogOut,
  type LucideIcon,
  Megaphone,
  Send,
  Menu,
  Settings,
} from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import {
  CentreMark,
  CentreWordmark,
  EngProgressLogo,
  EngProgressMark,
} from "@/components/brand/engprogress-logo";

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
 * Routes that own their whole surface, where the rail starts collapsed.
 *
 * Practice AI drops the console's bar and padding and lays out its own hero
 * edge to edge; an expanded rail eats 240px of a page built around a centred
 * headline and a three-card grid. The lesson runner is the same argument twice
 * over: it is a test, it puts a navigator down its own right-hand side, and a
 * second rail beside that one is just noise while someone is answering.
 *
 * Collapsed, NOT removed. A learner has to be able to get back to their
 * assignments without hunting, and a teacher previewing has to be able to leave
 * — the rail is the way out of both. Collapsing is a DEFAULT, not a lock: the
 * toggle still works and the choice made here is remembered like any other.
 */
function ownsTheSurface(pathname: string): boolean {
  return pathname.startsWith("/console/practice-ai") || pathname.startsWith("/learn/");
}

/**
 * Pages that are exactly one screen tall, with their own scrolling region
 * inside.
 *
 * ⚠️ WHY THE SHELL HAS TO KNOW. The assistant is a fixed frame — header,
 * launcher, transcript, composer — where only the transcript scrolls. It asked
 * for that with `height: calc(100dvh - 22px)`, arithmetic that reverse-engineers
 * the surface's own insets from the viewport, and it was wrong the moment
 * anything else shared the surface: the quota bar renders above it, so the page
 * came out taller than the space it had and the WHOLE surface scrolled. The
 * composer went under the fold and the header slid off the top.
 *
 * A height cannot be guessed at from the viewport; it has to come down the
 * chain from a parent that knows its own size. `--fills` makes the surface a
 * flex column so the content wrapper is handed exactly what is left over,
 * whatever sits above it, and `height: 100%` then resolves the rest of the way
 * down (globals.css).
 */
function fillsTheSurface(pathname: string): boolean {
  return pathname.startsWith("/console/assistant");
}

/**
 * The authenticated app shell (Option A brand). The sidebar is the only chrome: it
 * owns the brand (top), navigation (middle), and the signed-in user as a profile
 * menu pinned to the bottom — clicking it reveals the account menu: Announcements,
 * Billing & plan and Settings (by role), then Sign out. There
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
  variant = "learner",
  navCounts,
  homeworkOnly = false,
  showAssignments = false,
  pendingAssignments = 0,
  home,
  name,
  roleLabel,
  centreName,
  email,
  contentClassName,
  sidebarFooter,
  quotaBar,
  bell,
  unread = 0,
  initialCollapsed = false,
  children,
}: {
  role: string;
  /** "console" swaps the learner chrome for the center CRM brand: flat navy
   *  rail, cream full-bleed canvas instead of the floating white card. */
  variant?: "learner" | "console";
  /** Counts shown beside the console's nav items (teachers/groups/students). */
  navCounts?: Record<string, number>;
  /** Center student: the Practice section is dropped from their menu. */
  homeworkOnly?: boolean;
  /** Student is in a center group, so the Assignments nav item is relevant. */
  showAssignments?: boolean;
  /** Unfinished homework — shown as a count badge on that nav item. */
  pendingAssignments?: number;
  home: string;
  name: string;
  roleLabel: string;
  /** An approved centre's own name — it replaces our wordmark in the rail.
   *  Null for solo learners and for a centre still awaiting approval. */
  centreName?: string | null;
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
  /** Notification bell, rendered in the rail footer and in the mobile top bar.
   *  Server-loaded by the layout so the badge is right on first paint. */
  bell?: React.ReactNode;
  /** Unread notifications. The rail shows this on the avatar; the bell above is
   *  the mobile top bar's copy and keeps its own badge. */
  unread?: number;
  /** Desktop rail starts collapsed — read from a cookie by the layout so the choice
   *  survives navigation across route groups (which remounts this component). */
  initialCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // mobile drawer
  // Seed from the live cookie (not just the prop) so a menu click that remounts the
  // shell can't re-expand a collapsed rail off a stale cached prop.
  const [collapsed, setCollapsed] = useState(
    () => ownsTheSurface(pathname) || readCollapsed(initialCollapsed),
  ); // desktop icon-rail
  const close = () => setOpen(false);

  // Entering a full-surface route collapses the rail; leaving one gives back
  // whatever the reader had chosen. Adjusted DURING RENDER rather than in an
  // effect — the same pattern the console's panels use — so the rail is never
  // painted expanded for a frame and then yanked in.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    const leaving = ownsTheSurface(lastPath);
    const entering = ownsTheSurface(pathname);
    setLastPath(pathname);
    if (entering && !leaving) setCollapsed(true);
    else if (leaving && !entering) setCollapsed(readCollapsed(initialCollapsed));
  }

  // Persist the collapse choice in a cookie so it holds across navigation — the
  // (app)↔(shell) layout boundary remounts the shell, which would otherwise reset it.
  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      document.cookie = `sb_collapsed=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });

  const isConsole = variant === "console";
  const asideClass = [
    "lp-shell-sidebar",
    open ? "lp-shell-sidebar--open" : "",
    collapsed ? "lp-shell-sidebar--collapsed" : "",
    isConsole ? "lp-shell-sidebar--console" : "",
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
          <Logo centre={centreName} />
        </Link>
        {bell ? <div style={{ marginLeft: "auto" }}>{bell}</div> : null}
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
                display: "flex",
                /* ⚠️ A CENTRE NAME AND A ROLE CHIP DO NOT FIT ON ONE LINE.
                   The rail is 272px; take its padding, the collapse toggle and
                   the chip out and about 99px is left for the name — nine
                   characters, which truncates every real centre to nonsense
                   ("Laqod Mar…"). Stacked, the name gets the row: "Laqod
                   Market LLC" fits whole and only a genuinely long one is cut.
                   Our own wordmark is a fixed width beside a short role, so it
                   keeps the single line of the reference design. */
                flexDirection: centreName ? "column" : "row",
                alignItems: centreName ? "flex-start" : "center",
                gap: centreName ? 5 : 9,
                minWidth: 0,
              }}
            >
              <Logo tone="dark" centre={centreName} />
              {/* Role chip: beside our wordmark, beneath a centre's name.
                  lp-sb-trail makes it collapse away with the rest of the rail
                  text; lp-sb-rolechip additionally takes it out of flow when
                  stacked, where a zeroed max-width still leaves a row of
                  height under the logomark. */}
              <span
                className="lp-sb-trail lp-sb-rolechip"
                style={{
                  flex: "none",
                  maxWidth: "100%",
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
                // Half on the rail, half on the page — which is the whole
                // reason it needs a z-index. It sat with none, so it took the
                // rail's stacking position and lost to anything on the content
                // side that had one: the console's sticky top bar is z-20, the
                // page cards paint over it, and the button ended up buried under
                // the page it is supposed to sit on top of. 40 puts it above the
                // rail's own mobile scrim (30) and every content layer (≤21).
                position: "absolute",
                right: "-15px",
                zIndex: 40,
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
            <SidebarNav
              role={role}
              showAssignments={showAssignments}
              pendingAssignments={pendingAssignments}
              counts={navCounts}
              homeworkOnly={homeworkOnly}
            />
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
            {/* The bell used to sit here, above the profile button. It is gone
                from the rail — but this was the ONLY way to reach notifications
                on desktop (the top bar carrying the other one is hidden above
                768px), so removing it outright would have quietly deleted the
                feature. It moved into the account menu, and the unread count
                rides on the avatar so it is still visible without opening
                anything. */}
            <ProfileMenu
              name={name}
              roleLabel={roleLabel}
              email={email}
              items={accountItemsFor(role)}
              unread={unread}
            />
          </div>
        </aside>

        {/* main is a fixed 10px gutter; the content lives on a floating rounded card
            that scrolls internally, so it reads as a separated surface on the canvas. */}
        <main
          className="lp-shell-main"
          style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: 10 }}
        >
          <div
            className={`lp-shell-surface${fillsTheSurface(pathname) ? "lp-shell-surface--fills" : ""}`}
            style={{
              height: "100%",
              overflow: "auto",
              // The console's ground is the CRM design's cream, not the learner
              // app's white card. Set here rather than in CSS so it doesn't
              // depend on `:has()` reaching a descendant.
              background: isConsole ? "#F4F3EF" : "#fff",
              borderRadius: 18,
              border: `1px solid ${isConsole ? "#C5C4BE" : "#E9E7F2"}`,
              boxShadow: "0 1px 2px rgba(20,20,48,.04), 0 18px 40px -28px rgba(20,20,48,.18)",
            }}
          >
            {quotaBar}
            {/* No padding for anything that lays itself out: the console's own
                layout owns a sticky top bar, and the lesson runner is a bar, a
                column and a navigator that all have to reach the surface edges.
                Decided here rather than passed down because only this component
                knows the route — the layout above it is a server component and
                cannot read the pathname. */}
            <div
              className={`lp-shell-content ${
                contentClassName ??
                (isConsole || ownsTheSurface(pathname) ? "" : "w-full px-4 py-5 sm:px-6 sm:py-6")
              }`}
            >
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export interface AccountItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * What moves out of the rail and under the avatar.
 *
 * WHY THESE THREE. The rail answers "what has to happen today"; these three
 * are things you go and do occasionally and then leave alone — the centre's
 * own settings, its plan, and writing to everybody. Keeping them as permanent
 * sections meant two of the rail's six headings were for pages an owner opens
 * about once a month, which pushed the daily work further down every screen.
 *
 * ROLE STILL DECIDES. This is the same split the rail enforced: the front desk
 * runs people and money-in and never sees billing or settings, and a teacher
 * announces only to their own groups. A menu is a hint, not a gate — the pages
 * redirect and RLS refuses independently — but it should not offer somebody a
 * door that will shut in their face.
 */
export function accountItemsFor(role: string): AccountItem[] {
  const announcements = {
    label: "Announcements",
    href: "/console/announcements",
    icon: Megaphone,
  };
  // Under the avatar for the same reason as the others here: something you set
  // up once and then leave alone. It is not in the rail because a permanent
  // heading for it would cost one of the six the rail has, and it is not buried
  // in a group any more because "why did nothing get announced?" is a question
  // about the whole centre rather than about one class.
  const telegram = { label: "Telegram channels", href: "/console/telegram", icon: Send };
  switch (role) {
    case "center_admin":
      return [
        announcements,
        telegram,
        { label: "Billing & plan", href: "/console/billing", icon: CreditCard },
        { label: "Settings", href: "/console/settings", icon: Settings },
      ];
    case "administrator":
    case "teacher":
      // A teacher sees it too: they own groups, and they are the ones who
      // notice the announcement did not arrive.
      return [announcements, telegram];
    default:
      // Students and the platform owner have none of these.
      return [];
  }
}

/**
 * The signed-in user, pinned to the bottom of the sidebar. Click to reveal a small
 * account menu (opening upward): the occasional pages first, Sign out last and
 * separated, because it is the one item you can press by accident and regret.
 * A transparent full-screen backdrop closes it on any outside click. When the
 * rail is collapsed only the avatar shows.
 */
function ProfileMenu({
  name,
  roleLabel,
  email,
  items = [],
  unread = 0,
}: {
  name: string;
  roleLabel: string;
  email?: string;
  items?: AccountItem[];
  /** Unread notifications, shown on the avatar and beside the menu item. */
  unread?: number;
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

          <Link
            href="/notifications"
            role="menuitem"
            className="lp-menu-item"
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              height: 40,
              padding: "0 10px",
              borderRadius: 9,
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 600,
              color: "#E7E9F5",
              textDecoration: "none",
            }}
          >
            <Bell size={17} strokeWidth={2} />
            Notifications
            {unread > 0 ? (
              <span
                style={{
                  marginLeft: "auto",
                  minWidth: 20,
                  padding: "0 6px",
                  height: 20,
                  borderRadius: 10,
                  background: "#F0857A",
                  color: "#241016",
                  fontSize: 11.5,
                  fontWeight: 800,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Link>

          {items.length > 0 ? (
            <>
              {items.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  className="lp-menu-item"
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    height: 40,
                    padding: "0 10px",
                    borderRadius: 9,
                    fontFamily: SANS,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#E7E9F5",
                    textDecoration: "none",
                  }}
                >
                  <Icon size={17} strokeWidth={2} />
                  {label}
                </Link>
              ))}
              {/* Sign out is fenced off. It is the only irreversible thing in
                  here and it sits where a mis-aimed click lands. */}
              <div style={{ height: 1, background: RAIL_LINE, margin: "6px 4px" }} />
            </>
          ) : null}

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
        {/* The avatar carries the unread count, because the bell it replaced was
            visible at a glance and a menu item is not. It survives the rail
            being collapsed to icons, which is when the old bell disappeared
            anyway. */}
        <span style={{ position: "relative", flex: "none", display: "inline-flex" }}>
          <Avatar name={name} size={36} />
          {unread > 0 ? (
            <span
              aria-label={`${unread} unread`}
              style={{
                position: "absolute",
                top: -2,
                right: -3,
                minWidth: 17,
                height: 17,
                padding: "0 4px",
                borderRadius: 9,
                background: "#F0857A",
                color: "#241016",
                fontSize: 10.5,
                fontWeight: 800,
                display: "grid",
                placeItems: "center",
                // Rings the rail's own navy so the badge reads as sitting ON
                // the avatar rather than floating behind it.
                boxShadow: "0 0 0 2px #1A1E3C",
              }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </span>
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

function Logo({ tone = "light", centre }: { tone?: "light" | "dark"; centre?: string | null }) {
  // tone: "light" for the white mobile topbar, "dark" for the dark sidebar rail.
  // Expanded shows the full wordmark; the collapsed rail swaps to the square
  // logomark (CSS in globals).
  //
  // `centre` is the ONE decision about whose brand this is, made here so it is
  // made once: an approved centre wears its own name, and everyone else — solo
  // learners, and the platform console — wears ours. A teacher opening this
  // every morning works for their school, and the rail should say so.
  //
  // The swap classes go on plain wrapper spans, not the brand components
  // themselves — the brand components set their own inline `display`, which
  // (being inline style) always wins over the external .lp-sb-logo-full/-mark
  // rules trying to show/hide them, so both rendered at once either way.
  return (
    <span style={{ display: "inline-flex", alignItems: "center", minWidth: 0 }}>
      <span className="lp-sb-logo-full" style={{ minWidth: 0 }}>
        {centre ? (
          <CentreWordmark name={centre} tone={tone} fontSize={19} />
        ) : (
          <EngProgressLogo tone={tone} fontSize={19} showTagline={false} />
        )}
      </span>
      <span className="lp-sb-logo-mark">
        {centre ? <CentreMark name={centre} size={36} /> : <EngProgressMark size={36} />}
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
