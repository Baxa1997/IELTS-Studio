"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useT } from "@/components/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n";
import { SANS, WELL, WHITE } from "@/lib/theme/tokens";
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
  Settings,
} from "lucide-react";

const RAIL_TEXT = "var(--sh-rail-text)"; // resting item text
const RAIL_MUTED = "var(--sh-rail-muted)"; // counts / disabled / secondary
/* "You are here": a light tint of the brand orange #dc5426, with a deeper orange
   for the text and icon. The tint is 12% of #dc5426 over white; the ink is
   4.98:1 on it — #dc5426 itself only reaches 3.4:1, too faint for a label.
   Mirrored in globals.css for the collapsed rail's active tile and flyout row. */
const RAIL_ACTIVE_BG = "var(--sh-rail-active-bg)";
const RAIL_ACTIVE_INK = "var(--sh-rail-active-ink)";
/** Sections are plain stacks — the rail is one surface and the gap between
 *  groups is the only separator. */
const TRAY: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

type Item = {
  /** The English text. Kept as the fallback, and as what appears when a key is
   *  missing — see `labelKey`. */
  label: string;
  /**
   * The dictionary key this row's text comes from.
   *
   * Optional so a new row can be added without a translation and still render.
   * It is a SEPARATE FIELD rather than `label` simply becoming a key because
   * `label` is still the fallback: a row whose key nobody has translated shows
   * English, not `nav.whatever`.
   */
  labelKey?: MessageKey;
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

type Section = {
  /**
   * ⚠️ ALSO THE SECTION'S IDENTITY, WHICH IS WHY IT IS NOT TRANSLATED IN PLACE.
   * This string keys the open/closed map (`openGroups`), builds the `panelId`
   * for `aria-controls`, and is compared against `activeGroup`. Translate it
   * here and a learner who switches language finds every group has forgotten
   * whether it was open, because the keys no longer match. The DISPLAY sites
   * read `titleKey` through `t()` instead; this stays English forever.
   */
  title?: string;
  /** The dictionary key for the heading a reader sees. */
  titleKey?: MessageKey;
  icon?: LucideIcon;
  items: Item[];
  /** Pinned to the foot of the rail, below every other section — Settings. */
  pinned?: boolean;
};

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
      { label: "Dashboard", labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Study plan", labelKey: "nav.studyPlan", href: "/plan", icon: Target },
      { label: "Activities", labelKey: "nav.activities", href: "/activities", icon: History },
      { label: "Referrals", labelKey: "nav.referrals", href: "/referrals", icon: Gift },
    ],
  },
  {
    title: "Practices",
    titleKey: "nav.section.practices",
    icon: Layers,
    items: [
      { label: "Writing", labelKey: "nav.writing", href: "/write", icon: SquarePen },
      { label: "Reading", labelKey: "nav.reading", href: "/read", icon: BookOpen },
      { label: "Listening", labelKey: "nav.listening", href: "/listen", icon: Headphones },
      { label: "Speaking", labelKey: "nav.speaking", href: "/speak", icon: Mic },
      { label: "CEFR practice", labelKey: "nav.cefr", href: "/cefr", icon: GraduationCap },
      { label: "Vocabulary", labelKey: "nav.vocabulary", href: "/vocabulary", icon: BookA },
    ],
  },
];

const ADMIN: Section[] = [
  {
    items: [
      {
        label: "Assistant",
        labelKey: "nav.assistant",
        href: "/console/assistant",
        icon: Bot,
        accent: "assistant",
      },
      { label: "Dashboard", labelKey: "nav.dashboard", href: "/console", icon: LayoutDashboard },
    ],
  },
  {
    title: "Centre",
    titleKey: "nav.section.centre",
    icon: Users,
    items: [
      {
        label: "Groups",
        labelKey: "nav.groups",
        href: "/console/groups",
        icon: Users,
        countKey: "groups",
      },
      {
        label: "Students",
        labelKey: "nav.students",
        href: "/console/students",
        icon: UserRound,
        countKey: "students",
      },
      {
        label: "Teachers",
        labelKey: "nav.teachers",
        href: "/console/teachers",
        icon: GraduationCap,
        countKey: "teachers",
      },
      {
        label: "Calendar",
        labelKey: "nav.calendar",
        href: "/console/calendar",
        icon: CalendarRange,
        // Attendance is this item's other tab — see ScheduleTabs.
        alsoMatches: ["/console/attendance"],
      },
    ],
  },

  {
    title: "Money",
    titleKey: "nav.section.money",
    icon: Wallet,
    items: [
      { label: "Finance", labelKey: "nav.finance", href: "/console/finance", icon: Wallet },
      {
        label: "Invoices",
        labelKey: "nav.invoices",
        href: "/console/finance/invoices",
        icon: Receipt,
      },
      // "Salary", not "Payroll": one word for the whole thing. The separate
      // Salary-rules builder is gone — a class carries the teacher's rate
      // beside the student's fee, which is where an owner looks for it.
      { label: "Salary", labelKey: "nav.salary", href: "/console/finance/payroll", icon: Banknote },
    ],
  },

  {
    title: "Learning",
    titleKey: "nav.section.learning",
    icon: School,
    items: [
      // Practice → Marking → Results is the actual order of the work: it gets
      // set, it comes back, it gets marked, and then it means something.
      {
        label: "Practices",
        labelKey: "nav.practices",
        href: "/console/practice",
        icon: ClipboardList,
      },
      {
        label: "Marking",
        labelKey: "nav.marking",
        href: "/console/marking",
        icon: SquarePen,
        countKey: "marking",
      },
      {
        label: "Results",
        labelKey: "nav.results",
        href: "/console/reports",
        icon: ChartNoAxesColumn,
      },
    ],
  },
];

const ADMINISTRATOR: Section[] = [
  {
    items: [
      {
        label: "Assistant",
        labelKey: "nav.assistant",
        href: "/console/assistant",
        icon: Bot,
        accent: "assistant",
      },
      { label: "Dashboard", labelKey: "nav.dashboard", href: "/console", icon: LayoutDashboard },
    ],
  },
  {
    title: "Centre",
    titleKey: "nav.section.centre",
    icon: Users,
    items: [
      {
        label: "Groups",
        labelKey: "nav.groups",
        href: "/console/groups",
        icon: Users,
        countKey: "groups",
      },
      {
        label: "Students",
        labelKey: "nav.students",
        href: "/console/students",
        icon: UserRound,
        countKey: "students",
      },
      {
        label: "Teachers",
        labelKey: "nav.teachers",
        href: "/console/teachers",
        icon: GraduationCap,
        countKey: "teachers",
      },
      {
        label: "Calendar",
        labelKey: "nav.calendar",
        href: "/console/calendar",
        icon: CalendarRange,
        // Attendance is this item's other tab — see ScheduleTabs.
        alsoMatches: ["/console/attendance"],
      },
      {
        label: "Take payment",
        labelKey: "nav.takePayment",
        href: "/console/payments",
        icon: Wallet,
      },
    ],
  },
  {
    title: "Learning",
    titleKey: "nav.section.learning",
    icon: School,
    items: [
      // Practice → Marking → Results is the actual order of the work: it gets
      // set, it comes back, it gets marked, and then it means something.
      {
        label: "Practice",
        labelKey: "nav.practice",
        href: "/console/practice",
        icon: ClipboardList,
      },
      {
        label: "Marking",
        labelKey: "nav.marking",
        href: "/console/marking",
        icon: SquarePen,
        countKey: "marking",
      },
      {
        label: "Results",
        labelKey: "nav.results",
        href: "/console/reports",
        icon: ChartNoAxesColumn,
      },
    ],
  },
  // Announcements lives under the avatar — see accountItemsFor.
];

const TEACHER: Section[] = [
  {
    items: [
      {
        label: "Assistant AI",
        labelKey: "nav.assistantAi",
        href: "/console/assistant",
        icon: Bot,
        accent: "assistant",
      },
      {
        label: "Practice English with AI",
        labelKey: "nav.practiceWithAi",
        href: "/console/practice-ai",
        icon: WandSparkles,
        accent: "generate",
      },
      { label: "Dashboard", labelKey: "nav.dashboard", href: "/console", icon: LayoutDashboard },
    ],
  },

  {
    title: "Practices",
    titleKey: "nav.section.practices",
    icon: Layers,
    items: [
      { label: "Writing", labelKey: "nav.writing", href: "/write", icon: SquarePen },
      { label: "Reading", labelKey: "nav.reading", href: "/read", icon: BookOpen },
      { label: "Listening", labelKey: "nav.listening", href: "/listen", icon: Headphones },
    ],
  },

  {
    title: "Teaching",
    titleKey: "nav.section.teaching",
    icon: Users,
    items: [
      {
        label: "Groups",
        labelKey: "nav.groups",
        href: "/console/groups",
        icon: Users,
        countKey: "groups",
      },
      {
        label: "Students",
        labelKey: "nav.students",
        href: "/console/students",
        icon: UserRound,
        countKey: "students",
      },
      {
        label: "Calendar",
        labelKey: "nav.calendar",
        href: "/console/calendar",
        icon: CalendarRange,
        // Attendance is this item's other tab — see ScheduleTabs.
        alsoMatches: ["/console/attendance"],
      },
      // Their own payslip and its working — not the center's payroll.
      { label: "My pay", labelKey: "nav.myPay", href: "/console/finance/payroll", icon: Banknote },
    ],
  },

  {
    title: "Learning",
    titleKey: "nav.section.learning",
    icon: School,
    items: [
      // Practice → Marking → Results is the actual order of the work: it gets
      // set, it comes back, it gets marked, and then it means something.
      {
        label: "Practices",
        labelKey: "nav.practices",
        href: "/console/practice",
        icon: ClipboardList,
      },
      {
        label: "Marking",
        labelKey: "nav.marking",
        href: "/console/marking",
        icon: SquarePen,
        countKey: "marking",
      },
      {
        label: "Results",
        labelKey: "nav.results",
        href: "/console/reports",
        icon: ChartNoAxesColumn,
      },
    ],
  },
  // Announcements is under the avatar (accountItemsFor), still scoped to their
  // own groups.
];

const SUPER_ADMIN: Section[] = [
  {
    items: [{ label: "Overview", labelKey: "nav.overview", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Platform",
    titleKey: "nav.section.platform",
    icon: Building2,
    items: [
      { label: "Centers", labelKey: "nav.centers", href: "/admin/centers", icon: Building2 },
      { label: "Users", labelKey: "nav.users", href: "/admin/users", icon: Users },
      {
        label: "Plans & revenue",
        labelKey: "nav.plansRevenue",
        href: "/admin/plans",
        icon: CreditCard,
      },
      /* Approval is the only gate on the referral programme, so the queue has to
         be somewhere a super admin passes, not somewhere they remember. */
      { label: "Referrals", labelKey: "nav.referrals", href: "/admin/referrals", icon: Gift },
    ],
  },
  {
    title: "Operations",
    titleKey: "nav.section.operations",
    icon: Activity,
    items: [
      {
        label: "Moderation",
        labelKey: "nav.moderation",
        href: "/admin/moderation",
        icon: ShieldAlert,
      },
      {
        label: "System health",
        labelKey: "nav.systemHealth",
        href: "/admin/health",
        icon: Activity,
      },
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
        labelKey: "nav.assignments",
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
      titleKey: "nav.section.practice",
      icon: Layers,
      items: [
        { label: "Writing", labelKey: "nav.writing", href: "/write", icon: SquarePen },
        { label: "Reading", labelKey: "nav.reading", href: "/read", icon: BookOpen },
        { label: "Listening", labelKey: "nav.listening", href: "/listen", icon: Headphones },
        { label: "Speaking", labelKey: "nav.speaking", href: "/speak", icon: Mic },
        { label: "Vocabulary", labelKey: "nav.vocabulary", href: "/vocabulary", icon: BookA },
      ],
    },
    {
      title: "You",
      titleKey: "nav.section.you",
      icon: Award,
      items: [
        { label: "Certificates", labelKey: "nav.certificates", href: "/certificates", icon: Award },
      ],
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

/**
 * The spinner beside a row while its page loads — and the signal that ends the
 * row's optimistic highlight. `onSettle` fires when a navigation stops being
 * pending. The pathname alone cannot end it: a click that redirects straight
 * back to the page you were on leaves the pathname unchanged, and the row you
 * pressed would stay lit.
 */
function PendingDot({ onSettle }: { onSettle: () => void }) {
  const { pending } = useLinkStatus();
  const wasPending = useRef(false);
  useEffect(() => {
    if (pending) {
      wasPending.current = true;
    } else if (wasPending.current) {
      wasPending.current = false;
      onSettle();
    }
  }, [pending, onSettle]);
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

/**
 * Which rows are rendered in full while the pointer rests on them.
 *
 * ⚠️ `experimental.dynamicOnHover` in next.config is not enough by itself: Next
 * upgrades a hover to a full prefetch only when the link ALSO carries
 * `unstable_dynamicOnHover`. This rail never passed it, so a hover fetched the
 * loading skeleton alone and every click still waited on a whole server render.
 *
 * The heavy screens below are still not rendered on hover — sweeping the pointer
 * down the rail should not run payroll and report queries. But they are no
 * longer `prefetch={false}`, which also skipped their loading boundary: a click
 * on Finance showed nothing at all until the server answered. The default
 * prefetch fetches just that skeleton, which is cheap and is what lets the click
 * paint at once.
 */
function renderOnHover(href: string): boolean {
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

/**
 * Where this person's settings live, or null when they have none.
 *
 * Staff share the console's settings (which sections each role sees is decided
 * in console/settings/section-list.ts); a solo learner has their own. A center
 * student has none — their center runs their account — and neither does the
 * platform owner.
 */
export function settingsHrefFor(role: string, homeworkOnly: boolean): string | null {
  if (role === "center_admin" || role === "administrator" || role === "teacher") {
    return "/console/settings";
  }
  if (role === "student" && !homeworkOnly) return "/settings";
  return null;
}

/**
 * The rail with Settings pinned at its foot, for anyone who has settings. It is a
 * flat section like Assistant and Dashboard, so it gets the same row, the same
 * active highlight and the same collapsed tile — only its position differs.
 */
function withSettings(sections: Section[], role: string, homeworkOnly: boolean): Section[] {
  const href = settingsHrefFor(role, homeworkOnly);
  if (!href) return sections;
  return [
    ...sections,
    {
      pinned: true,
      items: [{ label: "Settings", labelKey: "nav.settings", href, icon: Settings }],
    },
  ];
}

/**
 * A section heading as the reader sees it.
 *
 * Separate from `section.title`, which stays English because it is also the
 * section's identity — see the note on `Section.title`.
 */
function sectionHeading(
  section: Pick<Section, "title" | "titleKey">,
  t: (k: MessageKey) => string,
): string | undefined {
  return section.titleKey ? t(section.titleKey) : section.title;
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
  const t = useT();
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
  const sections = withSettings(
    sectionsFor(role, showAssignments, pendingCount, homeworkOnly, counts?.newWork ?? 0),
    role,
    homeworkOnly,
  );
  const all = sections.flatMap((s) => s.items);
  const activeHref = resolveActiveHref(all, pathname);

  /* The row just pressed, lit before its page arrives — the URL only changes once
     the server has answered, so a highlight that followed it made every click look
     ignored for the whole round trip. Remembered WITH the page it was pressed from
     and dropped the moment the pathname moves on (the same adjust-during-render
     pattern as `lastActiveGroup` below), so pressing BACK later cannot revive it.
     `PendingDot` drops it for a navigation that lands where it started. */
  const [pressed, setPressed] = useState<{ href: string; from: string } | null>(null);
  if (pressed && pressed.from !== pathname) setPressed(null);
  const shownHref = pressed && pressed.from === pathname ? pressed.href : activeHref;
  const settle = useCallback(() => setPressed(null), []);

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

  /** Which collapsed flyout has been clicked through and should stay shut until
   *  the pointer leaves it. See the note on `data-dismissed` below. */
  const [dismissed, setDismissed] = useState<string | number | null>(null);

  const toggleGroup = (title: string) => {
    const next = isOpen(title)
      ? { ...openGroups, [title]: false }
      : exclusivelyFor(sections, title);
    setSession(next);
    writeOpenGroups(next);
  };

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: "100%" }}>
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
            /* ⚠️ DISMISSING A HOVER MENU YOU JUST CLICKED THROUGH. When the rail
               is collapsed this section's children are a flyout card, opened by
               `:hover` and `:focus-within` (globals.css). Click a row in it and
               both are still true a moment later — the pointer has not moved and
               the link you pressed now holds focus — so the card stayed open
               over the page you had just navigated to, which is what it was
               reported as.

               CSS alone cannot express "open on hover, but not after a click",
               so the click marks the section and the marker is what the
               stylesheet hides on. It clears when the pointer actually leaves,
               which is the moment the next hover should be allowed to open it
               again. Blurring is the other half: `:focus-within` would hold the
               card open by itself, and a link keeps focus after a client-side
               navigation. Harmless while expanded — the rule that reads this is
               scoped to the collapsed rail. */
            data-dismissed={dismissed === (section.title ?? si) ? "1" : undefined}
            onPointerLeave={() => setDismissed(null)}
            onClickCapture={(e) => {
              if (!(e.target instanceof Element)) return;
              // The group's own row TOGGLES the card; only a link inside it is
              // a navigation worth dismissing for.
              if (!e.target.closest(".lp-sb-sub")) return;
              const link = e.target.closest("a");
              if (!link) return;
              (link as HTMLElement).blur();
              setDismissed(section.title ?? si);
            }}
            /* `marginTop: auto` inside a column at least as tall as the rail is
               what pushes a pinned section to the foot, however short the list. */
            style={section.pinned ? { ...TRAY, marginTop: "auto", paddingTop: 12 } : TRAY}
          >
            {section.title && GroupIcon ? (
              <button
                type="button"
                onClick={() => toggleGroup(section.title as string)}
                aria-expanded={open}
                aria-controls={panelId}
                data-label={sectionHeading(section, t)}
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
                  <span className="lp-sb-label">{sectionHeading(section, t)}</span>
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
                {section.title ? (
                  <div className="lp-sb-flyout-title">{sectionHeading(section, t)}</div>
                ) : null}
                {section.items.map(
                  ({
                    label,
                    labelKey,
                    href,
                    icon: Icon,
                    soon,
                    badge,
                    badgeTone,
                    countKey,
                    accent,
                  }) => {
                    // Every place this row's words are READ: the visible span,
                    // the screen-reader name, and `data-label`, which the
                    // collapsed rail renders through `content: attr(data-label)`
                    // in globals.css. The `key` below is deliberately NOT this —
                    // a key has to be stable across a language change.
                    const text = labelKey ? t(labelKey) : label;
                    if (soon) {
                      return (
                        <span
                          key={href}
                          data-label={text}
                          aria-label={text}
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
                            <span className="lp-sb-label">{text}</span>
                          </span>
                          <span
                            className="lp-sb-soon-badge"
                            style={{
                              fontFamily: SANS,
                              fontWeight: 700,
                              fontSize: 10,
                              letterSpacing: ".05em",
                              color: RAIL_MUTED,
                              background: WELL,
                              padding: "2px 7px",
                              borderRadius: 6,
                            }}
                          >
                            SOON
                          </span>
                        </span>
                      );
                    }
                    const selected = href === shownHref;
                    return (
                      <Link
                        key={href}
                        href={href}
                        /* Spread, not an attribute: the App Router's Link reads this
                           (next/dist/client/app-dir/link.d.ts), but `next/link`'s
                           types point at the Pages Router Link, which lacks it. */
                        {...({ unstable_dynamicOnHover: renderOnHover(href) } as object)}
                        onClick={(e) => {
                          // A modified click opens another tab; this one stays put.
                          if (e.defaultPrevented || e.button !== 0) return;
                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                          setPressed({ href, from: pathname });
                        }}
                        data-label={text}
                        aria-label={text}
                        // The truth, not the optimistic look: the page you are on.
                        aria-current={href === activeHref ? "page" : undefined}
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
                          accent && "lp-sb-airow",
                          accent === "assistant" && "lp-sb-airow--assistant",
                          accent === "generate" && "lp-sb-airow--generate",
                          selected && accent && "lp-sb-accent-active",
                        )}
                        style={{
                          ...itemBase,
                          justifyContent: "space-between",
                          fontWeight: selected ? 600 : 400,
                          // AI rows too: only their icon tile is coloured
                          // (`.lp-sb-airow .lp-sb-chip` in globals.css).
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
                          <span className="lp-sb-label">{text}</span>
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
                          <PendingDot onSettle={settle} />
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
    color: WHITE,
    background: tone === "alert" ? "#b3261e" : "#0b6b40",
    padding: "1px 7px",
    borderRadius: 20,
    flexShrink: 0,
    fontVariantNumeric: "tabular-nums",
  };
}
