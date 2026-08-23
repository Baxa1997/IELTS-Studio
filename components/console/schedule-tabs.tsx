import Link from "next/link";

import { FAINT, HAIR, INDIGO, INK, SANS } from "@/components/console/crm-ui";

/**
 * Timetable and Attendance, as two tabs of one thing.
 *
 * They were two rail items, and that was one item too many. They are the same
 * question a day apart: the timetable says what is SUPPOSED to happen, the
 * register says what DID. Staff move between them constantly — you look at
 * Tuesday's grid, then mark Tuesday — and a rail that lists them separately
 * makes that a trip back to the menu each time.
 *
 * TABS OVER LINKS, NOT A MERGED PAGE. Each half keeps its own route, its own
 * loading boundary and its own `revalidatePath` targets; the tab strip is two
 * `<Link>`s. A single page with client-side tabs would have meant one component
 * holding both screens' state, breaking every deep link staff already have, and
 * loading the week grid to mark a register.
 *
 * Server component — no hooks. The caller passes `active` rather than reading
 * the pathname, because both pages already know which one they are.
 */
export function ScheduleTabs({ active }: { active: "timetable" | "attendance" }) {
  const tabs = [
    { id: "timetable", label: "Timetable", href: "/console/calendar" },
    { id: "attendance", label: "Attendance", href: "/console/attendance" },
  ] as const;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        borderBottom: `1px solid ${HAIR}`,
        marginBottom: 18,
      }}
    >
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <Link
            key={t.id}
            href={t.href}
            aria-current={on ? "page" : undefined}
            style={{
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: on ? 650 : 500,
              color: on ? INK : FAINT,
              textDecoration: "none",
              padding: "9px 14px 11px",
              // The underline IS the selected state, so it has to sit ON the
              // container's hairline rather than above it — hence the -1px.
              borderBottom: `2px solid ${on ? INDIGO : "transparent"}`,
              marginBottom: -1,
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
