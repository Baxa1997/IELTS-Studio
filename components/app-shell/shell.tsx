"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronsLeft, ChevronsRight, ChevronUp, LogOut, Menu } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";

import { SidebarNav } from "./sidebar-nav";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const BORDER = "#3333";

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
  contentClassName,
  sidebarFooter,
  initialCollapsed = false,
  children,
}: {
  role: string;
  home: string;
  name: string;
  roleLabel: string;
  /** Override the default content wrapper. Pass "" for a full-bleed surface
   *  (e.g. the writing library owns its own layout). */
  contentClassName?: string;
  /** Optional node pinned to the bottom of the sidebar rail (above the profile menu). */
  sidebarFooter?: React.ReactNode;
  /** Desktop rail starts collapsed — read from a cookie by the layout so the choice
   *  survives navigation across route groups (which remounts this component). */
  initialCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(initialCollapsed); // desktop icon-rail
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
        background: "#fff",
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
            background: "#FAFAFC",
            borderRight: `1px solid ${BORDER}`,
            display: "flex",
            flexDirection: "column",
            padding: "18px 16px",
            position: "relative",
          }}
        >
          {/* brand row — logo on the left, the collapse toggle opposite it (desktop);
              the mobile drawer shows a close button there instead. */}
          <div
            className="lp-sb-brandrow"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "0 2px 14px",
            }}
          >
            <Link
              href={home}
              onClick={close}
              className="lp-sb-logo"
              style={{ textDecoration: "none" }}
            >
              <Logo />
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
                border: `1px solid #888`,
                background: "#fff",
                borderRadius: 8,
                cursor: "pointer",
                color: "#8A8FA0",
                position: "absolute",
                right: "-15px",
              }}
            >
              {collapsed ? (
                <ChevronsRight size={16} color="#888" />
              ) : (
                <ChevronsLeft size={16} color="#888" />
              )}
            </button>
          </div>

          {/* nav — scrolls if it ever overflows; brand + footer stay pinned. When
              collapsed the overflow goes visible so hover tooltips can escape the rail. */}
          <div onClick={close} className="lp-sb-scroll" style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
            <SidebarNav role={role} />
          </div>

          {/* footer: optional target card (hidden when collapsed), then profile menu */}
          <div
            style={{
              flex: "none",
              marginTop: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {sidebarFooter ? <div className="lp-sb-target">{sidebarFooter}</div> : null}
            <ProfileMenu name={name} roleLabel={roleLabel} />
          </div>
        </aside>

        <main className="lp-shell-main" style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
          <div className={contentClassName ?? "w-full px-6 py-6"}>{children}</div>
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
function ProfileMenu({ name, roleLabel }: { name: string; roleLabel: string }) {
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
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            boxShadow: "0 22px 48px -22px rgba(20,20,48,.45)",
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
                  color: INK,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </div>
              <div style={{ fontSize: 12, color: "#9097A8" }}>{roleLabel}</div>
            </div>
          </div>
          <div style={{ height: 1, background: BORDER, margin: "2px 4px 6px" }} />
          <form action={signOut}>
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
                background: "transparent",
                borderRadius: 9,
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 600,
                color: "#C0392B",
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
          border: `1px solid ${open ? "#DDDCF0" : BORDER}`,
          background: open ? "#F1F1FA" : "#fff",
          borderRadius: 13,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Avatar name={name} size={36} />
        <div className="lp-sb-profile-text" style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: INK,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </div>
          <div style={{ fontSize: 12, color: "#9097A8" }}>{roleLabel}</div>
        </div>
        <ChevronUp
          className="lp-sb-profile-chev"
          size={16}
          color="#9097A8"
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
        background: "linear-gradient(135deg,#5B55D6,#3B43B5)",
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

function Logo() {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "linear-gradient(135deg,#5B55D6,#3B43B5)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 13,
          boxShadow: "0 4px 12px -4px rgba(59,67,181,.6)",
          flex: "none",
        }}
      >
        IS
      </span>
      <span
        className="lp-sb-wordmark"
        style={{
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 19,
          color: INK,
          letterSpacing: "-.01em",
        }}
      >
        IELTS <span style={{ color: INDIGO }}>Studio</span>
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
