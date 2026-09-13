"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { SANS } from "@/lib/theme/tokens";
import {
  Activity,
  Award,
  Banknote,
  Bot,
  BookA,
  BookOpen,
  Building2,
  ChevronRight,
  ClipboardList,
  CalendarRange,
  ChartNoAxesColumn,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Gift,
  Headphones,
  History,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  Mic,
  Receipt,
  School,
  ShieldAlert,
  SquarePen,
  Target,
  UserRound,
  Users,
  Wallet,
  WandSparkles,
} from "lucide-react";

const RAIL_TEXT = "#3f3d39"; // resting item text
const RAIL_MUTED = "#8b8883"; // counts / disabled / secondary
const RAIL_ACTIVE_BG = "#eae7e0";
const RAIL_ACTIVE_INK = "#16150f";
/** Sections are plain stacks — the rail is one surface and the gap between
 *  groups is the only separator. */
const TRAY: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  soon?: boolean;
  /** Small pill shown beside an otherwise-live link, e.g. "PREVIEW" for a UI-only page. */
  badge?: string;

  badgeTone?: "good" | "alert";
  countKey?: string;
  alsoMatches?: string[];

  accent?: "assistant" | "generate";
};

type Section = { title?: string; icon?: LucideIcon; items: Item[] };

export function resolveActiveHref(
  items: Pick<Item, "href" | "soon" | "alsoMatches">[],
  pathname: string,
): string | undefined {
  return items
    .filter((i) => !i.soon)
    .flatMap((i) => [i.href, ...(i.alsoMatches ?? [])].map((route) => ({ owner: i.href, route })))
    .filter(({ route }) => pathname === route || pathname.startsWith(route + "/"))
    .sort((a, b) => b.route.length - a.route.length)[0]?.owner;
}

const STUDENT: Section[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Study plan", href: "/plan", icon: Target },
      { label: "Activities", href: "/activities", icon: History },
      { label: "Referrals", href: "/referrals", icon: Gift },
    ],
  },
  {
    title: "Practice",
    icon: Layers,
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

const ADMIN: Section[] = [
  {
    items: [
      { label: "Assistant", href: "/console/assistant", icon: Bot, accent: "assistant" },
      { label: "Dashboard", href: "/console", icon: LayoutDashboard },
    ],
  },
  {
    title: "Centre",
    icon: Users,
    items: [
      { label: "Groups", href: "/console/groups", icon: Users, countKey: "groups" },
      { label: "Students", href: "/console/students", icon: UserRound, countKey: "students" },
      { label: "Teachers", href: "/console/teachers", icon: GraduationCap, countKey: "teachers" },
      {
        label: "Calendar",
        href: "/console/calendar",
        icon: CalendarRange,
        // Attendance is this item's other tab — see ScheduleTabs.
        alsoMatches: ["/console/attendance"],
      },
    ],
  },

  {
    title: "Money",
    icon: Wallet,
    items: [
      { label: "Finance", href: "/console/finance", icon: Wallet },
      { label: "Invoices", href: "/console/finance/invoices", icon: Receipt },
      // "Salary", not "Payroll": one word for the whole thing. The separate
      // Salary-rules builder is gone — a class carries the teacher's rate
      // beside the student's fee, which is where an owner looks for it.
      { label: "Salary", href: "/console/finance/payroll", icon: Banknote },
    ],
  },

  {
    title: "Learning",
    icon: School,
    items: [
      // Practice → Marking → Results is the actual order of the work: it gets
      // set, it comes back, it gets marked, and then it means something.
      { label: "Practice", href: "/console/practice", icon: ClipboardList },
      { label: "Marking", href: "/console/marking", icon: SquarePen, countKey: "marking" },
      { label: "Results", href: "/console/reports", icon: ChartNoAxesColumn },
    ],
  },
];

const ADMINISTRATOR: Section[] = [
  {
    items: [
      { label: "Assistant", href: "/console/assistant", icon: Bot, accent: "assistant" },
      { label: "Dashboard", href: "/console", icon: LayoutDashboard },
    ],
  },
  {
    title: "Centre",
    icon: Users,
    items: [
      { label: "Groups", href: "/console/groups", icon: Users, countKey: "groups" },
      { label: "Students", href: "/console/students", icon: UserRound, countKey: "students" },
      { label: "Teachers", href: "/console/teachers", icon: GraduationCap, countKey: "teachers" },
      {
        label: "Calendar",
        href: "/console/calendar",
        icon: CalendarRange,
        // Attendance is this item's other tab — see ScheduleTabs.
        alsoMatches: ["/console/attendance"],
      },
      { label: "Take payment", href: "/console/payments", icon: Wallet },
    ],
  },
  {
    title: "Learning",
    icon: School,
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
    items: [
      { label: "Assistant", href: "/console/assistant", icon: Bot, accent: "assistant" },
      {
        label: "Practice AI",
        href: "/console/practice-ai",
        icon: WandSparkles,
        accent: "generate",
      },
      { label: "Dashboard", href: "/console", icon: LayoutDashboard },
    ],
  },

  {
    title: "Practice",
    icon: Layers,
    items: [
      { label: "Writing", href: "/write", icon: SquarePen },
      { label: "Reading", href: "/read", icon: BookOpen },
      { label: "Listening", href: "/listen", icon: Headphones },
    ],
  },

  {
    title: "Teaching",
    icon: Users,
    items: [
      { label: "Groups", href: "/console/groups", icon: Users, countKey: "groups" },
      { label: "Students", href: "/console/students", icon: UserRound, countKey: "students" },
      {
        label: "Calendar",
        href: "/console/calendar",
        icon: CalendarRange,
        // Attendance is this item's other tab — see ScheduleTabs.
        alsoMatches: ["/console/attendance"],
      },
      // Their own payslip and its working — not the center's payroll.
      { label: "My pay", href: "/console/finance/payroll", icon: Banknote },
    ],
  },

  {
    title: "Learning",
    icon: School,
    items: [
      // Practice → Marking → Results is the actual order of the work: it gets
      // set, it comes back, it gets marked, and then it means something.
      { label: "Practice", href: "/console/practice", icon: ClipboardList },
      { label: "Marking", href: "/console/marking", icon: SquarePen, countKey: "marking" },
      { label: "Results", href: "/console/reports", icon: ChartNoAxesColumn },
    ],
  },
  // Announcements is under the avatar (accountItemsFor), still scoped to their
  // own groups.
];

const SUPER_ADMIN: Section[] = [
  { items: [{ label: "Overview", href: "/admin", icon: LayoutDashboard }] },
  {
    title: "Platform",
    icon: Building2,
    items: [
      { label: "Centers", href: "/admin/centers", icon: Building2 },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Plans & revenue", href: "/admin/plans", icon: CreditCard },
      /* Approval is the only gate on the referral programme, so the queue has to
         be somewhere a super admin passes, not somewhere they remember. */
      { label: "Referrals", href: "/admin/referrals", icon: Gift },
    ],
  },
  {
    title: "Operations",
    icon: Activity,
    items: [
      { label: "Moderation", href: "/admin/moderation", icon: ShieldAlert },
      { label: "System health", href: "/admin/health", icon: Activity },
    ],
  },
];

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

  return [
    withAssignments,
    {
      title: "Practice",
      icon: Layers,
      items: [
        { label: "Writing", href: "/write", icon: SquarePen },
        { label: "Reading", href: "/read", icon: BookOpen },
        { label: "Listening", href: "/listen", icon: Headphones },
        { label: "Speaking", href: "/speak", icon: Mic },
        { label: "Vocabulary", href: "/vocabulary", icon: BookA },
      ],
    },
    {
      title: "You",
      icon: Award,
      items: [{ label: "Certificates", href: "/certificates", icon: Award }],
    },
  ];
}

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 26,
  height: 26,
  borderRadius: 8,
  flex: "none",
};

function PendingDot() {
  const { pending } = useLinkStatus();
  return pending ? <span className="lp-nav-spin" aria-hidden /> : null;
}

const itemBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "4px 9px",
  borderRadius: 9,
  fontFamily: SANS,
  fontSize: 14.5,
  textDecoration: "none",
  whiteSpace: "nowrap",
  border: "1px solid transparent",
};

function shouldPrefetch(href: string): boolean {
  return !(
    href.startsWith("/admin") ||
    href.startsWith("/console/finance") ||
    href.startsWith("/console/reports") ||
    href.startsWith("/console/marking") ||
    href.startsWith("/console/practice-ai")
  );
}

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function exclusivelyFor(sections: Section[], openTitle: string | null): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const section of sections) {
    if (section.title) next[section.title] = section.title === openTitle;
  }
  return next;
}

const OPEN_KEY = "sb_open_groups";

const openStoreListeners = new Set<() => void>();

function subscribeOpenGroups(listener: () => void): () => void {
  openStoreListeners.add(listener);
  // Another tab (or another mount of this rail) changing the preference.
  window.addEventListener("storage", listener);
  return () => {
    openStoreListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readOpenGroups(): string {
  try {
    return window.localStorage.getItem(OPEN_KEY) ?? "";
  } catch {
    // Blocked or full storage must not take the navigation down with it; every
    // group simply stays open, which is the default anyway.
    return "";
  }
}

/** What the server rendered: no stored preference, so every group is open. */
function serverOpenGroups(): string {
  return "";
}

function writeOpenGroups(next: Record<string, boolean>): void {
  try {
    window.localStorage.setItem(OPEN_KEY, JSON.stringify(next));
  } catch {
    // Preference only — losing it costs a click, not a feature.
  }
  // `storage` does not fire in the tab that wrote, so tell our own subscribers.
  for (const listener of openStoreListeners) listener();
}

function groupBadge(items: Item[]): { badge: string; tone: "good" | "alert" } | null {
  const badged = items.filter((i) => i.badge && Number(i.badge) > 0);
  if (badged.length === 0) return null;
  const total = badged.reduce((sum, i) => sum + Number(i.badge), 0);
  return {
    badge: String(total),
    tone: badged.some((i) => i.badgeTone === "alert") ? "alert" : "good",
  };
}

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
  const [pendingCount, setPendingCount] = useState(pendingAssignments);
  useEffect(() => {
    if (!showAssignments) return;
    let cancelled = false;
    fetch("/api/assignments/pending-count", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { count?: unknown } | null) => {
        if (!cancelled && typeof body?.count === "number") setPendingCount(body.count);
      })
      .catch(() => {
        // The badge is secondary UI; leave the shell usable if it cannot load.
      });
    return () => {
      cancelled = true;
    };
  }, [showAssignments]);
  const sections = sectionsFor(
    role,
    showAssignments,
    pendingCount,
    homeworkOnly,
    counts?.newWork ?? 0,
  );
  const all = sections.flatMap((s) => s.items);
  const activeHref = resolveActiveHref(all, pathname);

  const storedRaw = useSyncExternalStore(subscribeOpenGroups, readOpenGroups, serverOpenGroups);
  const stored = useMemo<Record<string, boolean>>(() => {
    if (!storedRaw) return {};
    try {
      const parsed: unknown = JSON.parse(storedRaw);
      // A hand-edited or half-written value must not crash the navigation.
      return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  }, [storedRaw]);
  const [session, setSession] = useState<Record<string, boolean>>({});
  const openGroups = useMemo(() => ({ ...stored, ...session }), [stored, session]);

  const groupOf = (href?: string) =>
    href ? sections.find((s) => s.title && s.items.some((i) => i.href === href))?.title : undefined;
  const activeGroup = groupOf(activeHref);

  const [lastActiveGroup, setLastActiveGroup] = useState(activeGroup);
  if (activeGroup !== lastActiveGroup) {
    setLastActiveGroup(activeGroup);
    // Same rule on arrival: land in Learning and Teaching folds behind you.
    // Not persisted — `writeOpenGroups` is a side effect and this runs during
    // render; navigating somewhere is not the same as choosing a layout.
    if (activeGroup) setSession(exclusivelyFor(sections, activeGroup));
  }

  const isOpen = (title: string) => openGroups[title] ?? true;

  const toggleGroup = (title: string) => {
    const next = isOpen(title)
      ? { ...openGroups, [title]: false }
      : exclusivelyFor(sections, title);
    setSession(next);
    writeOpenGroups(next);
  };

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {sections.map((section, si) => {
        const open = section.title ? isOpen(section.title) : true;
        const rollup = section.title && !open ? groupBadge(section.items) : null;
        const GroupIcon = section.icon;
        /* Ties the chevron to the list it opens for a screen reader. Derived
           from the title rather than `useId` so it is stable across the
           server/client boundary and readable in the DOM inspector. */
        const panelId = section.title
          ? `sb-group-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
          : undefined;
        return (
          <div
            key={section.title ?? si}
            className={section.title ? "lp-sb-section lp-sb-section--group" : "lp-sb-section"}
            style={TRAY}
          >
            {section.title && GroupIcon ? (
              <button
                type="button"
                onClick={() => toggleGroup(section.title as string)}
                aria-expanded={open}
                aria-controls={panelId}
                data-label={section.title}
                className="lp-sb-item lp-sb-grouprow"
                style={{
                  ...itemBase,
                  justifyContent: "space-between",
                  width: "100%",
                  cursor: "pointer",
                  textAlign: "left",
                  // A shut group holding the current page keeps the ink, so the
                  // rail still answers "roughly where am I" at a glance.
                  color: !open && activeGroup === section.title ? RAIL_ACTIVE_INK : RAIL_TEXT,
                  fontWeight: !open && activeGroup === section.title ? 600 : 500,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span className="lp-sb-chip" style={chipStyle}>
                    <GroupIcon size={17} strokeWidth={1.9} />
                  </span>
                  <span className="lp-sb-label">{section.title}</span>
                </span>
                <span
                  className="lp-sb-trail"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  {rollup ? (
                    <span className="lp-sb-badge" style={badgeStyle(rollup.tone)}>
                      {rollup.badge}
                    </span>
                  ) : null}
                  <ChevronRight
                    className="lp-sb-caret"
                    size={15}
                    strokeWidth={2}
                    aria-hidden
                    style={{
                      color: RAIL_MUTED,
                      transform: open ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  />
                </span>
              </button>
            ) : null}

            <div
              id={panelId}
              className={cx("lp-sb-sub", !section.title && "lp-sb-sub--flat")}
              data-open={open ? "1" : "0"}
              aria-hidden={section.title && !open ? true : undefined}
            >
              <div className="lp-sb-sub-inner">
                {section.title ? <div className="lp-sb-flyout-title">{section.title}</div> : null}
                {section.items.map(
                  ({ label, href, icon: Icon, soon, badge, badgeTone, countKey, accent }) => {
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
                          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span className="lp-sb-chip" style={{ ...chipStyle, opacity: 0.5 }}>
                              <Icon size={17} strokeWidth={1.75} />
                            </span>
                            <span className="lp-sb-label">{label}</span>
                          </span>
                          <span
                            className="lp-sb-soon-badge"
                            style={{
                              fontFamily: SANS,
                              fontWeight: 700,
                              fontSize: 10,
                              letterSpacing: ".05em",
                              color: RAIL_MUTED,
                              background: "#eceae3",
                              padding: "2px 7px",
                              borderRadius: 6,
                            }}
                          >
                            SOON
                          </span>
                        </span>
                      );
                    }
                    const selected = href === activeHref;
                    return (
                      <Link
                        key={href}
                        href={href}
                        prefetch={shouldPrefetch(href) ? undefined : false}
                        data-label={label}
                        aria-label={label}
                        aria-current={selected ? "page" : undefined}
                        /* `tabIndex={-1}` inside a shut group: the rows are
                           still in the DOM (they have to be — the grid tween
                           measures them), and a link you cannot see but can tab
                           to is a keyboard trap. `aria-hidden` on the wrapper
                           handles screen readers; this handles the focus ring. */
                        tabIndex={section.title && !open ? -1 : undefined}
                        className={cx(
                          "lp-sb-link",
                          "lp-sb-item",
                          selected && "lp-sb-link--active",
                          accent === "assistant" && "lp-sb-assistant",
                          selected && accent && "lp-sb-accent-active",
                        )}
                        style={{
                          ...itemBase,
                          justifyContent: "space-between",
                          fontWeight: selected ? 600 : 400,
                          color: selected ? RAIL_ACTIVE_INK : RAIL_TEXT,
                          background: selected ? RAIL_ACTIVE_BG : undefined,
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            /* Only the Assistant breathes, and only while you are
                               not on it: once you are ON the page, an icon nudging
                               for attention is asking you to go somewhere you
                               already are. */
                            className={cx("lp-sb-chip", accent === "assistant" && "lp-sb-ai")}
                            style={chipStyle}
                          >
                            <Icon size={17} strokeWidth={selected ? 2 : 1.75} />
                          </span>
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
                                fontSize: 12,
                                color: RAIL_MUTED,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {counts[countKey].toLocaleString("en-GB")}
                            </span>
                          ) : null}
                          {badge ? (
                            <span className="lp-sb-badge" style={badgeStyle(badgeTone)}>
                              {badge}
                            </span>
                          ) : null}
                          <PendingDot />
                        </span>
                      </Link>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/** The two badge tones, shared by an item and by a shut group's roll-up so the
 *  number does not change colour when the disclosure closes over it. */
function badgeStyle(tone: "good" | "alert" = "good"): React.CSSProperties {
  return {
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: 11.5,
    color: "#fff",
    background: tone === "alert" ? "#b3261e" : "#0b6b40",
    padding: "1px 7px",
    borderRadius: 20,
    flexShrink: 0,
    fontVariantNumeric: "tabular-nums",
  };
}
