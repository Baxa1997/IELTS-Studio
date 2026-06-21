"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";

import { SidebarNav } from "./sidebar-nav";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const BORDER = "#E0DBCB";

/**
 * The authenticated app shell (Option A brand) — a unified top header spanning the
 * full width (brand on the left over the sidebar, the signed-in user + sign-out on
 * the right), with the sidebar and the scrolling main column below it. The frame
 * itself doesn't scroll; only <main> does, so the header and rail stay pinned.
 *
 * Navigation renders EXACTLY ONCE: a static rail on desktop, the same sidebar as a
 * slide-in drawer on mobile. An optional `sidebarFooter` pins to the bottom of the
 * rail (e.g. the student's "Your target" card).
 */
export function AppShell({
  role,
  home,
  name,
  roleLabel,
  contentClassName,
  sidebarFooter,
  children,
}: {
  role: string;
  home: string;
  name: string;
  roleLabel: string;
  /** Override the default centered/max-width content wrapper. Pass "" for a
   *  full-bleed surface (e.g. the writing library owns its own layout). */
  contentClassName?: string;
  /** Optional node pinned to the bottom of the sidebar rail. */
  sidebarFooter?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "#F4F1E7", fontFamily: SANS, color: INK }}>
      {/* ===== unified top header (spans sidebar + main) ===== */}
      <header style={{ height: 66, flex: "none", display: "flex", background: "#FBFAF3", borderBottom: `1px solid ${BORDER}` }}>
        {/* desktop: brand column matching the sidebar width */}
        <div className="lp-shell-brandcol" style={{ width: 272, flex: "none", alignItems: "center", gap: 11, padding: "0 22px", borderRight: `1px solid ${BORDER}` }}>
          <Link href={home} style={{ textDecoration: "none" }}><Logo /></Link>
        </div>
        {/* mobile: hamburger + brand */}
        <div className="lp-shell-mobilebrand" style={{ alignItems: "center", gap: 10, padding: "0 14px" }}>
          <button onClick={() => setOpen(true)} aria-label="Open menu" style={{ background: "none", border: "none", color: "#6E7388", cursor: "pointer", display: "flex" }}>
            <Menu size={22} />
          </button>
          <Link href={home} style={{ textDecoration: "none" }}><Logo /></Link>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16, padding: "0 clamp(16px,3vw,30px)", minWidth: 0 }}>
          <div className="lp-shell-usermeta" style={{ textAlign: "right", lineHeight: 1.15, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
            <div style={{ fontSize: 12.5, color: "#9097A8" }}>{roleLabel}</div>
          </div>
          <span style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#5B55D6,#3B43B5)", color: "#fff", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            {initials(name)}
          </span>
          <div className="lp-shell-usermeta" style={{ width: 1, height: 28, background: BORDER }} />
          <form action={signOut}>
            <button type="submit" style={{ display: "flex", alignItems: "center", gap: 7, height: 38, padding: "0 14px", border: "1px solid #E2DED0", background: "#fff", borderRadius: 10, fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: "#6E7388", cursor: "pointer", whiteSpace: "nowrap" }}>
              <LogOut size={15} strokeWidth={2} />
              <span className="lp-shell-usermeta">Sign out</span>
            </button>
          </form>
        </div>
      </header>

      {/* ===== body: sidebar + main ===== */}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {open ? <button aria-label="Close menu" onClick={close} className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 30, background: "rgba(0,0,0,.4)", border: "none" }} /> : null}

        <aside
          className={open ? "lp-shell-sidebar lp-shell-sidebar--open" : "lp-shell-sidebar"}
          style={{ width: 272, flex: "none", background: "#FBFAF3", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", padding: "20px 16px" }}
        >
          {/* mobile-only brand + close at the top of the drawer */}
          <div className="flex items-center justify-between md:hidden" style={{ padding: "4px 8px 18px" }}>
            <Logo />
            <button onClick={close} aria-label="Close menu" style={{ background: "none", border: "none", color: "#8a897c", cursor: "pointer" }}>
              <X size={20} />
            </button>
          </div>

          <div onClick={close} style={{ flex: "0 0 auto" }}>
            <SidebarNav role={role} />
          </div>

          {sidebarFooter ? <div style={{ marginTop: "auto" }}>{sidebarFooter}</div> : null}
        </aside>

        <main className="lp-shell-main" style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
          <div className={contentClassName ?? "mx-auto w-full max-w-[1240px] px-6 py-6"}>{children}</div>
        </main>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#5B55D6,#3B43B5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 13, boxShadow: "0 4px 12px -4px rgba(59,67,181,.6)" }}>IS</span>
      <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 19, color: INK, letterSpacing: "-.01em" }}>
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
