"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { signOut } from "@/app/(auth)/actions";

/**
 * The center console's chrome, built to the "Center Admin CRM" design: a 236px
 * deep-navy rail carrying the center's identity, a search box, three labelled
 * nav sections with counts, and a summary card pinned to the bottom — beside a
 * sticky translucent top bar with the breadcrumb and the two global actions.
 *
 * Separate from `AppShell` on purpose. That shell is the learner's (and the
 * platform super-admin's) and has a different anatomy — brand logo, profile
 * menu, collapsible icon rail. Forcing both designs through one component would
 * have left neither of them right.
 *
 * Client component: it owns the slide-over state, the mobile drawer and the
 * search box. The forms inside the slide-overs are passed in as nodes, so they
 * stay server-rendered.
 */

/* ── palette (from the design) ────────────────────────────────────────────── */
const RAIL = "#14133A";
const RAIL_PANEL = "#1D1C4C";
const RAIL_BORDER = "#2A2963";
const RAIL_RULE = "#24234F";
const RAIL_TEXT = "#C9C7E4";
const RAIL_ITEM = "#A8A6D0";
const RAIL_MUTED = "#7C7AA8";
const RAIL_FAINT = "#55538A";
const RAIL_ACTIVE = "#2B2A63";
const GOLD = "#E5A85C";
const INDIGO = "#4340CB";
const CANVAS = "#F4F3EF";
const INK = "#16162E";

export interface NavItem {
  label: string;
  href: string;
  /** Rendered as an inline 16px SVG path set — see ICONS below. */
  icon: keyof typeof ICONS;
  count?: number;
  /** Red pill (the design's open-registers badge). */
  alert?: number;
}
export interface NavSection {
  title: string;
  items: NavItem[];
}

/* ── the design's icon set, inline so nothing else has to load ────────────── */
const ICONS = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  cap: (
    <>
      <path d="M3 8l9-4 9 4-9 4-9-4z" />
      <path d="M7 10.5V16c0 1.7 2.2 3 5 3s5-1.3 5-3v-5.5" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" />
      <path d="M16 5.5a3 3 0 010 5.6M17.5 14c2.2.6 3.5 2.3 3.5 5" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4" />
    </>
  ),
  bars: <path d="M5 20V10M12 20V4M19 20v-7" />,
  medal: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.5 13.5L7 21l5-2.4L17 21l-1.5-7.5" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10v4a1 1 0 001 1h3l6 4V5L8 9H5a1 1 0 00-1 1z" />
      <path d="M18 9.5a4 4 0 010 5" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1v.2a2 2 0 11-4 0V21a1.6 1.6 0 00-2.7-1.2l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 003 15H3a2 2 0 010-4h.1A1.6 1.6 0 004.3 8.3l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 009.8 4.4V4a2 2 0 014 0v.1a1.6 1.6 0 002.7 1.2l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7h.2a2 2 0 010 4h-.2z" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 10-3-3L5 17v3z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
} as const;

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      style={{ flex: "none" }}
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CrmShell({
  orgName,
  orgMeta,
  sections,
  userName,
  windowLabel,
  footer,
  enrolPanel,
  teacherPanel,
  invitePanel,
  children,
}: {
  orgName: string;
  /** The line under the center's name in the rail. */
  orgMeta: string;
  sections: NavSection[];
  userName: string;
  /** The chip in the top bar — the reporting window, since there are no terms. */
  windowLabel: string;
  /** The card pinned to the bottom of the rail. */
  footer?: React.ReactNode;
  /** Server-rendered forms, shown inside the design's slide-overs. */
  enrolPanel?: React.ReactNode;
  teacherPanel?: React.ReactNode;
  invitePanel?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [panel, setPanel] = useState<null | "enrol" | "teacher" | "invite">(null);
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState("");
  const close = () => setPanel(null);

  // Escape closes whatever is open, and the drawer closes on navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanel(null);
        setDrawer(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  // Navigating closes the drawer and any open panel. Adjusted during render
  // rather than in an effect — the layout isn't remounted between console
  // routes, so this is React's "reset state when a prop changes" pattern, and
  // it avoids a second render pass with the stale panel still on screen.
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setDrawer(false);
    setPanel(null);
  }

  const all = sections.flatMap((s) => s.items);
  // Single active item = the longest href the path falls under, so a detail page
  // keeps its parent lit.
  const activeHref = all
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const crumb = (() => {
    const section = sections.find((s) => s.items.some((i) => i.href === activeHref));
    const item = all.find((i) => i.href === activeHref);
    if (!section || !item) return "Center";
    return `${section.title} · ${item.label}`;
  })();

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/console/students?q=${encodeURIComponent(q)}` : "/console/students");
  }

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: CANVAS }}>
      {/* ═══ SIDEBAR ═══ */}
      {drawer ? (
        <button
          aria-label="Close menu"
          onClick={() => setDrawer(false)}
          className="crm-scrim"
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(20,19,58,.4)", border: 0 }}
        />
      ) : null}

      <aside
        className={`crm-rail${drawer ? " crm-rail--open" : ""}`}
        style={{
          width: 236,
          flex: "0 0 236px",
          background: RAIL,
          color: RAIL_TEXT,
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100dvh",
        }}
      >
        {/* center identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 18px 16px" }}>
          <Link
            href="/console"
            style={{
              width: 34,
              height: 34,
              flex: "none",
              borderRadius: 9,
              background: GOLD,
              color: RAIL,
              fontWeight: 700,
              fontSize: 17,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            {orgName.trim().charAt(0).toUpperCase() || "C"}
          </Link>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: "#fff",
                fontWeight: 600,
                fontSize: 13.5,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {orgName}
            </div>
            <div style={{ fontSize: 11, color: RAIL_MUTED }}>{orgMeta}</div>
          </div>
        </div>

        {/* search — a real one: it filters the roster */}
        <div style={{ padding: "0 12px 8px" }}>
          <form
            onSubmit={onSearch}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: RAIL_PANEL,
              border: `1px solid ${RAIL_BORDER}`,
              borderRadius: 8,
              padding: "7px 10px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={RAIL_MUTED} strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students…"
              aria-label="Search students"
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: 0,
                outline: "none",
                fontFamily: "inherit",
                fontSize: 12.5,
                color: "#fff",
              }}
            />
            <span
              style={{
                flexShrink: 0,
                fontSize: 10.5,
                color: RAIL_FAINT,
                border: `1px solid #2F2E6D`,
                borderRadius: 4,
                padding: "1px 5px",
              }}
            >
              ↵
            </span>
          </form>
        </div>

        {/* nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 12px", overflowY: "auto", flex: 1 }}>
          {sections.map((section) => (
            <div key={section.title}>
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: ".09em",
                  color: RAIL_FAINT,
                  padding: "10px 10px 6px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {section.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {section.items.map((item) => {
                  const on = item.href === activeHref;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={on ? "page" : undefined}
                      className="crm-nav"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 11,
                        width: "100%",
                        background: on ? RAIL_ACTIVE : undefined,
                        color: on ? "#fff" : RAIL_ITEM,
                        border: 0,
                        borderRadius: 8,
                        padding: "8px 10px",
                        fontFamily: "inherit",
                        fontSize: 13,
                        fontWeight: on ? 600 : 400,
                        textAlign: "left",
                        textDecoration: "none",
                      }}
                    >
                      <Icon name={item.icon} />
                      <span
                        style={{
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.label}
                      </span>
                      {item.alert ? (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: 10.5,
                            background: "#C2453A",
                            color: "#fff",
                            borderRadius: 20,
                            padding: "1px 6px",
                          }}
                        >
                          {item.alert}
                        </span>
                      ) : item.count != null ? (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: 11,
                            color: RAIL_MUTED,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {item.count.toLocaleString()}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* footer card */}
        <div style={{ marginTop: "auto", padding: "14px 14px 16px", borderTop: `1px solid ${RAIL_RULE}` }}>
          {footer}
          <form action={signOut}>
            <button
              type="submit"
              className="crm-signout"
              style={{
                marginTop: 10,
                width: "100%",
                background: "transparent",
                color: RAIL_MUTED,
                border: `1px solid ${RAIL_RULE}`,
                borderRadius: 7,
                padding: 7,
                fontFamily: "inherit",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: "rgba(244,243,239,.88)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid #E4E2DC",
            padding: "12px 28px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
          className="crm-topbar"
        >
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            className="crm-burger"
            style={{ background: "none", border: 0, color: "#6E6C87", cursor: "pointer", padding: 0 }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div style={{ fontSize: 12.5, color: "#6E6C87" }}>{crumb}</div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className="crm-hide-sm"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "#fff",
                border: "1px solid #E0DED8",
                borderRadius: 8,
                padding: "7px 11px",
                fontSize: 12.5,
                color: INK,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16794C" }} />
              {windowLabel}
            </span>
            {invitePanel ? (
              <button
                type="button"
                onClick={() => setPanel("invite")}
                className="crm-btn-ghost crm-hide-sm"
                style={{
                  background: "#fff",
                  border: "1px solid #E0DED8",
                  borderRadius: 8,
                  padding: "7px 11px",
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  color: INK,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Invite people
              </button>
            ) : null}
            {enrolPanel ? (
              <button
                type="button"
                onClick={() => setPanel("enrol")}
                className="crm-btn-primary"
                style={{
                  background: INDIGO,
                  color: "#fff",
                  border: 0,
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                + Enrol student
              </button>
            ) : null}
            <div className="crm-hide-sm" style={{ width: 1, height: 24, background: "#E0DED8" }} />
            <div
              title={userName}
              style={{
                width: 30,
                height: 30,
                flex: "none",
                borderRadius: "50%",
                background: RAIL,
                color: "#fff",
                fontSize: 11.5,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {initials(userName)}
            </div>
          </div>
        </header>

        <div className="crm-page" style={{ padding: "26px 28px 60px" }}>
          {children}
        </div>
      </main>

      {/* ═══ SLIDE-OVERS ═══ */}
      {panel === "enrol" && enrolPanel ? (
        <SlideOver
          eyebrow="New enrolment"
          title="Enrol a student"
          note="Creates the account and puts them straight into a group."
          onClose={close}
        >
          {enrolPanel}
        </SlideOver>
      ) : null}

      {panel === "teacher" && teacherPanel ? (
        <SlideOver
          eyebrow="Staff"
          title="Add a teacher"
          note="The account is created immediately. They see only the groups you assign."
          onClose={close}
        >
          {teacherPanel}
        </SlideOver>
      ) : null}

      {panel === "invite" && invitePanel ? (
        <Modal
          eyebrow="Invites"
          title="Invite people"
          note="They join this center only — no other center can see them."
          onClose={close}
        >
          {invitePanel}
        </Modal>
      ) : null}
    </div>
  );
}

/** Right-hand slide-over, 460px, exactly as the design draws it. */
function SlideOver({
  eyebrow,
  title,
  note,
  onClose,
  children,
}: {
  eyebrow: string;
  title: string;
  note: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <button
        aria-label="Close"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(20,19,58,.36)", border: 0 }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="crm-slideover"
        style={{
          position: "relative",
          width: 460,
          maxWidth: "100vw",
          background: "#fff",
          height: "100dvh",
          overflowY: "auto",
          boxShadow: "-20px 0 50px rgba(20,19,58,.2)",
          padding: "24px 26px",
        }}
      >
        <PanelHead eyebrow={eyebrow} title={title} note={note} onClose={onClose} />
        <div style={{ marginTop: 22 }}>{children}</div>
      </div>
    </div>
  );
}

/** Centred modal, 440px — the design's "Invite people". */
function Modal({
  eyebrow,
  title,
  note,
  onClose,
  children,
}: {
  eyebrow: string;
  title: string;
  note: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <button
        aria-label="Close"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(20,19,58,.4)", border: 0 }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "relative",
          width: 440,
          maxWidth: "100%",
          maxHeight: "90dvh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          padding: "24px 26px",
          boxShadow: "0 30px 60px rgba(20,19,58,.28)",
        }}
      >
        <PanelHead eyebrow={eyebrow} title={title} note={note} onClose={onClose} />
        <div style={{ marginTop: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function PanelHead({
  eyebrow,
  title,
  note,
  onClose,
}: {
  eyebrow: string;
  title: string;
  note: string;
  onClose: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <div>
        <div
          style={{
            fontSize: 11.5,
            letterSpacing: ".1em",
            fontWeight: 600,
            color: INDIGO,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            fontFamily: "var(--font-serif4), Georgia, serif",
            fontSize: 24,
            fontWeight: 700,
            margin: "6px 0 4px",
            color: INK,
          }}
        >
          {title}
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "#6E6C87" }}>{note}</p>
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          marginLeft: "auto",
          background: CANVAS,
          border: "1px solid #E4E2DC",
          borderRadius: 8,
          width: 30,
          height: 30,
          flex: "none",
          cursor: "pointer",
          fontSize: 15,
          color: "#6E6C87",
        }}
      >
        ×
      </button>
    </div>
  );
}
