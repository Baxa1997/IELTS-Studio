"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

/**
 * The console's page chrome, from the "Center Admin CRM" design: a sticky
 * translucent bar carrying the breadcrumb and the two global actions, plus the
 * slide-overs and modal those open.
 *
 * Note what is NOT here — the sidebar. The app's own collapsible rail stays as
 * it is for every role; the design applies to the content area beside it. That
 * is why this is a chrome component inside the console layout rather than a
 * second shell.
 *
 * Client component for the panel state. The forms inside the panels arrive as
 * nodes, so they stay server-rendered.
 */

const INDIGO = "#4340CB";
const INK = "#16162E";
const CANVAS = "#F4F3EF";

/** Breadcrumb text per route, matching the design's "Section · Page". */
const CRUMBS: [string, string][] = [
  ["/console/teachers", "Center · Teachers"],
  ["/console/groups", "Center · Groups"],
  ["/console/students", "Center · Students"],
  ["/console/attendance", "Center · Attendance"],
  ["/console/reports", "Insight · Reports"],
  ["/console/certificates", "Insight · Certificates"],
  ["/console/announcements", "Insight · Announcements"],
  ["/console/practices", "Teaching · Practice"],
  ["/console/billing", "Admin · Billing & plan"],
  ["/console/settings", "Admin · Settings & roles"],
  ["/console", "Center · Overview"],
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type ConsolePanel = "enrol" | "teacher" | "invite";

/**
 * Lets a page open one of the chrome's panels. A page is a server component, so
 * it can't hold the open/closed state itself — it renders <PanelButton>, which
 * reads this context. That is what keeps "+ Add teacher" a single button at the
 * top of the Teachers page rather than a second copy of the form inline.
 */
const PanelContext = createContext<(panel: ConsolePanel) => void>(() => {});

export function PanelButton({
  panel,
  variant = "primary",
  children,
}: {
  panel: ConsolePanel;
  variant?: "primary" | "ghost";
  children: React.ReactNode;
}) {
  const open = useContext(PanelContext);
  const primary = variant === "primary";
  return (
    <button
      type="button"
      onClick={() => open(panel)}
      className={`cn-btn cn-btn--${primary ? "primary" : "ghost"}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        borderRadius: 8,
        padding: primary ? "10px 15px" : "9px 13px",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: primary ? 600 : 500,
        whiteSpace: "nowrap",
        cursor: "pointer",
        flex: "none",
        border: primary ? 0 : "1px solid #E0DED8",
        background: primary ? INDIGO : "#fff",
        color: primary ? "#fff" : INK,
      }}
    >
      {children}
    </button>
  );
}

export function ConsoleChrome({
  userName,
  windowLabel,
  enrolPanel,
  teacherPanel,
  invitePanel,
  children,
}: {
  userName: string;
  /** The chip beside the actions — the reporting window, since there are no terms. */
  windowLabel: string;
  enrolPanel?: React.ReactNode;
  teacherPanel?: React.ReactNode;
  invitePanel?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [panel, setPanel] = useState<null | "enrol" | "teacher" | "invite">(null);
  const close = () => setPanel(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Navigating closes whatever is open. Adjusted during render, not in an
  // effect — the layout isn't remounted between console routes, and this avoids
  // a second pass with the stale panel still on screen.
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setPanel(null);
  }

  const crumb = CRUMBS.find(([href]) => pathname === href || pathname.startsWith(href + "/"))?.[1];

  return (
    <PanelContext.Provider value={setPanel}>
      <header
        className="cn-topbar"
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
      >
        <div style={{ fontSize: 12.5, color: "#6E6C87" }}>{crumb ?? "Center"}</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span
            className="cn-hide-sm"
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
              className="cn-btn cn-btn--ghost cn-hide-sm"
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
              className="cn-btn cn-btn--primary"
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
          <div className="cn-hide-sm" style={{ width: 1, height: 24, background: "#E0DED8" }} />
          <div
            className="cn-hide-sm"
            title={userName}
            style={{
              width: 30,
              height: 30,
              flex: "none",
              borderRadius: "50%",
              background: "#14133A",
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

      <div className="cn-page" style={{ padding: "26px 28px 60px" }}>
        {children}
      </div>

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
    </PanelContext.Provider>
  );
}

/** Right-hand slide-over, 460px, as the design draws it. */
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
        className="cn-slideover"
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
