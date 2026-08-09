"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookA,
  BookOpen,
  Building2,
  CalendarCheck,
  ChartNoAxesColumn,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Headphones,
  History,
  LayoutDashboard,
  Megaphone,
  Mic,
  Settings,
  SquarePen,
  Target,
  UserRound,
  Users,
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

/* Center staff. "Dashboard", not "Console" — it's the same word the learner
   side uses, and nobody outside this codebase knows what a console is.
   Cohort and Review are deliberately absent: both are parked features (see
   CLAUDE.md) and they made the menu read like an unfinished admin tool. Add the
   line back to restore either. */
const ADMIN: Section[] = [
  {
    title: "Center",
    items: [
      { label: "Overview", href: "/console", icon: LayoutDashboard },
      { label: "Teachers", href: "/console/teachers", icon: GraduationCap, countKey: "teachers" },
      { label: "Groups", href: "/console/groups", icon: Users, countKey: "groups" },
      { label: "Students", href: "/console/students", icon: UserRound, countKey: "students" },
      { label: "Attendance", href: "/console/attendance", icon: CalendarCheck },
    ],
  },
  // No Practice: the library is the teacher's. An admin runs people, billing
  // and reports, and sees results through Reports and the groups.
  {
    title: "Insight",
    items: [
      { label: "Reports", href: "/console/reports", icon: ChartNoAxesColumn },
      { label: "Certificates", href: "/console/certificates", icon: Award },
      { label: "Announcements", href: "/console/announcements", icon: Megaphone },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Billing & plan", href: "/console/billing", icon: CreditCard },
      { label: "Settings & roles", href: "/console/settings", icon: Settings },
    ],
  },
];

const TEACHER: Section[] = [
  {
    title: "Teaching",
    items: [
      { label: "Overview", href: "/console", icon: LayoutDashboard },
      { label: "Groups", href: "/console/groups", icon: Users, countKey: "groups" },
      { label: "Students", href: "/console/students", icon: UserRound, countKey: "students" },
      { label: "Attendance", href: "/console/attendance", icon: CalendarCheck },
    ],
  },
  /* A teacher's practice IS the learner's practice — the same /write, /read and
     /listen screens a student uses, not a console copy of them. The only staff
     addition lives on those pages: "attach to a class", which publishes the
     content and sets it as homework in one step (see assignPractice). There is
     no separate console library in the menu because previewing a prompt should
     mean doing exactly what the student will do. */
  {
    title: "Practice",
    items: [
      { label: "Writing", href: "/write", icon: SquarePen },
      { label: "Reading", href: "/read", icon: BookOpen },
      { label: "Listening", href: "/listen", icon: Headphones },
    ],
  },
  {
    title: "Insight",
    items: [
      { label: "Reports", href: "/console/reports", icon: ChartNoAxesColumn },
      { label: "Certificates", href: "/console/certificates", icon: Award },
    ],
  },
];

/** The platform owner: no organization, so none of the org menus apply. */
const SUPER_ADMIN: Section[] = [
  {
    items: [
      { label: "Platform", href: "/admin", icon: LayoutDashboard },
      { label: "Centers", href: "/admin/centers", icon: Building2 },
      { label: "Users", href: "/admin/users", icon: Users },
    ],
  },
];

/** Only students who actually belong to a center group get an Assignments link —
 *  a solo B2C learner has nothing to put behind it. `pending` is the count of
 *  homework they haven't finished; it rides the existing badge slot. */
function sectionsFor(
  role: string,
  showAssignments: boolean,
  pending: number,
  homeworkOnly: boolean,
): Section[] {
  if (role === "super_admin") return SUPER_ADMIN;
  if (role !== "student") return role === "center_admin" ? ADMIN : TEACHER;
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
  const sections = sectionsFor(role, showAssignments, pendingAssignments, homeworkOnly);
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
            {section.items.map(({ label, href, icon: Icon, soon, badge, countKey }) => {
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
                          color: active ? "rgba(255,255,255,.85)" : "#7CE3AE",
                          background: active ? "rgba(255,255,255,.16)" : "rgba(91,221,155,.13)",
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
