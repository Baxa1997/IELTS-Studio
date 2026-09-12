"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
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
/* Only WHITE survives here. BRAND and LINE dressed the collapse toggle back when
   it straddled the rail's edge and had to be legible against both the dark rail
   and the light page; the toggle now sits inside the brand row on a white rail,
   so it takes the rail's own greys instead. */
import { WHITE } from "@/lib/theme/tokens";

import { SidebarNav } from "./sidebar-nav";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INK = "#16232b";
const BORDER = "#e6e4dc";
/** The ground both cards float on. Warmer than the old #F6F7F9 — the design's
 *  own paper, and the thing that makes two white cards read as cards rather
 *  than as one continuous surface with a line drawn down it. */
const CANVAS = "#f1efe9";
/* ── the rail is WARM PAPER, and it is light all the way down ─────────────────
   Two rebuilds ago this was a solid burgundy panel; one rebuild ago it was a
   white card with a dark profile block at its foot. It is now the Base44
   reference the owner supplied: one warm off-white surface, near-black ink,
   warm-grey fills for hover and for "you are here", and NO dark region at all.

   THE DARK PROFILE CARD IS GONE, and that is the change most likely to be
   reverted by accident. It existed to anchor the foot of a white rail, and the
   reference anchors it with a hairline instead. Every value that dressed it —
   the #0f1a21 strip, the #8ea3af secondary text, the #e6e9ea menu ink, the
   coral badge — was a light-on-dark value and none of them survive: dropped on
   the new paper they are, in order, a black hole, illegible, invisible and
   alarming. If the dark block ever comes back, it needs its own palette again;
   do not reach for the names below. */
const RAIL_BG = "#f8f7f4";
/** The rail's own edge and its internal hairlines — one warm grey, matched to
 *  the paper rather than to the cool ramp the content cards use. Two different
 *  greys a few pixels apart read as a mistake. */
const RAIL_BORDER = "#e7e4dc";
const RAIL_SHADOW = "0 4px 14px -10px rgba(28,25,15,.18)";
/** Rail ink. `RAIL_INK` is a label you read; `RAIL_FAINT` is the line under a
 *  name that you don't. Both are DARK-on-light now. */
const RAIL_INK = "#16150f";
const RAIL_FAINT = "#8b8883";
/** The role line under the centre/product name. Plain green text, not a pill:
 *  a filled chip beside the name competes with the nav's own active pill for
 *  "this is the highlighted thing". */
const ACCENT = "#0b6b40";
/** The collapse toggle's chevron — the rail's own ink, because the rail has no
 *  accent colour any more and a lone indigo chevron would be the only hue on
 *  the surface. */
const TOGGLE_INK = "#4a463d";
/** The logomark's tile. The brand square has always been tan (#D89A5C); the
 *  design draws it near-black, and on a white rail the tan read as a stray warm
 *  patch against an otherwise cool palette. Passed as a prop so the tan stays
 *  the default everywhere else the mark is used. */
const MARK_BG = "#16232b";

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
  /**
   * WHICH SURFACE THIS PAGE STANDS ON — A QUESTION ABOUT THE ROUTE, NOT THE USER.
   *
   * This used to be `isConsole`, i.e. the `variant` prop, i.e.
   * `canManagePeople(role)` — which is `center_admin || administrator` and
   * pointedly NOT `teacher`. So a teacher on /console got the learner frame:
   * the console's own cream top bar and full-bleed pages rendered inside a
   * floating white card with a 10px gutter, a border and a shadow, reading as
   * a page cut out and pasted onto the shell. The same confusion ran the other
   * way for an owner on /write, who got console chrome around a learner page.
   *
   * A surface belongs to the page drawn on it. `/console/*` and `/admin/*` both
   * lay themselves out edge to edge and paint their own ground; everything else
   * wants the card.
   *
   * `/admin` IS THE HALF THAT WAS MISSED. Moving this from the `variant` prop to
   * the pathname fixed a teacher on /console and quietly broke the platform
   * console, which passes `variant="console"` for exactly this — the cream
   * ground the Super Admin design is drawn on, and no shell padding, because
   * each admin page owns its own inset (see `Surface` in components/admin/ui).
   * It came back as a rounded white card in a 10px gutter, double-inset. The
   * lesson is in the prefix list, not the mechanism: when a decision moves from
   * a prop to a route, every route that relied on the prop has to move with it.
   */
  const consoleSurface = pathname.startsWith("/console") || pathname.startsWith("/admin");
  /**
   * WHICH ROUTES GET THE FLOATING WHITE CARD, and which still paint their own
   * ground edge to edge.
   *
   * The console joined the card: the Sidebar design draws its page as a white
   * rounded panel beside the rail, with the breadcrumb bar inside it, so
   * `/console/*` now gets the same treatment every learner page already had.
   * Its own `.cn-page` padding supplies the inset, so the shell adds none.
   *
   * `/admin` DELIBERATELY DOES NOT. Its pages each own their inset through
   * `Surface` (components/admin/ui), and this is exactly where that broke
   * before: handing them a card plus a 10px gutter rendered every admin screen
   * double-inset, a rounded panel floating inside another one. It keeps the
   * cream full-bleed ground until it gets a pass of its own.
   */
  const fullBleed = pathname.startsWith("/admin");
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
            color: "#8B919D",
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
            padding: 12,
            /* The card look is inline; the MARGIN that lifts it off the edges is
               in globals.css behind the desktop media query. On mobile this same
               element is a full-height `position: fixed` drawer, and a margin
               there would leave a strip of canvas down the side of a panel that
               is supposed to cover the screen. */
            border: `1px solid ${RAIL_BORDER}`,
            borderRadius: 14,
            boxShadow: RAIL_SHADOW,
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
                alignItems: "center",
                gap: 10,
                minWidth: 0,
              }}
            >
              <Logo centre={centreName} />
              {/* Name over role, always. The old row put our wordmark beside a
                  role pill and only stacked for a centre, because a centre name
                  plus a pill would not fit. The design stacks both, and doing it
                  unconditionally means one layout to reason about instead of
                  two — the rail is 250px now, which is tighter still. */}
              <span
                className="lp-sb-brandtext"
                style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}
              >
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 15,
                    fontWeight: 600,
                    color: INK,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={centreName ?? "EngProgress"}
                >
                  {centreName ?? "EngProgress"}
                </span>
                <span
                  className="lp-sb-rolechip"
                  style={{
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                    color: ACCENT,
                    whiteSpace: "nowrap",
                  }}
                >
                  {roleLabel}
                </span>
              </span>
            </Link>
            {/* ANCHORED TO THE RAIL'S EDGE, AND BACK BY REQUEST.
                I had moved this into the brand row as a bordered square, on the
                reasoning that a white rail removes the reason it straddled (no
                single fill was legible on both a dark rail and a light page).
                The owner wants the original: a disc on the boundary, at the top,
                visible at every rail width.

                That position is also what keeps it clear of the logomark. At
                72px an in-flow button has to stack under the mark; anchored to
                the edge it sits at x=57..87 while the mark occupies x=20..52, so
                the two never meet and no collapsed-only rule has to be kept in
                sync. `right: -15px` is half the 30px button. See
                collapsed-rail.test.ts, which holds the arithmetic. */}
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
                /* A solid light disc with a hairline: half of it sits on the
                   rail and half on the canvas, so it can borrow neither ground.
                   The chevron takes the rail's own accent rather than the old
                   burgundy, which would be the only burgundy left on this
                   surface. */
                border: `1px solid ${RAIL_BORDER}`,
                background: WHITE,
                borderRadius: 999,
                cursor: "pointer",
                color: TOGGLE_INK,
                boxShadow: "0 2px 6px -1px rgba(22,35,43,.28)",
                position: "absolute",
                right: "-15px",
                // Above the rail's mobile scrim (30) and every content layer (≤21):
                // half this button lies over the page, so it needs to win there.
                zIndex: 40,
              }}
            >
              {collapsed ? (
                <ChevronsRight size={16} color={TOGGLE_INK} />
              ) : (
                <ChevronsLeft size={16} color={TOGGLE_INK} />
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
            {/* The profile card is the rail's one dark surface — a solid block at
                the foot of a white panel, per the design. The button below is its
                user strip; the account menu opens above it. */}
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
          style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: fullBleed ? 0 : 10 }}
        >
          <div
            /* The space before `lp-shell-surface--fills` is load-bearing: without it
               the two class names concatenate into one token that matches nothing,
               so BOTH the base class and the modifier silently stop applying. That
               is what collapsed the assistant — `.cn-assistant-page` still picked up
               its unscoped `height: 0 !important` while the flex parent it needs to
               grow inside never materialised. */
            className={`lp-shell-surface${fillsTheSurface(pathname) ? " lp-shell-surface--fills" : ""}`}
            style={{
              height: "100%",
              overflow: fillsTheSurface(pathname) ? "hidden" : "auto",
              // One white card for the learner app AND the console — the design
              // draws the console's page as a panel beside the rail, not as a
              // full-bleed cream ground. Set here rather than in CSS so it
              // doesn't depend on `:has()` reaching a descendant.
              background: fullBleed ? "#F4F3EF" : "#fff",
              borderRadius: fullBleed ? 0 : 14,
              border: fullBleed ? "none" : "1px solid #e6e4dc",
              boxShadow: fullBleed ? "none" : "0 4px 14px -10px rgba(22,35,43,.25)",
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
                (consoleSurface || ownsTheSurface(pathname)
                  ? ""
                  : "w-full px-4 py-5 sm:px-6 sm:py-6")
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
            minWidth: 248,
            zIndex: 21,
            background: "#fff",
            border: `1px solid ${RAIL_BORDER}`,
            borderRadius: 14,
            boxShadow: "0 24px 52px -20px rgba(28,25,15,.32)",
            padding: 7,
          }}
        >
          {/* The header repeats the strip below it — avatar, name, subtitle —
              because the menu opens OVER that strip and a panel that starts
              with a bare list of links loses track of whose account it is. */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px 10px" }}>
            <Avatar name={name} size={36} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: RAIL_INK,
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
                {roleLabel}
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: RAIL_BORDER, margin: "2px 4px 6px" }} />

          {items.length > 0 ? (
            <>
              {/* The section label the reference uses over its workspace links.
                  It earns its keep here for the same reason: these rows are
                  about the CENTRE, and the rows under the email below are about
                  the person signed in. One list would blur the two. */}
              <MenuLabel>Workspace</MenuLabel>
              {items.map(({ label, href, icon: Icon }) => (
                <MenuRow key={href} href={href} icon={Icon} onClick={() => setOpen(false)}>
                  {label}
                </MenuRow>
              ))}
              <div style={{ height: 1, background: RAIL_BORDER, margin: "6px 4px" }} />
            </>
          ) : null}

          {/* The email as a label rather than a row, exactly as the reference
              draws it: it is not a link, it is the answer to "which account am I
              in", sitting over the rows that act on that account. */}
          <MenuLabel>{email ?? roleLabel}</MenuLabel>
          {/* Notifications is ALSO in the strip below as a bell, and this copy is
              not redundant: collapse the rail to 72px and the bell goes with the
              rest of the strip, leaving this the only way to reach the page on
              desktop (the top bar carrying the other bell is hidden above
              768px). Deleting it quietly deletes the feature at one rail width. */}
          <MenuRow href="/notifications" icon={Bell} onClick={() => setOpen(false)}>
            Notifications
            {unread > 0 ? (
              <span
                style={{
                  marginLeft: "auto",
                  minWidth: 20,
                  padding: "0 6px",
                  height: 20,
                  borderRadius: 10,
                  background: "#b3261e",
                  color: "#fff",
                  fontSize: 11.5,
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </MenuRow>

          {/* Sign out is fenced off. It is the only irreversible thing in here
              and it sits where a mis-aimed click lands. */}
          <div style={{ height: 1, background: RAIL_BORDER, margin: "6px 4px" }} />
          <form action={signOut}>
            {/* No inline background — the .lp-menu-item:hover wash (globals.css)
                can't beat an inline value. */}
            <button
              type="submit"
              role="menuitem"
              className="lp-menu-item lp-menu-item--danger"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 38,
                padding: "0 10px",
                border: "none",
                borderRadius: 9,
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 500,
                color: "#b3261e",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <LogOut size={17} strokeWidth={1.9} />
              Sign out
            </button>
          </form>
        </div>
      ) : null}

      {/* The strip the reference draws: avatar, name over subtitle, the
          up/down handle, and the bell beside it. It is a ROW OF TWO CONTROLS —
          the account button and a separate link to /notifications — which is why
          the bell is a sibling rather than a child: a <Link> nested inside a
          <button> is invalid HTML and the browser un-nests it, which is how you
          get a bell that opens the account menu. */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          title={name}
          /* NOT `lp-sb-item`. That class carries the nav's hover wash and its
             resting transparency; the profile strip has its own in
             .lp-sb-profile-btn, and sharing the nav's was always a coincidence
             of rule order rather than a decision. */
          className="lp-sb-profile-btn"
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 8px",
            border: 0,
            // Resting background lives in .lp-sb-profile-btn (globals.css) so the
            // hover wash works; inline only when open (inline beats the class).
            background: open ? "rgba(28,25,15,.055)" : undefined,
            borderRadius: 10,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Avatar name={name} size={34} />
          {/* Name over email, and NO role pill. The role already has a permanent
              home in the brand row at the top of the rail, where it sits under the
              centre's name; repeating it here spent the only horizontal space this
              strip has on a word that is already on screen. */}
          <div className="lp-sb-profile-text" style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: RAIL_INK,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name}
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
          {/* Up-and-down, not up. The strip is a switcher in the reference and
              the handle says "this opens", not "this opens upward" — and the old
              chevron rotated 180° to point at the menu it had just opened. */}
          <ChevronsUpDown
            className="lp-sb-profile-chev"
            size={15}
            color={RAIL_FAINT}
            style={{ flex: "none" }}
          />
        </button>
        {/* The bell is BACK IN THE RAIL, where the reference puts it. It had been
            folded into the account menu when the strip went dark, and the unread
            count moved onto the avatar to compensate — a count you can see but
            not click. This is the click. The dot is the count: at 8px there is
            no room for a number, and "something is waiting" is the whole message
            a bell has to carry (the menu row below it still shows how many). */}
        <Link
          href="/notifications"
          className="lp-sb-profile-bell lp-sb-item"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          title="Notifications"
          style={{
            position: "relative",
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 10,
            color: RAIL_FAINT,
          }}
        >
          <Bell size={17} strokeWidth={1.9} />
          {unread > 0 ? (
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: 6,
                right: 7,
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#d2571f",
                // Rings the rail's own paper so the dot sits ON the glyph rather
                // than behind it.
                boxShadow: `0 0 0 2px ${RAIL_BG}`,
              }}
            />
          ) : null}
        </Link>
      </div>
    </div>
  );
}

/** A small uppercase label over a run of menu rows ("Workspace", the email). */
function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 11.5,
        fontWeight: 500,
        color: RAIL_FAINT,
        padding: "6px 10px 4px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

/** One row of the account menu. Same metrics for every row so the list reads as
 *  one column — the reference's rows are all the same height whether they carry
 *  a badge or not. */
function MenuRow({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: LucideIcon;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="lp-menu-item"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 38,
        padding: "0 10px",
        borderRadius: 9,
        fontFamily: SANS,
        fontSize: 14,
        fontWeight: 500,
        color: RAIL_INK,
        textDecoration: "none",
      }}
    >
      <Icon size={17} strokeWidth={1.9} />
      {children}
    </Link>
  );
}

function Avatar({ name, size }: { name: string; size: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        // A ROUNDED SQUARE, not a disc — the reference's account chip, and the
        // one shape in the rail that is not a nav row, so it reads as an object
        // (an account) rather than as another button.
        borderRadius: Math.round(size * 0.28),
        // Pastel fill, dark initials. It used to be solid emerald with white
        // text because it sat on a near-black strip; on warm paper a saturated
        // disc is the loudest thing in the rail, which the signed-in name is not
        // supposed to be.
        background: "#ece7f8",
        color: "#4a3f8f",
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

/**
 * The square mark at the top of the rail.
 *
 * IT IS ONLY THE MARK NOW. The rail used to carry the whole lockup — our full
 * wordmark, or a centre's name set as a wordmark — and swap to the square only
 * when collapsed. The design puts a 32px square beside plain text instead, and
 * the text is drawn by the brand row (which also owns the role line under it),
 * so the wordmark components are no longer what the rail renders.
 *
 * `centre` is still the ONE decision about whose brand this is: an approved
 * centre wears its own initial, everyone else wears ours.
 *
 * `tone` survives for the MOBILE TOP BAR, which is a different surface (white,
 * with the full wordmark) and still calls this component — see the top bar
 * above. Dropping the prop would have silently restyled that bar too.
 */
function Logo({ tone = "light", centre }: { tone?: "light" | "dark"; centre?: string | null }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", minWidth: 0 }}>
      {/* The mobile top bar keeps the wordmark: it has the width for it, and a
          bare square with no name beside it says nothing on a bar with no rail. */}
      <span className="lp-sb-logo-full" style={{ minWidth: 0 }}>
        {centre ? (
          <CentreWordmark name={centre} tone={tone} fontSize={19} />
        ) : (
          <EngProgressLogo tone={tone} fontSize={19} showTagline={false} />
        )}
      </span>
      <span className="lp-sb-logo-mark">
        {centre ? (
          <CentreMark name={centre} size={32} bg={MARK_BG} />
        ) : (
          <EngProgressMark size={32} bg={MARK_BG} />
        )}
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
