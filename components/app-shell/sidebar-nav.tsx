"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  Headphones,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  Mic,
  PenLine,
  Target,
  Users,
} from "lucide-react";

/**
 * The primary navigation (Option A brand). Students get a deliberately minimal
 * menu grouped into sections; staff get the console set. Active state by pathname.
 * Client component — it needs `usePathname` and holds the icons (which can't cross
 * the server→client boundary), so the server shell passes only the role string.
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INDIGO = "#3B43B5";

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  soon?: boolean;
};
type Section = { title?: string; items: Item[] };

const STUDENT: Section[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Plan", href: "/plan", icon: Target },
      { label: "Activities", href: "/activities", icon: LayoutGrid },
    ],
  },
  {
    title: "Practice",
    items: [
      { label: "Writing", href: "/write", icon: PenLine },
      { label: "Reading", href: "/read", icon: BookOpen },
      { label: "CEFR practice", href: "/cefr", icon: Languages },
      { label: "Vocabulary", href: "/vocabulary", icon: BookMarked },
    ],
  },
  {
    title: "Coming soon",
    items: [
      { label: "Speaking", href: "#", icon: Mic, soon: true },
      { label: "Listening", href: "#", icon: Headphones, soon: true },
    ],
  },
];

const ADMIN: Section[] = [
  {
    items: [
      { label: "Console", href: "/console", icon: LayoutDashboard },
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
      { label: "Review", href: "/console/review", icon: ClipboardCheck },
    ],
  },
];

function sectionsFor(role: string): Section[] {
  if (role === "student") return STUDENT;
  if (role === "center_admin") return ADMIN;
  return TEACHER;
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
  gap: 12,
  height: 44,
  padding: "0 13px",
  borderRadius: 11,
  fontFamily: SANS,
  fontSize: 14.5,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();
  const sections = sectionsFor(role);
  const all = sections.flatMap((s) => s.items);
  // Single active item = the longest href the path falls under.
  const activeHref = all
    .filter((i) => !i.soon && (pathname === i.href || pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {sections.map((section, si) => (
        <div key={section.title ?? si}>
          {section.title ? (
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: "#A7ABBA", padding: "0 13px", margin: "0 0 7px" }}>
              {section.title}
            </div>
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {section.items.map(({ label, href, icon: Icon, soon }) => {
              if (soon) {
                return (
                  <span key={label} title="Coming soon" aria-disabled="true" style={{ ...itemBase, justifyContent: "space-between", color: "#A7ABBA", fontWeight: 600, cursor: "default" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Icon size={19} strokeWidth={2} />
                      {label}
                    </span>
                    <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 10, letterSpacing: ".05em", color: "#9097A8", background: "#EEF0F4", padding: "2px 7px", borderRadius: 6 }}>SOON</span>
                  </span>
                );
              }
              const active = href === activeHref;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={active ? undefined : "lp-sb-item"}
                  style={{ ...itemBase, fontWeight: active ? 700 : 600, color: active ? "#fff" : "#5A6076", background: active ? INDIGO : "transparent", border: active ? `1px solid ${INDIGO}` : "1px solid transparent", boxShadow: active ? "0 8px 18px -8px rgba(59,67,181,.55)" : "none" }}
                >
                  <Icon size={19} strokeWidth={2} />
                  {label}
                  <span style={{ marginLeft: "auto", display: "flex" }}>
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
