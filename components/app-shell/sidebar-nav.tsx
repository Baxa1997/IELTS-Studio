"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Award,
  Banknote,
  BookA,
  BookOpen,
  Building2,
  CalendarCheck,
  ClipboardList,
  CalendarRange,
  ChartNoAxesColumn,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Headphones,
  History,
  LayoutDashboard,
  Mic,
  Receipt,
  ShieldAlert,
  Sparkles,
  SquarePen,
  Target,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

/**
 * The primary navigation (Option A brand). Students get a deliberately minimal
 * menu grouped into sections; staff get the console set. Active state by pathname.
 * Client component — it needs `usePathname` and holds the icons (which can't cross
 * the server→client boundary), so the server shell passes only the role string.
 *
 * Labels/section titles/badges carry `lp-sb-*` classes so the shell can collapse the
 * rail to an icon-only strip purely in CSS (no prop drilling of a collapsed flag).
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
/* On-rail palette — the rail is the brand indigo taken down to a calm dark shade
   (see shell.tsx), so everything here is light-on-dark. */
const RAIL_TEXT = "#CDD1DF"; // resting item text — near-white, calm
const RAIL_MUTED = "#6F7599"; // section titles / disabled
const RAIL_ACTIVE_BG = "rgba(255,255,255,.07)"; // active tile — a calm lighter panel
const RAIL_ACTIVE_LINE = "rgba(255,255,255,.09)";

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  soon?: boolean;
  /** Small pill shown beside an otherwise-live link, e.g. "PREVIEW" for a UI-only page. */
  badge?: string;
  /**
   * What the pill means. `good` (the default) is the green "you have things
   * waiting" used for a student's homework; `alert` is the amber one for work
   * that has come back and nobody has looked at.
   *
   * Two tones rather than one because they ask opposite things of the reader —
   * green is "here is your list", amber is "someone is waiting on you" — and a
   * rail where every pill looks identical teaches people to skip all of them.
   */
  badgeTone?: "good" | "alert";
  /** Key into the `counts` prop — renders the tally quietly at the end of the row
   *  (the CRM design shows how many teachers/groups/students there are). */
  countKey?: string;
};
type Section = { title?: string; items: Item[] };

const STUDENT: Section[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Study plan", href: "/plan", icon: Target },
      { label: "Activities", href: "/activities", icon: History },
    ],
  },
  {
    title: "Practice",
    items: [
      { label: "Writing", href: "/write", icon: SquarePen },
      { label: "Reading", href: "/read", icon: BookOpen },
      { label: "Listening", href: "/listen", icon: Headphones },
      { label: "Speaking", href: "/speak", icon: Mic },
      { label: "CEFR practice", href: "/cefr", icon: GraduationCap },
      { label: "Vocabulary", href: "/vocabulary", icon: BookA },
    ],
  },
];

/* Center staff. "Dashboard", not "Console" and not "Today" — it is the same
   word the learner side uses for the same idea, and one product should not have
   two names for "where I land". Nobody outside this codebase knows what a
   console is, and "Today" read like a filter rather than a place.
   Cohort and Review are deliberately absent: both are parked features (see
   CLAUDE.md) and they made the menu read like an unfinished admin tool. Add the
   line back to restore either. */
const ADMIN: Section[] = [
  /* RUN, not "Center". The section answers "what has to happen today", and
     The page still answers "what has to happen today"; it is the NAME that
     stopped being useful. "Overview" promised a summary of everything, "Today"
     promised a filter, and neither told somebody arriving where they were. */
  {
    title: "Run",
    items: [
      { label: "Assistant", href: "/console/assistant", icon: Sparkles },
      { label: "Dashboard", href: "/console", icon: LayoutDashboard },
      { label: "Groups", href: "/console/groups", icon: Users, countKey: "groups" },
      { label: "Students", href: "/console/students", icon: UserRound, countKey: "students" },
      { label: "Teachers", href: "/console/teachers", icon: GraduationCap, countKey: "teachers" },
      { label: "Timetable", href: "/console/calendar", icon: CalendarRange },
      { label: "Attendance", href: "/console/attendance", icon: CalendarCheck },
    ],
  },
  /* Money is the owner's alone — a teacher's rail has no Finance section, and
     the pages redirect as well, because a rail is a hint and RLS is the gate.
     The one exception is /console/finance/payroll, which a teacher reaches from
     Teaching → My pay and which shows them exactly one payslip: their own. */
  {
    title: "Money",
    items: [
      { label: "Finance", href: "/console/finance", icon: Wallet },
      { label: "Invoices", href: "/console/finance/invoices", icon: Receipt },
      // "Salary", not "Payroll": one word for the whole thing. The separate
      // Salary-rules builder is gone — a class carries the teacher's rate
      // beside the student's fee, which is where an owner looks for it.
      { label: "Salary", href: "/console/finance/payroll", icon: Banknote },
    ],
  },
  /* Learning, not "Insight" — and Announcements is out of it. A broadcast is
     not an insight; putting it here is what made the section a drawer for
     anything that wasn't people or money. */
  {
    title: "Learning",
    items: [
      // Practice → Marking → Results is the actual order of the work: it gets
      // set, it comes back, it gets marked, and then it means something.
      { label: "Practice", href: "/console/practice", icon: ClipboardList },
      { label: "Marking", href: "/console/marking", icon: SquarePen, countKey: "marking" },
      { label: "Results", href: "/console/reports", icon: ChartNoAxesColumn },
    ],
  },
  /* Announcements, Billing & plan and Settings are NOT here. They moved under
     the avatar (see accountItemsFor in shell.tsx): all three are things you go
     and do occasionally and then leave alone, and as permanent sections they
     cost two of the rail's six headings for pages an owner opens about once a
     month — pushing the daily work further down every screen. */
];

/* The front desk. Runs classes and people, takes tuition, and never sees what
   the center is worth or what staff are paid — so there is no Money section,
   no Billing and no Settings. "Take payment" is a purpose-built screen rather
   than the owner's Finance page with parts hidden: a redacted page still shows
   its own shape, and one wrong condition leaks a balance. */
const ADMINISTRATOR: Section[] = [
  {
    title: "Run",
    items: [
      { label: "Assistant", href: "/console/assistant", icon: Sparkles },
      { label: "Dashboard", href: "/console", icon: LayoutDashboard },
      { label: "Groups", href: "/console/groups", icon: Users, countKey: "groups" },
      { label: "Students", href: "/console/students", icon: UserRound, countKey: "students" },
      { label: "Teachers", href: "/console/teachers", icon: GraduationCap, countKey: "teachers" },
      { label: "Timetable", href: "/console/calendar", icon: CalendarRange },
      { label: "Attendance", href: "/console/attendance", icon: CalendarCheck },
    ],
  },
  {
    title: "Front desk",
    items: [{ label: "Take payment", href: "/console/payments", icon: Wallet }],
  },
  {
    title: "Learning",
    items: [
      // Practice → Marking → Results is the actual order of the work: it gets
      // set, it comes back, it gets marked, and then it means something.
      { label: "Practice", href: "/console/practice", icon: ClipboardList },
      { label: "Marking", href: "/console/marking", icon: SquarePen, countKey: "marking" },
      { label: "Results", href: "/console/reports", icon: ChartNoAxesColumn },
    ],
  },
  // Announcements lives under the avatar — see accountItemsFor.
];

const TEACHER: Section[] = [
  {
    title: "Run",
    items: [
      { label: "Assistant", href: "/console/assistant", icon: Sparkles },
      { label: "Dashboard", href: "/console", icon: LayoutDashboard },
      { label: "Groups", href: "/console/groups", icon: Users, countKey: "groups" },
      { label: "Students", href: "/console/students", icon: UserRound, countKey: "students" },
      { label: "Timetable", href: "/console/calendar", icon: CalendarRange },
      { label: "Attendance", href: "/console/attendance", icon: CalendarCheck },
      // Their own payslip and its working — not the center's payroll.
      { label: "My pay", href: "/console/finance/payroll", icon: Banknote },
    ],
  },
  /* A teacher's practice IS the learner's practice — the same /write, /read and
     /listen screens a student uses, not a console copy of them. The only staff
     addition lives on those pages: "attach to a group", which publishes the
     content and sets it as homework in one step (see assignPractice). There is
     no separate console library in the menu because previewing a prompt should
     mean doing exactly what the student will do. */
  {
    title: "Practice",
    items: [
      // First in the section: it is the only one a teacher MAKES rather than
      // sits, and it is the reason they open this rail on a planning day.
      { label: "Practice AI", href: "/console/practice-ai", icon: Sparkles },
      { label: "Writing", href: "/write", icon: SquarePen },
      { label: "Reading", href: "/read", icon: BookOpen },
      { label: "Listening", href: "/listen", icon: Headphones },
    ],
  },
  {
    title: "Learning",
    items: [
      // Practice → Marking → Results is the actual order of the work: it gets
      // set, it comes back, it gets marked, and then it means something.
      { label: "Practice", href: "/console/practice", icon: ClipboardList },
      { label: "Marking", href: "/console/marking", icon: SquarePen, countKey: "marking" },
      { label: "Results", href: "/console/reports", icon: ChartNoAxesColumn },
    ],
  },
  // Announcements is under the avatar (accountItemsFor), still scoped to their
  // own groups. A teacher sets the group's homework and connects its Telegram
  // channel, so barring them from mentioning it was the least defensible line
  // in the whole permission split — moving it out of the rail does not undo
  // that, it just stops a one-item section costing a heading.
];

/** The platform owner: no organization, so none of the org menus apply. */
/**
 * The platform rail, in the two halves the Super Admin design names.
 *
 * PLATFORM is the tenants themselves — who exists and what they are doing.
 * OPERATIONS is running the business behind them: what it earns, what needs
 * policing, and whether the machinery is up. They are separated because a super
 * admin arrives with one of those two questions and never both at once.
 */
const SUPER_ADMIN: Section[] = [
  {
    title: "Platform",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Centers", href: "/admin/centers", icon: Building2 },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Plans & revenue", href: "/admin/plans", icon: CreditCard },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Moderation", href: "/admin/moderation", icon: ShieldAlert },
      { label: "System health", href: "/admin/health", icon: Activity },
    ],
  },
];

/**
 * Put the unopened-work count on Reports.
 *
 * WHY THE RAIL AND NOT ONLY THE BELL. The bell is a stream — it scrolls away,
 * and it is read once. "Two students handed in and nobody has looked" is a
 * standing state, and a standing state belongs on the thing you click to deal
 * with it. This is the staff mirror of the student's Assignments badge: the
 * count of what is owed, sitting on the door you go through to clear it.
 *
 * The number is DISTINCT STUDENTS, matching the Alerts badge and the list the
 * page opens with. A rail that says 3 over a page listing one name is worse
 * than no badge at all.
 */
function withReportsBadge(sections: Section[], newWork: number): Section[] {
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.href === "/console/reports"
        ? { ...item, badge: String(newWork), badgeTone: "alert" as const }
        : item,
    ),
  }));
}

/** Only students who actually belong to a center group get an Assignments link —
 *  a solo B2C learner has nothing to put behind it. `pending` is the count of
 *  homework they haven't finished; it rides the existing badge slot. */
function sectionsFor(
  role: string,
  showAssignments: boolean,
  pending: number,
  homeworkOnly: boolean,
  /** Students whose handed-in work nobody has opened — the Reports badge. */
  newWork: number,
): Section[] {
  if (role === "super_admin") return SUPER_ADMIN;
  if (role !== "student") {
    // Named exhaustively, not by elimination. `role === "center_admin" ? ADMIN
    // : TEACHER` silently handed a brand-new role the teacher's rail.
    const rail =
      role === "center_admin" ? ADMIN : role === "administrator" ? ADMINISTRATOR : TEACHER;
    return newWork > 0 ? withReportsBadge(rail, newWork) : rail;
  }
  if (!showAssignments) return STUDENT;
  const [home, ...rest] = STUDENT;
  const withAssignments: Section = {
    ...home,
    items: [
      home.items[0],
      {
        label: "Assignments",
        href: "/assignments",
        icon: ClipboardCheck,
        badge: pending > 0 ? String(pending) : undefined,
      },
      ...home.items.slice(1),
    ],
  };
  if (!homeworkOnly) return [withAssignments, ...rest];
  // A center student practises what they were set — so the four skills lead to
  // their homework, not a library, and there is no Generate anywhere.
  //
  // Vocabulary stays: it is revision of words they have already met, not
  // un-assigned exam practice, so it doesn't undercut the rule — and a student
  // with no homework set should still have something useful to open.
  // Certificates is theirs to look at; the center issues them.
  return [
    withAssignments,
    {
      title: "Practice",
      items: [
        { label: "Writing", href: "/write", icon: SquarePen },
        { label: "Reading", href: "/read", icon: BookOpen },
        { label: "Listening", href: "/listen", icon: Headphones },
        { label: "Speaking", href: "/speak", icon: Mic },
        { label: "Vocabulary", href: "/vocabulary", icon: BookA },
      ],
    },
    { title: "You", items: [{ label: "Certificates", href: "/certificates", icon: Award }] },
  ];
}

/**
 * Instant click feedback. Rendered INSIDE the <Link>, so it reads that link's
 * navigation state: the moment it's clicked, `pending` flips true and a spinner
 * shows — before the (dynamic) route has even committed.
 */
function PendingDot() {
  const { pending } = useLinkStatus();
  return pending ? <span className="lp-nav-spin" aria-hidden /> : null;
}

const itemBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 11,
  height: 36,
  padding: "0 11px",
  borderRadius: 9,
  fontFamily: SANS,
  fontSize: 14,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

export function SidebarNav({
  role,
  showAssignments = false,
  pendingAssignments = 0,
  counts,
  homeworkOnly = false,
}: {
  role: string;
  showAssignments?: boolean;
  pendingAssignments?: number;
  /** Center student: no browsable practice, only what was set. */
  homeworkOnly?: boolean;
  /** Tallies keyed by an item's `countKey` — the console's nav counts. */
  counts?: Record<string, number>;
}) {
  const pathname = usePathname();
  const sections = sectionsFor(
    role,
    showAssignments,
    pendingAssignments,
    homeworkOnly,
    counts?.newWork ?? 0,
  );
  const all = sections.flatMap((s) => s.items);
  // Single active item = the longest href the path falls under.
  const activeHref = all
    .filter((i) => !i.soon && (pathname === i.href || pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {sections.map((section, si) => (
        <div
          key={section.title ?? si}
          className={section.title ? "lp-sb-section lp-sb-section--titled" : "lp-sb-section"}
        >
          {section.title ? (
            <div
              className="lp-sb-section-title"
              style={{
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: ".09em",
                textTransform: "uppercase",
                color: RAIL_MUTED,
                padding: "0 11px",
                margin: "0 0 5px",
              }}
            >
              {section.title}
            </div>
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {section.items.map(({ label, href, icon: Icon, soon, badge, badgeTone, countKey }) => {
              if (soon) {
                return (
                  <span
                    key={label}
                    data-label={label}
                    aria-label={label}
                    aria-disabled="true"
                    className="lp-sb-link"
                    style={{
                      ...itemBase,
                      justifyContent: "space-between",
                      color: RAIL_MUTED,
                      fontWeight: 400,
                      cursor: "default",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <Icon size={18} strokeWidth={1.8} />
                      <span className="lp-sb-label">{label}</span>
                    </span>
                    <span
                      className="lp-sb-soon-badge"
                      style={{
                        fontFamily: SANS,
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: ".05em",
                        color: "#9096B0",
                        background: "rgba(255,255,255,.07)",
                        padding: "2px 7px",
                        borderRadius: 6,
                      }}
                    >
                      SOON
                    </span>
                  </span>
                );
              }
              const active = href === activeHref;
              return (
                <Link
                  key={href}
                  href={href}
                  /*
                   * NO PREFETCH, and this is a measured decision rather than a
                   * default worth keeping.
                   *
                   * Next prefetches every <Link> that is visible, and a rail is
                   * six to fifteen links all on screen at once. Every one of
                   * those destinations is `force-dynamic` and query-heavy — the
                   * admin Centers page alone runs six database round trips —
                   * so a single page view was firing ten route requests and
                   * re-running all of their queries. The production Network tab
                   * showed twenty requests for one visit to /admin/centers.
                   *
                   * The user clicks at most one of them. Prefetching the other
                   * nine multiplies the database load of every page view by the
                   * size of the menu, for a saving that a dynamic page cannot
                   * bank anyway: the click still costs a server round trip
                   * because the payload cannot be cached.
                   */
                  prefetch={false}
                  data-label={label}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={active ? "lp-sb-link" : "lp-sb-link lp-sb-item"}
                  style={{
                    ...itemBase,
                    justifyContent: "space-between",
                    fontWeight: active ? 500 : 400,
                    color: active ? "#fff" : RAIL_TEXT,
                    // No inline background when inactive — the .lp-sb-item:hover wash
                    // (globals.css) can't beat an inline value, even "transparent".
                    background: active ? RAIL_ACTIVE_BG : undefined,
                    border: `1px solid ${active ? RAIL_ACTIVE_LINE : "transparent"}`,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <Icon size={18} strokeWidth={1.8} />
                    <span className="lp-sb-label">{label}</span>
                  </span>
                  <span
                    className="lp-sb-trail"
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {/* A count of zero is still worth showing — "Teachers 0" is
                        the fact an empty center most needs to see. */}
                    {countKey && counts?.[countKey] != null ? (
                      <span
                        style={{
                          fontFamily: SANS,
                          fontSize: 11,
                          color: RAIL_MUTED,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {counts[countKey].toLocaleString()}
                      </span>
                    ) : null}
                    {badge ? (
                      <span
                        style={{
                          fontFamily: SANS,
                          fontWeight: 700,
                          fontSize: 10,
                          letterSpacing: ".05em",
                          color: active
                            ? "rgba(255,255,255,.85)"
                            : badgeTone === "alert"
                              ? "#FFC069"
                              : "#7CE3AE",
                          background: active
                            ? "rgba(255,255,255,.16)"
                            : badgeTone === "alert"
                              ? "rgba(255,176,74,.15)"
                              : "rgba(91,221,155,.13)",
                          padding: "2px 7px",
                          borderRadius: 6,
                          flexShrink: 0,
                        }}
                      >
                        {badge}
                      </span>
                    ) : null}
                    <PendingDot />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
