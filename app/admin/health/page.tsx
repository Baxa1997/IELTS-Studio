import {
  Bar,
  Card,
  CardHead,
  Empty,
  FAINT,
  INDIGO,
  INK,
  Kpi,
  KpiRow,
  MUTED,
  Notice,
  Pill,
  PageTitle,
  SOFT,
  Split,
  Surface,
  TONE,
  clip,
} from "@/components/admin/ui";
import { ago, loadAuditLog, phraseAction } from "@/lib/admin/audit";
import { humanMs, loadHealth, type LatencyRow } from "@/lib/admin/health";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Thresholds are for a person waiting, not a server: grading is allowed to be
 *  slow because it is thinking, but a failure is always a student left empty-handed. */
function verdict(row: LatencyRow): { label: string; tone: "green" | "amber" | "red" | "neutral" } {
  if (row.calls === 0) return { label: "unused", tone: "neutral" };
  if (row.failureRate >= 0.2) return { label: "failing", tone: "red" };
  if (row.failureRate > 0) return { label: "some failures", tone: "amber" };
  if ((row.medianMs ?? 0) > 45000) return { label: "slow", tone: "amber" };
  return { label: "healthy", tone: "green" };
}

/**
 * Is the platform actually working?
 *
 * Every AI call already writes its latency and its outcome to `ai_usage`, so
 * this page reads what happened rather than asserting that all is well. The
 * headline is the FAILURE RATE, not uptime: a request that returns in 200ms
 * with an error is worse for a student than one that takes forty seconds and
 * comes back with a band.
 */
export default async function HealthPage() {
  await requireSuperAdmin();
  const [health, audit] = await Promise.all([loadHealth(30), loadAuditLog(30)]);

  const worst = [...health.grading]
    .filter((r) => r.calls > 0)
    .sort((a, b) => b.failureRate - a.failureRate)[0];
  const slowestGrade = Math.max(1, ...health.grading.map((r) => r.medianMs ?? 0));
  const failing = health.grading.filter((r) => r.calls > 0 && r.failureRate >= 0.2);
  const ok = failing.length === 0 && health.totals.failureRate < 0.05;

  return (
    <Surface>
      <PageTitle
        eyebrow="Operations"
        title="System health"
        subtitle={`Measured from every AI call in the last ${health.windowDays} days. Grading is the only queue that can make a student wait — everything else is read-only traffic.`}
        actions={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              background: ok ? TONE.green.tint : TONE.amber.tint,
              border: `1px solid ${ok ? TONE.green.border : TONE.amber.border}`,
              borderRadius: 9,
              padding: "10px 15px",
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: ok ? TONE.green.ink : TONE.amber.ink,
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: ok ? TONE.green.ink : TONE.amber.ink,
                whiteSpace: "nowrap",
              }}
            >
              {ok ? "All systems normal" : "Needs attention"}
            </span>
          </div>
        }
      />

      <KpiRow cols={4}>
        <Kpi
          label="AI calls"
          value={health.totals.calls}
          dot={INDIGO}
          sub={`last ${health.windowDays} days`}
        />
        <Kpi
          label="Failure rate"
          value={`${(health.totals.failureRate * 100).toFixed(1)}%`}
          dot={health.totals.failureRate >= 0.05 ? TONE.red.ink : TONE.green.ink}
          sub={`${health.totals.failed} call${health.totals.failed === 1 ? "" : "s"} returned nothing`}
        />
        <Kpi
          label="Median call"
          value={humanMs(health.totals.medianMs)}
          dot={TONE.green.ink}
          sub="across every task"
        />
        <Kpi
          label="Grading queue"
          value={health.queue.queued}
          dot={health.queue.queued > 0 ? TONE.amber.ink : TONE.green.ink}
          sub={
            health.queue.oldestQueuedMinutes != null
              ? `oldest waiting ${health.queue.oldestQueuedMinutes} min`
              : health.queue.failed > 0
                ? `${health.queue.failed} failed job${health.queue.failed === 1 ? "" : "s"}`
                : "nothing waiting"
          }
        />
      </KpiRow>

      {failing.length > 0 && worst ? (
        <Notice
          tone="red"
          title={`${worst.label} grading is failing ${Math.round(worst.failureRate * 100)}% of the time`}
          detail={`${worst.failed} of ${worst.calls} calls returned an error in the last ${health.windowDays} days. Each one is a learner who submitted work and got nothing back — worth checking the engine logs before anything else on this page.`}
        />
      ) : null}

      <Split>
        <Card>
          <CardHead
            title="Grading, by skill"
            note="Median time from submission to a returned band, and how often it fails."
          />
          {health.grading.map((row) => {
            const v = verdict(row);
            return (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "13px 18px",
                  borderBottom: "1px solid #F5F4F0",
                }}
              >
                <div style={{ width: 74, flexShrink: 0, fontSize: 13, color: INK }}>{row.label}</div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                  <Bar
                    width={`${((row.medianMs ?? 0) / slowestGrade) * 100}%`}
                    fill={row.calls === 0 ? "#E0DED8" : v.tone === "red" ? TONE.red.ink : INDIGO}
                  />
                </div>
                <div
                  style={{
                    width: 54,
                    textAlign: "right",
                    fontSize: 13,
                    fontWeight: 600,
                    color: INK,
                  }}
                >
                  {humanMs(row.medianMs)}
                </div>
                <div style={{ width: 62, textAlign: "right", fontSize: 11.5, color: FAINT }}>
                  {row.calls > 0 ? `${row.calls} call${row.calls === 1 ? "" : "s"}` : "—"}
                </div>
                <Pill tone={v.tone}>{v.label}</Pill>
              </div>
            );
          })}
          <div style={{ padding: "13px 18px", fontSize: 12, color: FAINT, lineHeight: 1.55 }}>
            {health.slowest
              ? `Slowest single call in the window: ${health.slowest.label} at ${health.slowest.seconds}s.`
              : "No calls recorded in this window."}
          </div>
        </Card>

        <Card>
          <CardHead
            title="Generation, by kind"
            note="Making a passage or a test. Slower than grading by design — nobody is waiting on a band."
          />
          {health.generation.map((row) => {
            const v = verdict(row);
            return (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "13px 18px",
                  borderBottom: "1px solid #F5F4F0",
                }}
              >
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: INK, ...clip }}>
                  {row.label}
                </div>
                <div style={{ fontSize: 11.5, color: FAINT, whiteSpace: "nowrap" }}>
                  {row.calls > 0 ? `${row.calls}×` : "—"}
                </div>
                <div style={{ width: 54, textAlign: "right", fontSize: 13, fontWeight: 600, color: INK }}>
                  {humanMs(row.medianMs)}
                </div>
                <Pill tone={v.tone}>{v.label}</Pill>
              </div>
            );
          })}
        </Card>
      </Split>

      <Card>
        <CardHead
          title="Audit log"
          note="Every super-admin action: approvals, plan changes, limit changes. Append-only — nothing here can be edited or deleted."
        />
        {audit.map((row) => (
          <div
            key={row.id}
            style={{
              display: "flex",
              gap: 12,
              padding: "11px 18px",
              borderBottom: "1px solid #F5F4F0",
              fontSize: 12.5,
              alignItems: "baseline",
            }}
          >
            <span style={{ color: FAINT, width: 96, flexShrink: 0 }}>{ago(row.when)}</span>
            <span style={{ flex: 1, minWidth: 0, color: INK }}>
              {phraseAction(row.action)}{" "}
              <strong style={{ fontWeight: 600 }}>{row.target}</strong>
              {typeof row.detail.from === "string" && typeof row.detail.to === "string" ? (
                <span style={{ color: SOFT }}>
                  {" "}
                  · {row.detail.from} → {row.detail.to}
                </span>
              ) : null}
              {typeof row.detail.members === "number" && row.detail.members > 1 ? (
                <span style={{ color: TONE.amber.ink }}> · {row.detail.members} members affected</span>
              ) : null}
            </span>
            <span style={{ color: SOFT, whiteSpace: "nowrap", ...clip }}>{row.actor}</span>
          </div>
        ))}
        {audit.length === 0 ? (
          <Empty>
            Nothing recorded yet. Approving a centre or changing an account&apos;s plan writes a line
            here — and if this stays empty after you have done one, the{" "}
            <code>admin_audit_log</code> migration has not been applied.
          </Empty>
        ) : null}
      </Card>

      <div style={{ marginTop: 16, fontSize: 12.5, color: MUTED, lineHeight: 1.6, maxWidth: "76ch" }}>
        Uptime is deliberately absent. Nothing on this platform measures it — the honest sources
        would be the engine box and Vercel, and a number invented here would be believed. What is
        shown instead is what the app genuinely records: every model call, how long it took, and
        whether it worked.
      </div>
    </Surface>
  );
}
