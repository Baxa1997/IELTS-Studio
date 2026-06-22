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
 * menu; staff get the console set. Active state by pathname. Client component —
 * it needs `usePathname` and holds the icons (which can't cross the server→client
 * boundary), so the server shell passes only the role string.
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INDIGO = "#3B43B5";

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  soon?: boolean;
};

const STUDENT: Item[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Plan", href: "/plan", icon: Target },
  { label: "Activities", href: "/activities", icon: LayoutGrid },
  { label: "Writing", href: "/write", icon: PenLine },
  { label: "Reading", href: "/read", icon: BookOpen },
  { label: "CEFR practice", href: "/cefr", icon: Languages },
  { label: "Vocabulary", href: "/vocabulary", icon: BookMarked },
  { label: "Speaking", href: "#", icon: Mic, soon: true },
  { label: "Listening", href: "#", icon: Headphones, soon: true },
];

const ADMIN: Item[] = [
  { label: "Console", href: "/console", icon: LayoutDashboard },
  { label: "Cohort", href: "/console/cohort", icon: Users },
  { label: "Review", href: "/console/review", icon: ClipboardCheck },
  { label: "Billing", href: "/console/billing", icon: CreditCard },
];

const TEACHER: Item[] = [
  { label: "Console", href: "/console", icon: LayoutDashboard },
  { label: "Review", href: "/console/review", icon: ClipboardCheck },
];

function itemsFor(role: string): Item[] {
  if (role === "student") return STUDENT;
  if (role === "center_admin") return ADMIN;
  return TEACHER;
}

/**
 * Instant click feedback. Rendered INSIDE the <Link>, so it reads that link's
 * navigation state: the moment it's clicked, `pending` flips true and a spinner
 * shows — before the (dynamic) route has even committed. This is what makes a
 * click "feel clicked" while the server render is in flight.
 */
function PendingDot() {
  const { pending } = useLinkStatus();
  return pending ? <span className="lp-nav-spin" aria-hidden /> : null;
}

const itemBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 13,
  height: 46,
  padding: "0 14px",
  borderRadius: 11,
  fontFamily: SANS,
  fontSize: 15,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = itemsFor(role);
  // Single active item = the longest href the path falls under.
  const activeHref = items
    .filter((i) => !i.soon && (pathname === i.href || pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {items.map(({ label, href, icon: Icon, soon }) => {
        if (soon) {
          return (
            <span key={label} title="Coming soon" aria-disabled="true" style={{ ...itemBase, justifyContent: "space-between", color: "#A7ABBA", fontWeight: 600, cursor: "default" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <Icon size={20} strokeWidth={2} />
                {label}
              </span>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 10.5, letterSpacing: ".05em", color: "#9A8F77", background: "#ECE8DA", padding: "2px 7px", borderRadius: 6 }}>SOON</span>
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
            style={{ ...itemBase, fontWeight: active ? 700 : 600, color: active ? INDIGO : "#5A6076", background: active ? "#fff" : "transparent", border: active ? "1px solid #EFEDE2" : "1px solid transparent", boxShadow: active ? "0 4px 14px -8px rgba(26,33,56,.4)" : "none" }}
          >
            <Icon size={20} strokeWidth={2} />
            {label}
            <span style={{ marginLeft: "auto", display: "flex" }}>
              <PendingDot />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
