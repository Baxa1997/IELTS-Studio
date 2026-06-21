import Link from "next/link";
import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import type { CohortStatus, SkillCell, StudentRow, TrendPoint } from "@/lib/console/compute";
import { loadCohortDashboard } from "@/lib/console/load";
import { cn } from "@/lib/utils";

import { ExportCohortButton } from "./export-button";

export const dynamic = "force-dynamic";

export default async function CohortPage() {
  const { profile } = await requireOrgUser();
  // Cohort analytics + seat/usage are a center-admin (billing owner) surface.
  if (profile.role !== "center_admin") redirect("/console");

  const data = await loadCohortDashboard(profile.organization_id);
  const { summary, trend, rows, seats, gradingThisMonth, aiCalls } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/console" className="text-muted-foreground hover:text-foreground text-sm">
              ← Console
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Cohort analytics</h1>
          <p className="text-muted-foreground">
            {summary.studentCount} student{summary.studentCount === 1 ? "" : "s"} ·{" "}
            {summary.measuredCount} measured
          </p>
        </div>
        <ExportCohortButton rows={rows} orgName={data.orgName} />
      </div>

      {/* The headline: band gained since diagnostic, and the trend. */}
      <BandLiftHero summary={summary} trend={trend} />

      {/* Who's improving / who's stuck. */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Improving" value={summary.counts.improving} tone="good" />
        <StatCard label="Steady" value={summary.counts.steady} tone="neutral" />
        <StatCard label="Needs attention" value={summary.counts.stuck} tone="warn" />
        <StatCard label="Not started" value={summary.counts.not_started} tone="muted" />
      </section>

      {/* Seats + AI usage. */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Meter label="Seats used" used={seats.used} limit={seats.limit} />
        <Meter label="AI gradings this month" used={gradingThisMonth.used} limit={gradingThisMonth.limit} />
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            AI calls this month
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{aiCalls.total}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {aiCalls.grade} grading · {aiCalls.generate} generation
          </p>
        </div>
      </section>

      {/* Per-student roster + history. */}
      <Roster rows={rows} />
    </div>
  );
}

// ---- Band lift hero --------------------------------------------------------

function BandLiftHero({
  summary,
  trend,
}: {
  summary: { avgLift: { reading: number | null; writing: number | null; overall: number | null } };
  trend: TrendPoint[];
}) {
  const overall = summary.avgLift.overall;
  return (
    <section className="grid gap-6 rounded-xl border p-5 lg:grid-cols-[minmax(0,18rem)_1fr]">
      <div>
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Average band lift
        </p>
        <p className={cn("mt-1 text-5xl font-semibold tabular-nums", overall != null && overall > 0 && "text-emerald-600 dark:text-emerald-400")}>
          {overall == null ? "—" : signed(overall)}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">since each student&apos;s diagnostic baseline</p>
        <div className="mt-3 flex gap-4 text-sm">
          <span>
            <span className="text-muted-foreground">Reading </span>
            <span className="font-medium tabular-nums">{fmtLift(summary.avgLift.reading)}</span>
          </span>
          <span>
            <span className="text-muted-foreground">Writing </span>
            <span className="font-medium tabular-nums">{fmtLift(summary.avgLift.writing)}</span>
          </span>
        </div>
      </div>
      <TrendBars trend={trend} />
    </section>
  );
}

/** Weekly cohort-average band, as bars — the "going up" story at a glance. */
function TrendBars({ trend }: { trend: TrendPoint[] }) {
  const withData = trend.filter((t) => t.avgBand != null);
  if (withData.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center text-sm">
        No graded work yet — the band trend will appear here.
      </div>
    );
  }
  // Scale band 3.5–9 into bar height so week-to-week differences read clearly.
  const height = (band: number | null) =>
    band == null ? 0 : Math.max(6, Math.round(((clamp(band, 3.5, 9) - 3.5) / (9 - 3.5)) * 100));

  return (
    <div>
      <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        Cohort average band · last {trend.length} weeks
      </p>
      <div className="flex items-end gap-2" style={{ height: 96 }}>
        {trend.map((t) => (
          <div key={t.weekStartISO} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] tabular-nums leading-none">
              {t.avgBand != null ? t.avgBand.toFixed(1) : ""}
            </span>
            <div
              className={cn("w-full rounded-t", t.avgBand != null ? "bg-primary" : "bg-muted")}
              style={{ height: `${t.avgBand != null ? height(t.avgBand) : 4}%` }}
              title={t.avgBand != null ? `${t.label}: ${t.avgBand.toFixed(1)} (${t.count})` : `${t.label}: no data`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2">
        {trend.map((t) => (
          <span key={t.weekStartISO} className="text-muted-foreground flex-1 text-center text-[10px]">
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---- Status strip ----------------------------------------------------------

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "warn" | "neutral" | "muted";
}) {
  const toneCls = {
    good: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    neutral: "text-foreground",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <div className="rounded-lg border p-4">
      <p className={cn("text-2xl font-semibold tabular-nums", toneCls)}>{value}</p>
      <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
    </div>
  );
}

// ---- Usage meter -----------------------------------------------------------

function Meter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : null;
  const near = pct != null && pct >= 80;
  return (
    <div className="rounded-lg border p-4">
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {used}
        <span className="text-muted-foreground text-sm font-normal">
          {" "}
          / {limit == null ? "∞" : limit}
        </span>
      </p>
      {pct != null ? (
        <div className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className={cn("h-full rounded-full", near ? "bg-amber-500" : "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : (
        <p className="text-muted-foreground mt-2 text-xs">Unlimited on this plan</p>
      )}
    </div>
  );
}

// ---- Roster ----------------------------------------------------------------

function Roster({ rows }: { rows: StudentRow[] }) {
  return (
    <section>
      <h2 className="text-sm font-medium">Students</h2>
      {rows.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-sm">
          No students yet — invite them from the console.
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left text-xs">
                <th className="px-3 py-2 font-medium">Student</th>
                <th className="px-3 py-2 font-medium">Reading</th>
                <th className="px-3 py-2 font-medium">Writing</th>
                <th className="px-3 py-2 font-medium">Avg lift</th>
                <th className="px-3 py-2 font-medium">Work</th>
                <th className="px-3 py-2 font-medium">Last active</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2">
                    <SkillCellView cell={r.reading} />
                  </td>
                  <td className="px-3 py-2">
                    <SkillCellView cell={r.writing} />
                  </td>
                  <td className="px-3 py-2">
                    <LiftBadge value={r.avgLift} />
                  </td>
                  <td className="text-muted-foreground px-3 py-2 tabular-nums">{r.submissions}</td>
                  <td className="text-muted-foreground px-3 py-2">{lastActiveLabel(r.lastActiveISO)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} reason={r.statusReason} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SkillCellView({ cell }: { cell: SkillCell | null }) {
  if (!cell) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex items-center gap-2">
      <span className="text-muted-foreground tabular-nums">
        {cell.baseline.toFixed(1)}→{cell.current.toFixed(1)}
      </span>
      <LiftBadge value={cell.lift} subtle />
    </span>
  );
}

function LiftBadge({ value, subtle }: { value: number | null; subtle?: boolean }) {
  if (value == null) return <span className="text-muted-foreground text-xs">—</span>;
  const cls =
    value > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : value < 0
        ? "text-destructive"
        : "text-muted-foreground";
  return <span className={cn("tabular-nums", subtle ? "text-xs" : "text-sm font-medium", cls)}>{signed(value)}</span>;
}

const STATUS_META: Record<CohortStatus, { label: string; cls: string }> = {
  improving: { label: "Improving", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  steady: { label: "Steady", cls: "border-border bg-muted/50 text-foreground" },
  stuck: { label: "Needs attention", cls: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  not_started: { label: "Not started", cls: "border-border text-muted-foreground" },
};

function StatusBadge({ status, reason }: { status: CohortStatus; reason: string }) {
  const m = STATUS_META[status];
  return (
    <span className="flex flex-col">
      <span className={cn("w-fit rounded-full border px-2 py-0.5 text-xs font-medium", m.cls)}>{m.label}</span>
      <span className="text-muted-foreground mt-0.5 text-[11px]">{reason}</span>
    </span>
  );
}

// ---- Format helpers --------------------------------------------------------

function signed(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}`;
}
function fmtLift(n: number | null): string {
  return n == null ? "—" : signed(n);
}
function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
function lastActiveLabel(iso: string | null): string {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days <= 30) return `${days}d ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(iso));
}
