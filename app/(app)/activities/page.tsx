import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, PenLine } from "lucide-react";

import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Activities = the student's HISTORY of graded work — past writing and reading,
 * each opening its stored feedback and band. New practice is launched from the
 * sidebar (Writing / Reading), not from here.
 */

const TASK_LABEL: Record<string, string> = {
  task2: "Task 2 — Essay",
  task1_academic: "Task 1 — Academic",
  task1_general: "Task 1 — Letter",
};

interface Row {
  id: string;
  href: string;
  title: string;
  date: string;
  band: number | null;
  sub?: string;
}

export default async function ActivitiesPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const supabase = await createClient();

  // Writing: the student's essays → their latest grading's band.
  const { data: essays } = await supabase
    .from("essays")
    .select("id, task_type, updated_at")
    .eq("student_id", profile.id)
    .order("updated_at", { ascending: false });
  const essayIds = (essays ?? []).map((e) => e.id as string);

  const latest = new Map<string, { band: number; at: string }>();
  if (essayIds.length) {
    const { data: gradings } = await supabase
      .from("gradings")
      .select("essay_id, overall_band, created_at")
      .in("essay_id", essayIds)
      .order("created_at", { ascending: true });
    for (const g of gradings ?? []) {
      latest.set(g.essay_id as string, { band: Number(g.overall_band), at: g.created_at as string });
    }
  }
  const writing: Row[] = (essays ?? [])
    .filter((e) => latest.has(e.id as string)) // graded only
    .map((e) => {
      const g = latest.get(e.id as string)!;
      return {
        id: e.id as string,
        href: `/activities/essay/${e.id}`,
        title: TASK_LABEL[e.task_type as string] ?? "Writing",
        date: g.at,
        band: g.band,
      };
    });

  // Reading: graded attempts → a single passage (passage_id) or a full 3-passage
  // test (test_id). Both open the same read-only review page.
  const { data: attempts } = await supabase
    .from("reading_attempts")
    .select("id, test_id, passage_id, band, percent, submitted_at, created_at")
    .eq("student_id", profile.id)
    .eq("status", "graded")
    .order("submitted_at", { ascending: false });
  const passageIds = [...new Set((attempts ?? []).map((a) => a.passage_id as string).filter(Boolean))];
  const titles = new Map<string, string>();
  if (passageIds.length) {
    const { data: ps } = await supabase.from("reading_passages").select("id, title").in("id", passageIds);
    for (const p of ps ?? []) titles.set(p.id as string, p.title as string);
  }
  const reading: Row[] = (attempts ?? []).map((a) => {
    const pct = a.percent == null ? undefined : `${Math.round(Number(a.percent))}%`;
    const isTest = a.test_id != null;
    return {
      id: a.id as string,
      href: `/activities/reading/${a.id}`,
      title: isTest ? "Full reading test" : (titles.get(a.passage_id as string) ?? "Reading passage"),
      date: (a.submitted_at as string) ?? (a.created_at as string),
      band: a.band == null ? null : Number(a.band),
      sub: isTest ? `3 passages${pct ? ` · ${pct}` : ""}` : pct,
    };
  });

  const empty = writing.length === 0 && reading.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activities</h1>
        <p className="text-muted-foreground">
          Your past writing and reading — open any to see the feedback and band.
        </p>
      </div>

      {empty ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
          Nothing here yet. Start <span className="text-foreground font-medium">Writing</span> or{" "}
          <span className="text-foreground font-medium">Reading</span> from the sidebar — your graded work
          and feedback collect here.
        </div>
      ) : (
        <>
          {writing.length > 0 ? (
            <Section title="Writing" icon={PenLine}>
              {writing.map((r) => (
                <HistoryRow key={r.id} row={r} />
              ))}
            </Section>
          ) : null}
          {reading.length > 0 ? (
            <Section title="Reading" icon={BookOpen}>
              {reading.map((r) => (
                <HistoryRow key={r.id} row={r} />
              ))}
            </Section>
          ) : null}
        </>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon className="text-primary size-4" /> {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function HistoryRow({ row }: { row: Row }) {
  return (
    <Link
      href={row.href}
      className="bg-card hover:border-primary/40 flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors"
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{row.title}</p>
        <p className="text-muted-foreground text-xs">
          {fmtDate(row.date)}
          {row.sub ? ` · ${row.sub}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <BandPill band={row.band} />
        <ArrowRight className="text-muted-foreground size-4 shrink-0" />
      </div>
    </Link>
  );
}

function BandPill({ band }: { band: number | null }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums",
        band == null ? "text-muted-foreground" : "bg-primary/10 text-primary",
      )}
    >
      {band == null ? "—" : band.toFixed(1)}
    </span>
  );
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(iso),
  );
}
