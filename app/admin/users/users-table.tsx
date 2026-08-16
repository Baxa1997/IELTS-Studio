"use client";

import { useMemo, useState } from "react";

import {
  Empty,
  FAINT,
  HEAD_BG,
  Identity,
  INDIGO,
  INK,
  LINE,
  Pill,
  SOFT,
  TableHead,
  TableRow,
  TONE,
  clip,
} from "@/components/admin/ui";
import { PLAN_ORDER, PLAN_TIERS, type OrgPlan } from "@/lib/billing/plans";

import { ManageModal, type ManageTarget } from "./manage-modal";

/**
 * The users table, filtered in the browser.
 *
 * WHY CLIENT-SIDE. The whole list is already on the page — `loadUsers` caps at
 * the 500 most recent accounts, which is a few hundred kilobytes and one query
 * — so filtering it needs no server at all. Every keystroke used to cost a
 * round trip and a full re-render, and the selects needed an Apply button to
 * avoid one per change. Now typing filters as you type and a select acts on the
 * click, which is what the design shows and what the owner asked for.
 *
 * The trade is that a filter is no longer in the URL. That is worth it here:
 * this is a console someone drives, not a view they send to a colleague, and
 * the header's search still deep-links by name for when it is.
 */

export interface UserRow {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  emailUndeliverable: boolean;
  role: string;
  orgKind: "personal" | "center";
  orgName: string;
  orgPlan: OrgPlan;
  orgStatus: string;
  gradingLimit: number | null;
  generationLimit: number | null;
  orgMemberCount: number;
  practiceCount: number;
  createdAt: string;
}

const COLS = "2.3fr 1fr 1.4fr .9fr .8fr 1fr 96px";
const PAGE_SIZE = 25;

const PLAN_TONE: Record<OrgPlan, "neutral" | "indigo" | "amber" | "green"> = {
  trial: "neutral",
  starter: "indigo",
  pro: "amber",
  enterprise: "green",
};

const AVATAR = ["indigo", "green", "amber", "red", "neutral"] as const;
const avatarTone = (name: string) =>
  AVATAR[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "—";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const SORTS: Record<string, { label: string; cmp: (a: UserRow, b: UserRow) => number }> = {
  recent: { label: "Newest first", cmp: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  oldest: { label: "Oldest first", cmp: (a, b) => a.createdAt.localeCompare(b.createdAt) },
  practice: { label: "Most practice", cmp: (a, b) => b.practiceCount - a.practiceCount },
  idle: { label: "No practice first", cmp: (a, b) => a.practiceCount - b.practiceCount },
  name: { label: "Name A–Z", cmp: (a, b) => a.name.localeCompare(b.name) },
};

const field: React.CSSProperties = {
  border: "1px solid #E4E2DC",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 12.5,
  background: "#fff",
  fontFamily: "inherit",
  color: INK,
};

export function UsersTable({ users, initialQuery = "" }: { users: UserRow[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [role, setRole] = useState("all");
  const [kind, setKind] = useState("all");
  const [plan, setPlan] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [manage, setManage] = useState<ManageTarget | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) =>
        q
          ? u.name.toLowerCase().includes(q) ||
            (u.email ?? "").toLowerCase().includes(q) ||
            (u.username ?? "").toLowerCase().includes(q) ||
            u.orgName.toLowerCase().includes(q)
          : true,
      )
      .filter((u) => (role === "all" ? true : u.role === role))
      .filter((u) => (kind === "all" ? true : u.orgKind === kind))
      .filter((u) => (plan === "all" ? true : u.orgPlan === plan))
      .sort(SORTS[sort].cmp);
  }, [users, query, role, kind, plan, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Adjusted during render rather than in an effect: filtering down to two rows
  // while sitting on page 7 must not paint an empty table first.
  const safePage = Math.min(page, pages);
  if (safePage !== page) setPage(safePage);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "14px 18px",
          borderBottom: "1px solid #F0EEE9",
          flexWrap: "wrap",
        }}
      >
        <input
          value={query}
          onChange={(e) => reset(setQuery)(e.target.value)}
          placeholder="Name, email or login…"
          aria-label="Search users"
          style={{ ...field, flex: 1, minWidth: 200, maxWidth: 280, background: "#FAFAF8" }}
        />
        <select value={role} onChange={(e) => reset(setRole)(e.target.value)} aria-label="Role" style={field}>
          <option value="all">Any role</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="center_admin">Center admin</option>
          <option value="administrator">Administrator</option>
        </select>
        <select value={kind} onChange={(e) => reset(setKind)(e.target.value)} aria-label="Workspace" style={field}>
          <option value="all">Anywhere</option>
          <option value="personal">Individual</option>
          <option value="center">In a center</option>
        </select>
        <select value={plan} onChange={(e) => reset(setPlan)(e.target.value)} aria-label="Plan" style={field}>
          <option value="all">Any plan</option>
          {PLAN_ORDER.map((p) => (
            <option key={p} value={p}>
              {PLAN_TIERS[p].name}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" style={field}>
          {Object.entries(SORTS).map(([value, s]) => (
            <option key={value} value={value}>
              {s.label}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: FAINT }}>
          {filtered.length} of {users.length}
        </span>
        <a
          href="/api/admin/export?kind=users"
          title="Export users (Excel)"
          aria-label="Export users to Excel"
          className="ad-act"
          style={{ marginLeft: "auto", color: TONE.green.ink, textDecoration: "none" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M4 10h16M10 10v10" />
          </svg>
        </a>
      </div>

      <div className="ad-scroll">
        <div>
          <TableHead cols={COLS}>
            <div>USER</div>
            <div>ROLE</div>
            <div>WORKSPACE</div>
            <div>PLAN</div>
            <div style={{ textAlign: "right" }}>PRACTICE</div>
            <div>JOINED</div>
            <div style={{ textAlign: "right" }}>ACTIONS</div>
          </TableHead>

          {rows.map((u) => (
            <TableRow key={u.id} cols={COLS}>
              <Identity
                glyph={initials(u.name)}
                tone={avatarTone(u.name)}
                round
                name={
                  <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={clip}>{u.name}</span>
                    {u.orgStatus === "suspended" ? <Pill tone="red">suspended</Pill> : null}
                  </span>
                }
                meta={
                  <>
                    {u.email ?? u.username ?? "—"}
                    {u.emailUndeliverable ? (
                      <span title="Synthetic sign-in address — cannot receive mail"> (no inbox)</span>
                    ) : null}
                  </>
                }
              />
              <div>
                <Pill tone={u.role === "center_admin" ? "indigo" : "neutral"}>
                  {u.role.replace("_", " ")}
                </Pill>
              </div>
              <div style={{ color: "#4C4A63", fontSize: 12.5, ...clip }}>
                {u.orgKind === "center" ? u.orgName : "Individual"}
              </div>
              <div>
                <Pill tone={PLAN_TONE[u.orgPlan]}>{PLAN_TIERS[u.orgPlan].name}</Pill>
              </div>
              <div
                style={{
                  textAlign: "right",
                  fontWeight: 600,
                  color: u.practiceCount === 0 ? FAINT : INK,
                }}
              >
                {u.practiceCount}
              </div>
              <div style={{ color: SOFT, fontSize: 12.5 }}>{dateFmt(u.createdAt)}</div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  title="Plan and limits"
                  aria-label={`Plan and limits for ${u.name}`}
                  className="ad-act ad-act--go"
                  style={{ color: INDIGO }}
                  onClick={() =>
                    setManage({
                      profileId: u.id,
                      name: u.name,
                      email: u.email,
                      initials: initials(u.name),
                      plan: u.orgPlan,
                      orgKind: u.orgKind,
                      orgName: u.orgName,
                      gradingLimit: u.gradingLimit,
                      generationLimit: u.generationLimit,
                      orgMemberCount: u.orgMemberCount,
                      suspended: u.orgStatus === "suspended",
                    })
                  }
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
                  </svg>
                </button>
                {/* Suspend opens the same dialog rather than firing from the
                    row: locking someone out on a single click, with no name in
                    front of you and no undo, is how the wrong row gets hit. */}
                <button
                  type="button"
                  title={u.orgStatus === "suspended" ? "Suspended — open to restore" : "Suspend account"}
                  aria-label={`Suspend ${u.name}`}
                  className="ad-act ad-act--danger"
                  style={{ color: u.orgStatus === "suspended" ? TONE.green.ink : TONE.red.ink }}
                  onClick={() =>
                    setManage({
                      profileId: u.id,
                      name: u.name,
                      email: u.email,
                      initials: initials(u.name),
                      plan: u.orgPlan,
                      orgKind: u.orgKind,
                      orgName: u.orgName,
                      gradingLimit: u.gradingLimit,
                      generationLimit: u.generationLimit,
                      orgMemberCount: u.orgMemberCount,
                      suspended: u.orgStatus === "suspended",
                    })
                  }
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M10 8v8M14 8v8" />
                  </svg>
                </button>
              </div>
            </TableRow>
          ))}

          {rows.length === 0 ? <Empty>Nobody matches those filters.</Empty> : null}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "13px 18px",
          fontSize: 12.5,
          color: SOFT,
          background: HEAD_BG,
          borderTop: `1px solid ${LINE}`,
        }}
      >
        <span>
          {filtered.length === 0
            ? "Nothing to show"
            : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            type="button"
            className="ad-act"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
            style={{ color: safePage <= 1 ? "#CFCDC8" : "#4C4A63" }}
          >
            ‹
          </button>
          <button
            type="button"
            className="ad-act"
            disabled={safePage >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            aria-label="Next page"
            style={{ color: safePage >= pages ? "#CFCDC8" : "#4C4A63" }}
          >
            ›
          </button>
        </span>
      </div>

      <ManageModal target={manage} onClose={() => setManage(null)} />
    </>
  );
}
