"use client";

import { usePathname } from "next/navigation";

/**
 * "Platform · Users" — where you are, in the header bar.
 *
 * Derived from the path rather than passed down from each page, so a new admin
 * route gets a breadcrumb by existing instead of by remembering to add one.
 * A screen missing from the map falls back to its own segment rather than
 * rendering blank.
 */

const CRUMBS: Record<string, string> = {
  "/admin": "Platform · Overview",
  "/admin/centers": "Platform · Education centers",
  "/admin/users": "Platform · Users",
  "/admin/plans": "Operations · Plans & revenue",
  "/admin/moderation": "Operations · Moderation",
  "/admin/health": "Operations · System health",
};

export function HeaderCrumb() {
  const pathname = usePathname() ?? "/admin";

  const exact = CRUMBS[pathname];
  const crumb =
    exact ??
    (pathname.startsWith("/admin/centers/")
      ? "Platform · Centers · this center"
      : `Platform · ${pathname.replace("/admin/", "").replace(/\//g, " · ") || "Overview"}`);

  return <div style={{ fontSize: 12.5, color: "#6E6C87" }}>{crumb}</div>;
}
