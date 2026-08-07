"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  BookA,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Headphones,
  History,
  LayoutDashboard,
  Mic,
  SquarePen,
  Target,
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

const ADMIN: Section[] = [
  {
    items: [
      { label: "Console", href: "/console", icon: LayoutDashboard },
      { label: "Groups", href: "/console/groups", icon: Users },
      { label: "Cohort", href: "/console/cohort", icon: Users },
      { label: "Review", href: "/console/review", icon: ClipboardCheck },
      { label: "Billing", href: "/console/billing", icon: CreditCard },
    ],
  },
];

const TEACHER: Section[] = [
  {
    items: [
      { label: "Console", href: "/console", icon: LayoutDashboard },
      { label: "Groups", href: "/console/groups", icon: Users },
      { label: "Review", href: "/console/review", icon: ClipboardCheck },
    ],
  },
];

/** Only students who actually belong to a center group get an Assignments link —
 *  a solo B2C learner has nothing to put behind it. */
function sectionsFor(role: string, showAssignments: boolean): Section[] {
  if (role !== "student") return role === "center_admin" ? ADMIN : TEACHER;
  if (!showAssignments) return STUDENT;
  const [home, ...rest] = STUDENT;
  return [
    {
      ...home,
      items: [
        home.items[0],
        { label: "Assignments", href: "/assignments", icon: ClipboardCheck },
        ...home.items.slice(1),
      ],
    },
    ...rest,
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
}: {
  role: string;
  showAssignments?: boolean;
}) {
  const pathname = usePathname();
  const sections = sectionsFor(role, showAssignments);
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
            {section.items.map(({ label, href, icon: Icon, soon, badge }) => {
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
