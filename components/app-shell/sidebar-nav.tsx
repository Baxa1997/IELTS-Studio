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

/**
 * The primary navigation. Students get a deliberately minimal menu; staff get
 * the console set. Active state by pathname. Client component — it needs
 * `usePathname` and holds the icons (which can't cross the server→client
 * boundary), so the server shell passes only the role string.
 *
 * Labels/section titles/badges carry `lp-sb-*` classes so the shell can collapse the
 * rail to an icon-only strip purely in CSS (no prop drilling of a collapsed flag).
 *
 * ── WHAT CHANGED, AND WHY IT LOOKS SO DIFFERENT ─────────────────────────────
 * The rail was rebuilt to the Base44 reference the owner supplied: warm paper
 * instead of white, MONOCHROME icons instead of eleven tinted chips, and — the
 * structural part — every titled section is now a COLLAPSIBLE GROUP: one row
 * with an icon, a label and a chevron, its items nested underneath and animated
 * open and shut.
 *
 * The tinted chips are gone on purpose and the argument for them is worth
 * keeping, because it was a good one: a hue per destination is a landmark, so
 * the eye finds "Marking" by its red rather than by reading four labels. What
 * killed it is the group structure on top of it — a rail of eleven colours AND
 * four disclosure rows has two competing systems for "what kind of thing is
 * this", and the reference resolves that by letting the STRUCTURE speak and the
 * colour stay quiet. The one thing still allowed to be loud is where you are.
 */

/* ── the rail palette (Base44) ────────────────────────────────────────────────
   Warm greys, near-black ink, no hue anywhere in the list. Every value here is
   for a WHITE surface (RAIL_BG in shell.tsx) — nothing here may be
   reused on a dark one. The rail no longer HAS a dark surface: the profile card
   at its foot went light with everything else. */
const RAIL_TEXT = "#3f3d39"; // resting item text
const RAIL_MUTED = "#8b8883"; // counts / disabled / secondary
/** The active row: a warm grey pill with near-black ink. Base44 says "you are
 *  here" with a fill one step darker than the rail and no colour at all, which
 *  is why it survives the icons going monochrome — the fill was never the thing
 *  carrying the message, the contrast was. */
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
  /**
   * Other routes this item OWNS for the purpose of the active highlight.
   *
   * Timetable and Attendance are one rail item and two tabs, so standing on
   * /console/attendance has to light up Timetable — otherwise the tab strip says
   * "you are in Attendance" while the rail says you are nowhere, which is worse
   * than the two separate items it replaced.
   */
  alsoMatches?: string[];
  /**
   * The one row in the rail that is not a place.
   *
   * Everything else takes you somewhere; the Assistant DOES something, and it is
   * the only animated row in the product — a slow breath on the icon, because it
   * is the one item whose whole proposition is that something is listening.
   *
   * `generate` (Practice AI) keeps the marker so the two can be told apart in
   * CSS, but with the chips gone it is no longer tinted: inside a collapsible
   * "Practice" group it is already the first row under the heading, which is the
   * position the tint was buying.
   */
  accent?: "assistant" | "generate";
};

/**
 * A run of the rail.
 *
 * A TITLE NOW MEANS A COLLAPSIBLE GROUP, not a heading. It used to render as a
 * 10px uppercase label with the items loose underneath; it now renders as a real
 * row — icon, label, chevron — that opens and shuts, with the items nested and
 * indented under it. `icon` is therefore required wherever `title` is set, and
 * an untitled section stays exactly what it was: a bare stack of top-level rows.
 */
type Section = { title?: string; icon?: LucideIcon; items: Item[] };

/**
 * Which rail item the current path belongs to.
 *
 * Exported and pure so it can be tested: it decides the single most visible
 * piece of state in the product, and it has two rules that are easy to break by
 * accident.
 *
 *  - LONGEST MATCH WINS, so /console/finance/payroll lights up Salary rather
 *    than Finance, which it also sits under.
 *  - An item's `alsoMatches` routes are measured at THEIR OWN length, not the
 *    item's. Timetable's href is /console/calendar but it also owns
 *    /console/attendance; scoring that by the item's href would let any longer
 *    unrelated href outrank it.
 */
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
      /* Not gated on having applied. A programme nobody can find is a programme
         nobody uses, and the page itself is what explains what it is — hiding it
         until you already know about it gets the order backwards. */
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

/* Center staff. "Dashboard", not "Console" and not "Today" — it is the same
   word the learner side uses for the same idea, and one product should not have
   two names for "where I land". Nobody outside this codebase knows what a
   console is, and "Today" read like a filter rather than a place.
   Cohort and Review are deliberately absent: both are parked features (see
   CLAUDE.md) and they made the menu read like an unfinished admin tool. Add the
   line back to restore either. */
const ADMIN: Section[] = [
  /* The two rows that are never nested.
     Assistant and Dashboard stay at the top level because they are where you
     land and what you ask — an extra click to reach either is a click paid on
     every visit. Everything else earns its group. */
  {
    items: [
      { label: "Assistant", href: "/console/assistant", icon: Bot, accent: "assistant" },
      { label: "Dashboard", href: "/console", icon: LayoutDashboard },
    ],
  },
  /* The centre itself — its people and its week. One group, because an owner
     opens it with a single question ("who is in what, and when") and then works
     inside it for a while. */
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
  /* Money is the owner's alone — a teacher's rail has no Finance group, and
     the pages redirect as well, because a rail is a hint and RLS is the gate.
     The one exception is /console/finance/payroll, which a teacher reaches from
     Teaching → My pay and which shows them exactly one payslip: their own. */
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
  /* Learning, not "Insight" — and Announcements is out of it. A broadcast is
     not an insight; putting it here is what made the group a drawer for
     anything that wasn't people or money. */
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
  /* Announcements, Billing & plan and Settings are NOT here. They moved under
     the avatar (see accountItemsFor in shell.tsx): all three are things you go
     and do occasionally and then leave alone. */
];

/* The front desk. Runs classes and people, takes tuition, and never sees what
   the center is worth or what staff are paid — so there is no Money group,
   no Billing and no Settings. "Take payment" is a purpose-built screen rather
   than the owner's Finance page with parts hidden: a redacted page still shows
   its own shape, and one wrong condition leaks a balance. */
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
      { label: "Dashboard", href: "/console", icon: LayoutDashboard },
    ],
  },
  /* THE GROUP THE OWNER ASKED FOR, IN THE ORDER THEY NAMED IT.
     Groups, Students, Calendar and My pay were four loose rows under no heading
     at all; they are one disclosure now. My pay belongs with them rather than in
     a Money group of its own — a teacher has no finances, they have a payslip,
     and a one-item group is a heading spent on nothing. */
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
  /* A teacher's practice IS the learner's practice — the same /write, /read and
     /listen screens a student uses, not a console copy of them. The only staff
     addition lives on those pages: "attach to a group", which publishes the
     content and sets it as homework in one step (see assignPractice). There is
     no separate console library in the menu because previewing a prompt should
     mean doing exactly what the student will do. */
  {
    title: "Practice",
    icon: Layers,
    items: [
      // First in the group: it is the only one a teacher MAKES rather than
      // sits, and it is the reason they open this rail on a planning day.
      {
        label: "Practice AI",
        href: "/console/practice-ai",
        icon: WandSparkles,
        accent: "generate",
      },
      { label: "Writing", href: "/write", icon: SquarePen },
      { label: "Reading", href: "/read", icon: BookOpen },
      { label: "Listening", href: "/listen", icon: Headphones },
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

/**
 * The platform rail, in the two halves the Super Admin design names.
 *
 * PLATFORM is the tenants themselves — who exists and what they are doing.
 * OPERATIONS is running the business behind them: what it earns, what needs
 * policing, and whether the machinery is up. They are separated because a super
 * admin arrives with one of those two questions and never both at once.
 *
 * Overview is lifted OUT of Platform and left at the top level, for the same
 * reason Dashboard is on every other rail: it is where you land, and a landing
 * page behind a disclosure is a click paid on every visit.
 */
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
 *
 * ⚠️ Reports now lives inside a collapsible group, so the badge can be behind a
 * shut disclosure. That is what `groupBadge` (below) is for: a closed group
 * carries the sum of its children's alerts on its own row, so nothing that was
 * visible before the rebuild can hide behind it.
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

/**
 * The square behind every glyph.
 *
 * IT HAS NO FILL ANY MORE — it is a positioning box, not a chip. It stays in the
 * markup (rather than the icon sitting bare in the row) because the COLLAPSED
 * rail is built on it: globals.css grows it from 26px to a 36px standalone tile
 * and paints the active one, which is the only way a 72px icon strip can show
 * "you are here" with no label to put a pill behind. Deleting this span is how
 * the collapsed rail loses its highlight — see collapsed-rail.test.ts.
 */
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
 * Instant click feedback. Rendered INSIDE the <Link>, so it reads that link's
 * navigation state: the moment it's clicked, `pending` flips true and a spinner
 * shows — before the (dynamic) route has even committed.
 */
function PendingDot() {
  const { pending } = useLinkStatus();
  return pending ? <span className="lp-nav-spin" aria-hidden /> : null;
}

/* Padding rather than a fixed height: the row is as tall as its 26px glyph box
   plus 8px of air either side, so the glyph is what sets the rhythm. A height
   here would fight it the moment the box resizes in the collapsed rail. */
const itemBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 9px",
  borderRadius: 9,
  fontFamily: SANS,
  fontSize: 14.5,
  textDecoration: "none",
  whiteSpace: "nowrap",
  border: "1px solid transparent",
};

/**
 * Expensive reporting and admin routes should not be prefetched for every visible
 * rail item. Normal learning and dashboard routes keep Next's default prefetch,
 * which makes intentional menu navigation feel immediate.
 */
function shouldPrefetch(href: string): boolean {
  return !(
    href.startsWith("/admin") ||
    href.startsWith("/console/finance") ||
    href.startsWith("/console/reports") ||
    href.startsWith("/console/marking") ||
    href.startsWith("/console/practice-ai")
  );
}

/**
 * Join class names.
 *
 * ⚠️ THIS EXISTS BECAUSE OF PRETTIER, and the bug it prevents is invisible.
 *
 * These class lists used to be template literals — `` `lp-sb-sub${flat ? " lp-sb-sub--flat" : ""}` ``
 * — where the SPACE INSIDE THE STRING LITERAL is the only thing separating two
 * class names. `prettier --write` removes it. The result compiles, type-checks,
 * renders, and passes every test: it just concatenates into one token
 * (`lp-sb-sublp-sb-sub--flat`) that matches no rule, so BOTH the base class and
 * the modifier silently stop applying.
 *
 * It has now happened three times in this folder — it is what put a 21px indent
 * and a guide line under Assistant and Dashboard, and what quietly switched off
 * the collapsed rail's active tile and the Assistant's animation. Building the
 * list from arguments puts the separator in code rather than in a string, where
 * no formatter can reach it. `fills-surface.test.ts` guards the one remaining
 * literal of this shape in shell.tsx.
 */
function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ── where "which groups are open" is remembered ──────────────────────────────
   Per browser, like the rail's own collapse: it is a preference about this
   screen, not about the account, and it must not cost a round trip to read.

   ⚠️ IT IS READ THROUGH `useSyncExternalStore`, NOT IN AN EFFECT, and the
   difference matters twice over. localStorage cannot be read during render —
   the server has none, so the first client paint would disagree with the
   server's HTML and React would throw a hydration mismatch over the single most
   visible component in the app. Reading it in an effect instead fixes the
   mismatch but sets state on the first commit, which is a cascading render on
   every page in the product (and the lint rule that catches it). This hook is
   the answer to exactly that shape: `getServerSnapshot` returns the empty
   preference the server rendered, and the stored value arrives afterwards
   without a render of our own.

   The snapshot is the RAW STRING rather than a parsed object on purpose —
   `getSnapshot` is called on every render and must return something React can
   compare with `Object.is`. A fresh `JSON.parse` is a new object every time and
   would loop forever. */
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

/**
 * What a SHUT group has to keep saying out loud.
 *
 * A badge inside a closed disclosure is a badge nobody sees, and two of the
 * rail's badges are the ones the product exists to surface: unfinished homework
 * and unopened marking. So a closed group carries the sum of its children's
 * badges on its own row, and the tone escalates — one `alert` child makes the
 * whole roll-up an alert, because "someone is waiting on you" outranks "here is
 * your list".
 */
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

  /* ── which groups are open ───────────────────────────────────────────────
     TWO SOURCES, MERGED, and they are separate because they answer different
     questions. `stored` is the preference this browser has carried across
     sessions; `session` is what has happened since this rail mounted — a
     chevron pressed, or a group opened automatically because you navigated into
     it. A missing entry in both means OPEN: the rail should show everything it
     has until somebody says otherwise. */
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

  /* Navigating INTO a shut group opens it — otherwise you land on a page whose
     rail shows nothing lit, which is the "you are nowhere" failure the active
     highlight exists to prevent. Adjusted during render (the same pattern the
     shell uses for its own collapse) so the group is never painted shut for a
     frame and then yanked open.

     It opens the group ONCE, on arrival, rather than forcing it open while you
     are inside it — a disclosure you cannot close is not a disclosure. */
  const [lastActiveGroup, setLastActiveGroup] = useState(activeGroup);
  if (activeGroup !== lastActiveGroup) {
    setLastActiveGroup(activeGroup);
    if (activeGroup) setSession((prev) => ({ ...prev, [activeGroup]: true }));
  }

  const isOpen = (title: string) => openGroups[title] ?? true;
  const toggleGroup = (title: string) => {
    const next = { ...openGroups, [title]: !isOpen(title) };
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
              /* ── a disclosure, and ONLY a disclosure ───────────────────────
                 Press it, the group unfolds; press it again, it folds. It does
                 not navigate.

                 It briefly did — pressing a shut group took you to the first
                 page inside it — and the owner had it removed after using it.
                 The reason is worth keeping: a row that both moves you and
                 changes shape is two outcomes behind one press, and which one
                 you get depends on state you have to look at the chevron to
                 know. Opening a menu should never be able to take you somewhere.
                 The destinations are the rows inside; this is the lid.

                 A <button>, therefore, and not a <Link> — there is no href to
                 middle-click or open in a new tab, and making it an anchor that
                 goes nowhere would be a lie to the browser and to a screen
                 reader both. */
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
                  /* ⚠️ NO `background` HERE, not even "transparent". A <button>
                     needs its UA background cleared, and the obvious way to do
                     that is inline — which beats `.lp-sb-item:hover` in
                     globals.css whatever its specificity, so the row silently
                     loses its hover. The reset lives in `.lp-sb-grouprow`
                     instead, beside the hover it must not cancel. */
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
            {/* THE ANIMATION IS A GRID ROW, not a max-height.
                `grid-template-rows: 0fr → 1fr` tweens to the content's OWN
                height, so a four-item group and a six-item group take the same
                time and neither one snaps at the end. A max-height has to be
                guessed at: too small clips the last row, too large spends most
                of the transition animating empty space, which is what makes
                accordions feel slow. */}
            <div
              id={panelId}
              className={cx("lp-sb-sub", !section.title && "lp-sb-sub--flat")}
              data-open={open ? "1" : "0"}
              aria-hidden={section.title && !open ? true : undefined}
            >
              <div className="lp-sb-sub-inner">
                {/* The flyout's heading. Hidden at every rail width except the
                    collapsed one, where this panel is no longer an indented list
                    under a labelled row but a card floating beside a bare icon —
                    and a list of four links with nothing naming it is a menu you
                    have to recognise by its contents. */}
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
