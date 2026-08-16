"use client";

import { useActionState, useState } from "react";
import { FaFileCsv, FaFileExcel } from "react-icons/fa6";
import { FiChevronDown, FiKey, FiUserPlus } from "react-icons/fi";

import { resetStudentPassword, type ResetPasswordState } from "../actions";
import { useActionFeedback } from "@/components/console/toast";

import { MoveOrRemove } from "./move-or-remove";

/**
 * The group, as one table.
 *
 * WHAT THIS REPLACED. The group page had SIX tabs, two of which — "Roster" and
 * "Manage" — both listed the same students: one with their bands, one with two
 * permanently-expanded forms for adding more. Nowhere did it just show you the
 * group. Now there is one Students tab, this table is it, and the two ways of
 * adding are a button and a menu above it.
 *
 * EVERY STUDENT HAS AN ACCOUNT, AND THAT IS NOT OPTIONAL. Homework on this
 * platform IS the account — an essay, its band and its feedback all hang off a
 * student id, and there is no version of "hand work in" without one. What is
 * optional is the teacher ever thinking about it: the login is built from the
 * name and the password is generated. The login shows here so it can be read
 * back out, and Reset password exists because a center student's address is
 * synthetic — they cannot reset their own by email, so their teacher does it.
 *
 * A grid per row rather than one `<table>`: revealing a new password has to put
 * a full-width strip under a single row, which a shared column grid can't do.
 */

const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";
const LINE = "#EAE8E1";
const GREEN = "#16794C";
const AMBER = "#9A6B00";
const RED = "#B3261E";
const INDIGO = "#4340CB";

const COLS = "minmax(200px, 2.4fr) 1.1fr .6fr .8fr 1fr auto";

export interface StudentRow {
  id: string;
  name: string;
  login: string | null;
  contactEmail: string | null;
  /** Another student in this group gives the same address. Allowed by design —
   *  siblings share a parent's inbox — but it has to LOOK deliberate, because
   *  the same address twice in a roster otherwise reads as a duplicated row. */
  sharesEmail?: boolean;
  joinedAt: string;
  photoUrl: string | null;
  /** Their lowest measured band, and in which skill. Null = never graded. */
  weakestSkill: string | null;
  weakestBand: number | null;
  targetBand: number | null;
  practice30d: number;
  lastActive: string | null;
  /** `active` | `paused` | `left`. A left student stays on the roster, greyed. */
  status?: string | null;
  /** "120 000 owed" when they are behind, null when square. */
  owedLabel?: string | null;
}

export function StudentsManager({
  groupId,
  students,
  otherGroups = [],
}: {
  groupId: string;
  students: StudentRow[];
  /** Groups this person also manages — the destinations for a move. */
  otherGroups?: { id: string; name: string }[];
}) {
  if (students.length === 0) {
    return (
      <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.6 }}>
        Nobody in this group yet. Add them one at a time, or import the register you already keep —
        logins and passwords are made for you.
      </p>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 820 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            gap: 12,
            padding: "0 0 8px",
            borderBottom: `1px solid ${LINE}`,
            fontSize: 11.5,
            fontWeight: 600,
            color: FAINT,
            textTransform: "uppercase",
            letterSpacing: ".04em",
          }}
        >
          <span>Student</span>
          <span>Weakest skill</span>
          <span>Target</span>
          <span>30-day practice</span>
          <span>Last active</span>
          <span />
        </div>
        {students.map((s) => (
          <StudentLine key={s.id} groupId={groupId} student={s} otherGroups={otherGroups} />
        ))}
      </div>
    </div>
  );
}

function StudentLine({
  groupId,
  student,
  otherGroups,
}: {
  groupId: string;
  student: StudentRow;
  otherGroups: { id: string; name: string }[];
}) {
  const [reset, resetAction, resetting] = useActionState(
    resetStudentPassword,
    {} as ResetPasswordState,
  );
  // Never closes the dialog: the new password is shown inside it, once.
  // `showResult` is local rather than derived from `reset.done`, because
  // useActionState keeps its result forever — without this, reopening the
  // dialog next week would greet you with the password from last time instead
  // of a form.
  useActionFeedback(reset, { keepOpen: true, onSuccess: () => setShowResult(true) });
  const [resetOpen, setResetOpen] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);

  const behind =
    student.weakestBand != null && student.targetBand != null
      ? student.weakestBand - student.targetBand
      : null;

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{ borderBottom: `1px solid ${LINE}`, padding: "10px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Avatar name={student.name} photoUrl={student.photoUrl} />
          <span style={{ minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: 13.5,
                fontWeight: 600,
                color: INK,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {student.name}
            </span>
            <span style={{ display: "block", fontSize: 11.5, color: FAINT, marginTop: 1 }}>
              {student.login ? (
                <code style={{ fontFamily: "ui-monospace, monospace" }}>{student.login}</code>
              ) : (
                "no login"
              )}
              {student.contactEmail ? (
                <>
                  {" · "}
                  {student.contactEmail}
                  {student.sharesEmail ? (
                    <span
                      title="Another student in this group uses the same address — usually a shared parent inbox."
                      style={{ marginLeft: 5, color: "#8A5A12", fontWeight: 600 }}
                    >
                      shared
                    </span>
                  ) : null}
                </>
              ) : null}
            </span>
          </span>
        </span>

        <span style={{ fontSize: 13 }}>
          {student.weakestBand != null ? (
            <span
              style={{
                fontWeight: 600,
                color: behind == null || behind >= 0 ? GREEN : behind >= -1 ? AMBER : RED,
              }}
            >
              {student.weakestBand.toFixed(1)}{" "}
              <span style={{ fontWeight: 400, color: FAINT, textTransform: "capitalize" }}>
                {student.weakestSkill}
              </span>
            </span>
          ) : (
            <span style={{ color: FAINT }}>not measured</span>
          )}
        </span>

        <span style={{ fontSize: 13, color: MUTED }}>{student.targetBand?.toFixed(1) ?? "—"}</span>

        <span style={{ fontSize: 13, color: student.practice30d === 0 ? FAINT : INK }}>
          {student.practice30d}
        </span>

        <span style={{ fontSize: 12.5, color: MUTED }}>
          {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : "never"}
        </span>

        <span style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <a href={`/console/groups/${groupId}/students/${student.id}`} style={linkStyle}>
            Report
          </a>

          {/* Opens a dialog rather than resetting on the click. A reset takes
              effect immediately and locks the student out of the password they
              have — that deserves a deliberate second step, and it is also
              where the teacher gets to CHOOSE the password. */}
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            style={quietStyle}
            title="Give them a new password"
          >
            <FiKey size={13} aria-hidden />
            Password
          </button>

          {/* §5: one button, three ways out. Remove used to be the only one,
              which meant a student who simply stopped coming was deleted from
              the roster — off the teacher's list, off every report, with their
              unpaid invoices attached to nobody anyone could now find. */}
          <MoveOrRemove
            groupId={groupId}
            student={{ id: student.id, name: student.name }}
            otherGroups={otherGroups}
            owedLabel={student.owedLabel ?? null}
          />
        </span>
      </div>

      {resetOpen ? (
        <Modal
          onClose={() => {
            setResetOpen(false);
            setShowResult(false);
          }}
          title="New password"
          note={`For ${student.name}`}
          width={460}
        >
          <ResetPasswordForm
            groupId={groupId}
            student={student}
            state={reset}
            showResult={showResult}
            action={resetAction}
            pending={resetting}
            onCopy={copy}
            copied={copied}
          />
        </Modal>
      ) : null}
    </div>
  );
}

/**
 * Give a student a new password — chosen, or generated.
 *
 * WHY A TEACHER TYPES IT. This is the only reset most center students have:
 * their auth address is synthetic and undeliverable, so "forgot password" over
 * email cannot reach them. And the people who need it most are children, who
 * can be told "your password is dolphin7" and cannot be told "kR4t-9Qmz". Left
 * blank it still generates a strong one, which is right for adults.
 *
 * The warning is not decoration: the change is immediate, so a student mid-way
 * through an essay on another device is signed out of the old password from
 * that moment.
 */
function ResetPasswordForm({
  groupId,
  student,
  state,
  showResult,
  action,
  pending,
  onCopy,
  copied,
}: {
  groupId: string;
  student: StudentRow;
  state: ResetPasswordState;
  /** True only for the reset that just happened in this dialog. */
  showResult: boolean;
  action: (formData: FormData) => void;
  pending: boolean;
  onCopy: (text: string) => void;
  copied: boolean;
}) {
  if (showResult && state.done) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #BFE3D0",
            background: "#F2FAF6",
            display: "grid",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 12.5, color: MUTED }}>
            Give these to {state.done.name}. The password is not shown again.
          </span>
          <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <code style={credStyle}>{state.done.login}</code>
            <code style={credStyle}>{state.done.password}</code>
          </span>
        </div>
        <button
          type="button"
          onClick={() => onCopy(`Login: ${state.done!.login}\nPassword: ${state.done!.password}`)}
          style={{ ...quietStyle, justifySelf: "start", color: GREEN }}
        >
          {copied ? "Copied" : "Copy both"}
        </button>
      </div>
    );
  }

  return (
    <form action={action} style={{ display: "grid", gap: 12 }}>
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="student_id" value={student.id} />

      <div
        style={{
          padding: "10px 12px",
          borderRadius: 9,
          border: "1px solid #EFD9A8",
          background: "#FDF6E7",
          fontSize: 12.5,
          color: AMBER,
          lineHeight: 1.5,
        }}
      >
        This takes effect straight away. Their old password stops working, so hand the new one over
        before they next try to sign in.
      </div>

      <label style={{ display: "grid", gap: 5 }}>
        <span style={{ fontSize: 12.5, color: MUTED }}>
          Login <span style={{ color: FAINT }}>(unchanged)</span>
        </span>
        <code style={{ ...credStyle, background: "#F7F6F2" }}>{student.login ?? "—"}</code>
      </label>

      <label style={{ display: "grid", gap: 5 }}>
        <span style={{ fontSize: 12.5, color: MUTED }}>New password</span>
        <input
          name="password"
          autoComplete="off"
          minLength={8}
          placeholder="Leave blank to generate a strong one"
          style={{
            height: 36,
            borderRadius: 8,
            border: `1px solid ${LINE}`,
            padding: "0 10px",
            fontSize: 13.5,
            fontFamily: "inherit",
            color: INK,
            outline: "none",
          }}
        />
        <span style={{ fontSize: 11.5, color: FAINT }}>
          At least 8 characters. Something they can remember is fine — a child will be typing it.
        </span>
      </label>

      {state.error ? (
        <p style={{ fontSize: 12.5, color: RED, margin: 0 }} role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        style={{
          justifySelf: "start",
          height: 36,
          padding: "0 16px",
          borderRadius: 9,
          border: "none",
          background: INDIGO,
          color: "#fff",
          fontSize: 13.5,
          fontWeight: 600,
          fontFamily: "inherit",
          cursor: pending ? "default" : "pointer",
          opacity: pending ? 0.6 : 1,
        }}
      >
        {pending ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}

const credStyle: React.CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  fontSize: 13,
  background: "#fff",
  border: `1px solid ${LINE}`,
  borderRadius: 6,
  padding: "5px 9px",
  color: INK,
};

/* ── the toolbar ──────────────────────────────────────────────────────────── */

/**
 * One button over the group list, with the three things you can do to it.
 *
 * A single entry point rather than a row of buttons. "Add one", "import a
 * list" and "export the list" are the same job at different scales, and a
 * roster screen that opens with three competing primary buttons reads as a
 * toolbar rather than as a group. The menu also gives each one room for a
 * sentence saying what it does, which a button label cannot.
 */
export function RosterToolbar({
  students,
  groupName,
  addForm,
  importForm,
}: {
  students: StudentRow[];
  groupName: string;
  /** The single-student form, rendered in a drawer-sized modal. */
  addForm: React.ReactNode;
  /** The Excel/CSV import, which needs the width of a table. */
  importForm: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState<"add" | "import" | null>(null);

  function exportCsv() {
    const rows = [
      [
        "Name",
        "Login",
        "Contact email",
        "Joined",
        "Weakest band",
        "Skill",
        "Target",
        "30-day practice",
        "Last active",
      ],
      ...students.map((s) => [
        s.name,
        s.login ?? "",
        s.contactEmail ?? "",
        s.joinedAt.slice(0, 10),
        s.weakestBand?.toFixed(1) ?? "",
        s.weakestSkill ?? "",
        s.targetBand?.toFixed(1) ?? "",
        String(s.practice30d),
        s.lastActive?.slice(0, 10) ?? "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    // A BOM, or Excel reads Cyrillic names as mojibake.
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${groupName.replace(/[^\w\s-]/g, "").trim() || "group"}-students.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  }

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: INDIGO,
          border: 0,
          borderRadius: 9,
          padding: "8px 14px",
          fontFamily: "inherit",
          fontSize: 13.5,
          fontWeight: 600,
          color: "#fff",
          cursor: "pointer",
        }}
      >
        <FiUserPlus size={15} aria-hidden />
        Add student
        <FiChevronDown size={13} aria-hidden style={{ opacity: 0.85 }} />
      </button>

      {menuOpen ? (
        <>
          {/* Catches the click that dismisses the menu, so it closes on any
              outside click without a document-level listener. */}
          <span
            onClick={() => setMenuOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <span
            role="menu"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              zIndex: 41,
              minWidth: 268,
              background: "#fff",
              border: `1px solid ${LINE}`,
              borderRadius: 11,
              boxShadow: "0 14px 36px rgba(22,22,46,.14)",
              padding: 5,
              display: "block",
            }}
          >
            <MenuItem
              icon={<FiUserPlus size={16} color={INDIGO} />}
              title="Add a single student"
              note="Type a name — login and password are made for you"
              onClick={() => {
                setMenuOpen(false);
                setOpen("add");
              }}
            />
            <MenuItem
              icon={<FaFileExcel size={16} color="#1D6F42" />}
              title="Import from Excel"
              note="Upload the .xlsx or CSV register you already keep"
              onClick={() => {
                setMenuOpen(false);
                setOpen("import");
              }}
            />
            <MenuItem
              icon={<FaFileCsv size={16} color="#0F6CBD" />}
              title="Export list as CSV"
              note={`${students.length} student${students.length === 1 ? "" : "s"}, opens in Excel`}
              onClick={exportCsv}
              disabled={students.length === 0}
            />
          </span>
        </>
      ) : null}

      {open ? (
        <Modal
          onClose={() => setOpen(null)}
          title={open === "add" ? "Add a student" : "Import students"}
          note={
            open === "add"
              ? "The login and password are generated and shown once you add them."
              : "Upload the register you already keep, or paste the names."
          }
          width={open === "add" ? 520 : 720}
        >
          {open === "add" ? addForm : importForm}
        </Modal>
      ) : null}
    </span>
  );
}

function MenuItem({
  icon,
  onClick,
  title,
  note,
  disabled,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  note: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="cn-chip"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: 0,
        borderRadius: 8,
        padding: "9px 10px",
        fontFamily: "inherit",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span aria-hidden style={{ display: "inline-flex", marginTop: 1, flexShrink: 0 }}>
        {icon}
      </span>
      <span>
        <span style={{ display: "block", fontSize: 13, color: INK, fontWeight: 500 }}>{title}</span>
        <span style={{ display: "block", fontSize: 11.5, color: FAINT, marginTop: 1 }}>{note}</span>
      </span>
    </button>
  );
}

/**
 * A centred modal, not a slide-over.
 *
 * Importing is a review step — a table of guessed columns you check before
 * forty accounts exist — and a 460px drawer cannot show a table. Everything
 * else on this page stays a drawer.
 */
function Modal({
  onClose,
  title,
  note,
  width,
  children,
}: {
  onClose: () => void;
  title: string;
  note: string;
  width: number;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: "rgba(22,22,46,.35)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "6vh 16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: `min(${width}px, 100%)`,
          background: "#fff",
          borderRadius: 14,
          padding: 20,
          boxShadow: "0 24px 60px rgba(22,22,46,.24)",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 17, color: INK }}>{title}</h2>
          <span style={{ fontSize: 12.5, color: FAINT }}>{note}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: 0,
              fontSize: 20,
              lineHeight: 1,
              color: MUTED,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── bits ──────────────────────────────────────────────────────────────── */

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return photoUrl ? (
    // A signed, expiring Storage URL: next/image would proxy and cache a link
    // that has expired by the time it's fetched, so this stays a plain <img>.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoUrl}
      alt=""
      width={30}
      height={30}
      style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
    />
  ) : (
    <span
      aria-hidden
      style={{
        width: 30,
        height: 30,
        flexShrink: 0,
        borderRadius: "50%",
        background: "#EDEBFB",
        color: INDIGO,
        fontSize: 11.5,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {initials || "?"}
    </span>
  );
}

const quietStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  background: "#fff",
  border: `1px solid ${LINE}`,
  borderRadius: 7,
  padding: "4px 9px",
  fontSize: 12,
  fontFamily: "inherit",
  color: MUTED,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

/**
 * Destructive, and looking it — but only once confirmed.
 *
 * The FIRST click is a red-lettered outline button, not a filled red one. A
 * filled danger button sitting on every row of a group list turns the whole
 * table into a wall of alarm, and the thing it removes is reversible (the
 * account and its work survive). The filled treatment is earned by the second
 * click, which is the one that actually does something.
 */

const linkStyle: React.CSSProperties = {
  ...quietStyle,
  color: INDIGO,
  textDecoration: "none",
  display: "inline-block",
};
