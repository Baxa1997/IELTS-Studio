"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

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

/**
 * Breadcrumb text per route, as "Section · Page".
 *
 * The section half has to be the section the rail ACTUALLY shows, or the
 * breadcrumb becomes the third name for the same place — which is the exact
 * complaint §1 opens with ("Nav says Groups, breadcrumb says CLASSES"). These
 * had drifted: Reports became Results, Overview became Today became Dashboard,
 * and Announcements,
 * Billing and Settings left the rail for the account menu.
 */
const CRUMBS: [string, string][] = [
  ["/console/teachers", "Run · Teachers"],
  ["/console/groups", "Run · Groups"],
  ["/console/students", "Run · Students"],
  ["/console/attendance", "Run · Attendance"],
  ["/console/calendar", "Run · Timetable"],
  ["/console/practice-ai", "Practice · Practice AI"],
  ["/console/practices", "Practice · Practice"],
  ["/console/practice", "Learning · Practice"],
  ["/console/marking", "Learning · Marking"],
  ["/console/reports", "Learning · Results"],
  ["/console/finance/invoices", "Money · Invoices"],
  ["/console/finance/payroll", "Money · Salary"],
  ["/console/finance", "Money · Finance"],
  // Under the avatar now, so they name the menu they live in rather than a
  // section that no longer exists.
  ["/console/announcements", "Account · Announcements"],
  ["/console/billing", "Account · Billing & plan"],
  ["/console/settings", "Account · Settings"],
  ["/console", "Run · Dashboard"],
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type ConsolePanel = "enrol" | "teacher" | "invite" | "group";

/**
 * A banner shown at the top of the page after a panel finishes its work.
 *
 * `credentials` is the reason this exists at all: a created account's password
 * is generated once and never shown again, so a panel cannot simply close on
 * success — the teacher would lose the only copy. The banner carries it out of
 * the drawer and stays until dismissed.
 */
export interface ConsoleFlash {
  title: string;
  body?: string;
  credentials?: { login: string; password: string };
}

interface PanelApi {
  open: (panel: ConsolePanel) => void;
  /** Close whatever panel is open, optionally raising a banner as it goes. */
  finish: (flash?: ConsoleFlash) => void;
}

/**
 * Lets a page open one of the chrome's panels. A page is a server component, so
 * it can't hold the open/closed state itself — it renders <PanelButton>, which
 * reads this context. That is what keeps "+ Add teacher" a single button at the
 * top of the Teachers page rather than a second copy of the form inline.
 */
const PanelContext = createContext<PanelApi>({ open: () => {}, finish: () => {} });

/** For a panel that needs to close itself and report what happened. */
export function useConsolePanels(): PanelApi {
  return useContext(PanelContext);
}

export function PanelButton({
  panel,
  variant = "primary",
  children,
}: {
  panel: ConsolePanel;
  variant?: "primary" | "ghost";
  children: React.ReactNode;
}) {
  const { open } = useContext(PanelContext);
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
        border: primary ? 0 : "1px solid #C5C4BE",
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
  groupPanel,
  children,
}: {
  userName: string;
  /** The chip beside the actions — the reporting window, since there are no terms. */
  windowLabel: string;
  enrolPanel?: React.ReactNode;
  teacherPanel?: React.ReactNode;
  invitePanel?: React.ReactNode;
  groupPanel?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [panel, setPanel] = useState<null | ConsolePanel>(null);
  const [flash, setFlash] = useState<ConsoleFlash | null>(null);
  const close = () => setPanel(null);
  // Stable so a panel's effect doesn't re-fire on every chrome render.
  const api = useMemo<PanelApi>(
    () => ({
      open: (p) => {
        setFlash(null);
        setPanel(p);
      },
      finish: (f) => {
        setPanel(null);
        if (f) setFlash(f);
      },
    }),
    [],
  );

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

  /**
   * Pages that own the whole surface.
   *
   * Practice AI opens on a full-bleed hero, and a breadcrumb bar plus 28px of
   * canvas padding above it cuts the gradient off and frames it like a widget.
   * A page whose first screen IS the design gets the screen; the rail stays,
   * because that is how you leave.
   */
  /* The assistant is bare too, and for a sharper reason than Practice AI's.
     It brings its OWN header — the centre it is reading, a live-data badge and
     New chat — so the breadcrumb bar above it was a second header saying less:
     two rows of chrome, one avatar each, and a date filter that nothing on this
     page honours. The rail stays, because that is how you leave. */
  const bare =
    pathname.startsWith("/console/practice-ai") || pathname.startsWith("/console/assistant");

  /* AND IT FILLS, which is a separate thing from being bare. The shell's
     surface is already exactly the viewport less its own 10px padding and its
     border, so a page asking for `100dvh` overflows it by that much and pushes
     its own composer below the fold. Height has to come DOWN the chain — 100%
     of a parent that knows its size — rather than be guessed at from the
     viewport. Practice AI is bare but scrolls normally, so it does not want
     this. */
  const fills = pathname.startsWith("/console/assistant");

  return (
    <PanelContext.Provider value={api}>
      {bare ? null : (
      <header
        className="cn-topbar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(244,243,239,.88)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #C5C4BE",
          padding: "12px 28px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 12.5, color: "#6E6C87" }}>{crumb ?? "Center"}</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {/* ON EVERY PAGE, because the moment you need it is the moment you do
              not know which page would have answered you. It navigates rather
              than opening a panel: one conversation, in one place, that you can
              come back to — not a popover whose contents depend on where you
              happened to be standing. */}
          <Link
            href="/console/assistant"
            className="cn-askai"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "#fff",
              border: "1px solid #C5C4BE",
              borderRadius: 8,
              padding: "7px 11px",
              fontSize: 12.5,
              fontWeight: 600,
              color: INK,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <Sparkles size={14} aria-hidden />
            Ask AI
          </Link>
          <span
            className="cn-hide-sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "#fff",
              border: "1px solid #C5C4BE",
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
          {/* No global actions live here any more.
              "+ Enrol student" and "Invite people" used to sit in this bar on
              EVERY console page, which put "add a student" in front of someone
              reading the payroll. Both are page actions now: each one lives at
              the top of the page it belongs to (Students, Teachers, Groups,
              group detail), where the thing it creates is already on screen.
              The panels themselves are unchanged — pages open them through
              <PanelButton>, which is why they are still handed to this chrome. */}
          <div className="cn-hide-sm" style={{ width: 1, height: 24, background: "#C5C4BE" }} />
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
      )}

      <div
        className="cn-page"
        style={
          fills
            ? { padding: 0, height: "100%" }
            : bare
              ? { padding: 0 }
              : { padding: "26px 28px 60px" }
        }
      >
        {children}
      </div>

      {/* Success takes over the screen rather than sitting quietly at the top:
          it usually carries a password shown exactly once, and a banner is far
          too easy to scroll past or dismiss on the way to the next thing. */}
      {flash ? (
        <Modal
          eyebrow="Done"
          title={flash.title}
          note={flash.body ?? ""}
          onClose={() => setFlash(null)}
        >
          <FlashBody flash={flash} onClose={() => setFlash(null)} />
        </Modal>
      ) : null}

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

      {panel === "group" && groupPanel ? (
        <SlideOver
          eyebrow="Groups"
          title="Create a group"
          note="A group is where practice is set and bands are compared."
          onClose={close}
        >
          {groupPanel}
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

/**
 * The body of the success modal: the credentials, a copy button, and a way out.
 *
 * The password is generated once and never retrievable, so this is the only
 * moment it exists on screen. That is why it is a modal and not a toast, and
 * why "Done" is the only way to leave rather than an auto-dismiss.
 */
function FlashBody({ flash, onClose }: { flash: ConsoleFlash; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!flash.credentials) return;
    await navigator.clipboard.writeText(
      `Login: ${flash.credentials.login}\nPassword: ${flash.credentials.password}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {flash.credentials ? (
        <>
          <div
            style={{
              background: "#EAF4EE",
              border: "1px solid #CFE6D9",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <Cred label="Login" value={flash.credentials.login} />
            <div style={{ height: 10 }} />
            <Cred label="Password" value={flash.credentials.password} />
          </div>
          <p style={{ fontSize: 12, color: "#777581", margin: 0, lineHeight: 1.55 }}>
            The password isn&apos;t shown again — copy it now if you still need to hand it over.
          </p>
        </>
      ) : null}

      <div style={{ display: "flex", gap: 8 }}>
        {flash.credentials ? (
          <button
            type="button"
            onClick={() => void copy()}
            style={{
              flex: 1,
              background: "#fff",
              border: "1px solid #CFCABC",
              borderRadius: 9,
              padding: 11,
              fontFamily: "inherit",
              fontSize: 13.5,
              fontWeight: 600,
              color: INK,
              cursor: "pointer",
            }}
          >
            {copied ? "Copied" : "Copy credentials"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            background: INDIGO,
            color: "#fff",
            border: 0,
            borderRadius: 9,
            padding: 11,
            fontFamily: "inherit",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

/** One credential line — label above, value in mono so O/0 can be told apart. */
function Cred({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "#16794C", fontWeight: 600 }}>{label}</div>
      <div
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 15,
          color: "#14532d",
          marginTop: 2,
          wordBreak: "break-all",
        }}
      >
        {value}
      </div>
    </div>
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
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
          border: "1px solid #C5C4BE",
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
