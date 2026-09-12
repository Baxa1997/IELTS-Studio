"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { BODY, BRAND, INK, LINE, RADIUS, SANS, WHITE } from "./design";
import { LangPicker } from "./lang-picker";

/**
 * The interactive half of the header island: the nav links, the account action
 * and the mobile drawer.
 *
 * WHY THIS IS A SEPARATE CLIENT COMPONENT. `SiteHeader` dresses six routes, and
 * the landing page among them is the one page in the app that still renders
 * statically — no `force-dynamic`, no session work in front of an anonymous
 * visitor. Calling `getSession()` in the header to decide the button's label
 * would have made all six dynamic and undone that, for one word of copy. So the
 * session is read in the BROWSER instead: the pages stay static and cacheable,
 * and the button settles a moment after paint.
 *
 * The cost of that choice is honest and small: a signed-in visitor sees "Start
 * learning" for the first frame or two before it becomes "Dashboard". The button
 * is laid out at a fixed minimum width so the swap doesn't shift the row.
 *
 * Returns a FRAGMENT of two elements, not a wrapper. The island is a
 * `1fr auto 1fr` grid — brand, nav, actions — and a wrapping div here would
 * collapse the last two tracks into one and pull the nav off centre.
 */

/** `/pricing` is behind auth and 307s a logged-out visitor, so the header points
 *  at the anchor on the landing page instead — the fix the SEO pass made. */
const NAV = [
  { label: "Platform", href: "/#platform" },
  { label: "Pricing", href: "/#pricing" },
  { label: "How to use", href: "/how-to-use" },
  { label: "For centers", href: "/how-to-use/education-centers" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let live = true;

    supabase.auth.getSession().then(({ data }) => {
      if (live) setSignedIn(Boolean(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (live) setSignedIn(Boolean(session));
    });

    return () => {
      live = false;
      subscription.unsubscribe();
    };
  }, []);

  // A drawer that can be opened and not dismissed is worse than no drawer, and
  // the body must not scroll behind it.
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* THE DESTINATION IS `/start`, NOT `/dashboard`, and that matters for staff.
     `roleHome()` sends a student to /dashboard, a teacher or centre admin to
     /console and a super admin to /admin — but the browser can only see THAT
     there is a session, not which role it carries. `/start` is the server route
     that already exists for exactly this: it resolves the role and redirects.
     Linking straight to /dashboard would land every teacher on a student page. */
  const action = signedIn
    ? { href: "/start", label: "Dashboard" }
    : { href: "/sign-in", label: "Start learning" };

  return (
    <>
      <nav className="lp-nav" aria-label="Primary">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="lp-navlink">
            {n.label}
          </Link>
        ))}
      </nav>

      <div className="lp-nav-actions">
        <span className="lp-nav-lang">
          <LangPicker compact />
        </span>

        <Link href={action.href} className="lp-island-cta">
          {action.label}
        </Link>

        <button
          type="button"
          className="lp-burger"
          aria-expanded={open}
          aria-controls="lp-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>
            {open ? "✕" : "☰"}
          </span>
        </button>
      </div>

      {open ? (
        <div id="lp-mobile-menu" className="lp-mobile-menu">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: "13px 14px",
                borderRadius: 12,
                fontFamily: SANS,
                fontSize: 16,
                fontWeight: 600,
                color: INK,
                textDecoration: "none",
              }}
            >
              {n.label}
            </Link>
          ))}

          <div style={{ borderTop: `1px solid ${LINE}`, margin: "10px 0 0", paddingTop: 14 }}>
            <Link
              href={action.href}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                textAlign: "center",
                background: BRAND,
                color: WHITE,
                borderRadius: RADIUS.pill,
                padding: "14px 22px",
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {action.label}
            </Link>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 14, color: BODY }}>
              <LangPicker compact />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
