import Link from "next/link";

import { ChartLegend, PlatformChart } from "@/components/admin/platform-chart";
import {
  Bar,
  Card,
  CardHead,
  Empty,
  FAINT,
  Glyph,
  Identity,
  INDIGO,
  INK,
  Kpi,
  KpiRow,
  NAVY,
  Pill,
  PageTitle,
  SERIF,
  SOFT,
  Split,
  Surface,
  TONE,
  clip,
} from "@/components/admin/ui";
import {
  loadCenters,
  loadEngagement,
  loadPlatformStats,
  loadPlatformTrends,
} from "@/lib/admin/platform";
import { loadConductFlags } from "@/lib/admin/moderation";
import { loadRevenue } from "@/lib/admin/revenue";
import { daysSince } from "@/lib/admin/time";
import { requireSuperAdmin } from "@/lib/auth";

import { OrgReviewRow } from "./org-review-row";

export const dynamic = "force-dynamic";

const money = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "—";

/**
 * The platform, on one page.
 *
 * Built around one question — what needs me today? — which is why the decision
 * queue sits above the numbers rather than below them. A dashboard that opens
 * with charts asks the owner to go looking for the work; this one hands it over
 * and then explains the context.
 */
export default async function AdminPage() {
  await requireSuperAdmin();

  const [stats, centers, trends, revenue, engagement, conduct] = await Promise.all([
    loadPlatformStats(),
    loadCenters(),
    loadPlatformTrends(30),
    loadRevenue(),
    loadEngagement(),
    loadConductFlags(10),
  ]);

  const pending = centers.filter((c) => c.status === "pending");
  const decisions = pending.length + conduct.length;
  const p = stats.practice30d;

  const oldestWait =
    pending.length > 0
      ? daysSince(pending.reduce((a, b) => (a.createdAt < b.createdAt ? a : b)).createdAt)
      : null;

  const delta = (now: number, before: number) => {
    if (before === 0) return now > 0 ? "new" : "—";
    return `${now >= before ? "+" : ""}${Math.round(((now - before) / before) * 100)}%`;
  };
  const practiceDelta = delta(trends.totals.practice, trends.previous.practice);
  const signupDelta = delta(trends.totals.signups, trends.previous.signups);

  const skills = [
    { name: "Writing", n: p.writing },
    { name: "Reading", n: p.reading },
    { name: "Listening", n: p.listening },
    { name: "Speaking", n: p.speaking },
  ].sort((a, b) => b.n - a.n);
  const skillMax = Math.max(1, ...skills.map((s) => s.n));

  const busiest = [...centers].sort((a, b) => b.students - a.students).slice(0, 4);
  const neverShare = engagement.learners
    ? Math.round((engagement.neverPractised / engagement.learners) * 100)
    : 0;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Surface>
      <PageTitle
        // eyebrow="Platform"
        title="Everything, across every tenant"
        // subtitle={
        //   decisions > 0
        //     ? `${today} · ${decisions} thing${decisions === 1 ? "" : "s"} need${decisions === 1 ? "s" : ""} you today.`
        //     : `${today} · nothing is waiting on you.`
        // }
        actions={
          pending.length > 0 ? (
            <Link
              href="/admin/centers?tab=pending"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: INDIGO,
                color: "#fff",
                borderRadius: 9,
                padding: "10px 15px",
                fontSize: 13.5,
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Review {pending.length} application{pending.length === 1 ? "" : "s"}
            </Link>
          ) : undefined
        }
      />

      {/* ── needs a decision ───────────────────────────────────────────── */}
      <Card style={{ marginBottom: 16 }}>
        <CardHead
          title="Needs a decision"
          badge={
            decisions > 0 ? (
              <Pill tone={pending.length > 0 ? "red" : "amber"}>{decisions} open</Pill>
            ) : (
              <Pill tone="green">clear</Pill>
            )
          }
          right={
            oldestWait != null ? (
              <span style={{ fontSize: 12.5, color: FAINT }}>
                Oldest has waited {oldestWait} day{oldestWait === 1 ? "" : "s"}
              </span>
            ) : undefined
          }
        />
        {pending.map((c) => (
          <OrgReviewRow
            key={c.id}
            orgId={c.id}
            name={c.name}
            email={c.contactEmail}
            applied={dateFmt(c.createdAt)}
          />
        ))}
        {conduct.slice(0, 3).map((c) => (
          <div
            key={c.id}
            className="sa-row"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              borderBottom: "1px solid #F5F4F0",
            }}
          >
            <Glyph tone="red" size={34}>
              !
            </Glyph>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: INK }}>
                  Speaking mock flagged
                </span>
                <Pill tone="red">{c.kind || "conduct"}</Pill>
              </div>
              <div style={{ fontSize: 12, color: SOFT, marginTop: 3, ...clip }}>
                {c.student} · {c.org} · “{c.quote}”
              </div>
            </div>
            <Link
              href="/admin/moderation"
              style={{
                fontSize: 12.5,
                color: INDIGO,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Review →
            </Link>
          </div>
        ))}
        {decisions === 0 ? (
          <Empty>Nothing is waiting. New center applications and flagged mocks land here.</Empty>
        ) : null}
      </Card>

      {/* ── the numbers ────────────────────────────────────────────────── */}
      <KpiRow cols={6}>
        <Kpi
          label="Learners"
          value={stats.learners}
          delta={`+${stats.newUsers7d}`}
          deltaTone="green"
          sub="this week"
        />
        <Kpi
          label="Centers"
          value={stats.centers}
          delta={pending.length > 0 ? `${pending.length}` : undefined}
          deltaTone="amber"
          sub={pending.length > 0 ? "waiting" : "all reviewed"}
        />
        <Kpi label="Teachers" value={stats.teachers} sub="across all centers" />
        <Kpi
          label="Practices 30d"
          value={p.total}
          delta={practiceDelta}
          deltaTone={trends.totals.practice >= trends.previous.practice ? "green" : "red"}
          sub="vs prior"
        />
        <Kpi
          label="Paying accounts"
          value={revenue.payingAccounts}
          delta={`${revenue.totalAccounts ? Math.round((revenue.payingAccounts / revenue.totalAccounts) * 100) : 0}%`}
          deltaTone="amber"
          sub={`of ${revenue.totalAccounts}`}
        />
        <Kpi
          label="Never practised"
          value={engagement.neverPractised}
          delta={`${neverShare}%`}
          deltaTone={neverShare > 50 ? "red" : "amber"}
          sub="of learners"
        />
      </KpiRow>

      {/* ── traffic + revenue ──────────────────────────────────────────── */}
      <Split ratio="1.35fr .65fr">
        <Card pad>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div>
              <h2
                style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, margin: 0, color: INK }}
              >
                Graded practice, day by day
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: SOFT }}>
                Every graded attempt on the platform. Sign-ups underneath, on the same days.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, margin: "14px 0 6px" }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.02em", color: INK }}>
                {trends.totals.practice}
              </div>
              <div style={{ fontSize: 11.5, color: SOFT }}>
                practices ·{" "}
                <span style={{ color: TONE.green.ink, fontWeight: 600 }}>{practiceDelta}</span>
              </div>
            </div>
            <div>
              <div
                style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.02em", color: "#7C79DB" }}
              >
                {trends.totals.signups}
              </div>
              <div style={{ fontSize: 11.5, color: SOFT }}>
                sign-ups ·{" "}
                <span style={{ color: TONE.green.ink, fontWeight: 600 }}>{signupDelta}</span>
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <ChartLegend />
            </div>
          </div>
          <PlatformChart practice={trends.practice} signups={trends.signups} />
        </Card>

        <div
          style={{
            background: NAVY,
            color: "#fff",
            borderRadius: 14,
            padding: 18,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, margin: 0 }}>Revenue</h2>
            <Link
              href="/admin/plans"
              style={{
                marginLeft: "auto",
                border: "1px solid #33326E",
                color: "#C9C7E4",
                borderRadius: 7,
                padding: "5px 10px",
                fontSize: 11.5,
                textDecoration: "none",
              }}
            >
              Plans
            </Link>
          </div>
          <div style={{ fontSize: 12, color: "#A8A6D0", marginTop: 12 }}>Monthly recurring</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 4 }}>
            <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700 }}>
              {money(revenue.mrr)}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#7FD8A8" }}>
              {revenue.activeSubscriptions} active
            </div>
          </div>

          <div
            style={{
              height: 7,
              background: "#2B2A63",
              borderRadius: 4,
              margin: "16px 0 10px",
              display: "flex",
              overflow: "hidden",
              gap: 2,
            }}
          >
            {revenue.lines
              .filter((l) => l.granted > 0)
              .map((l) => (
                <div
                  key={l.plan}
                  title={`${l.name}: ${l.granted}`}
                  style={{
                    width: `${(l.granted / Math.max(1, revenue.totalAccounts)) * 100}%`,
                    background: l.color,
                  }}
                />
              ))}
          </div>

          {revenue.lines
            .filter((l) => l.plan !== "trial")
            .map((l) => (
              <div
                key={l.plan}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "7px 0",
                  borderBottom: "1px solid #24234F",
                  fontSize: 12.5,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 3,
                    background: l.color,
                    flex: "none",
                  }}
                />
                <span style={{ color: "#C9C7E4", ...clip }}>
                  {l.name} · {l.granted} account{l.granted === 1 ? "" : "s"}
                </span>
                <span style={{ marginLeft: "auto", fontWeight: 600 }}>{money(l.mrr)}</span>
              </div>
            ))}

          <div
            style={{
              marginTop: "auto",
              paddingTop: 14,
              fontSize: 11.5,
              color: "#8280B8",
              lineHeight: 1.6,
            }}
          >
            {revenue.unpaidPaidPlans > 0 ? (
              <>
                {revenue.unpaidPaidPlans} account{revenue.unpaidPaidPlans === 1 ? " is" : "s are"}{" "}
                on a paid plan with no live subscription — comped, or a payment that never
                completed. They are counted above as accounts, not as revenue.
              </>
            ) : (
              <>
                {revenue.totalAccounts - revenue.payingAccounts} of {revenue.totalAccounts} accounts
                are free. That is where the growth has to come from.
              </>
            )}
          </div>
        </div>
      </Split>

      {/* ── skills + centers ───────────────────────────────────────────── */}
      <Split>
        <Card pad>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, margin: 0, color: INK }}>
              Which skills are being used
            </h2>
            <span style={{ marginLeft: "auto", fontSize: 12.5, color: SOFT }}>last 30 days</span>
          </div>
          <p style={{ margin: "0 0 18px", fontSize: 12.5, color: SOFT }}>
            {skills[skills.length - 1].n === 0
              ? `${skills[skills.length - 1].name} is untouched — worth knowing before more is built for it.`
              : `${skills[0].name} leads. The spread tells you where content is worth building.`}
          </p>
          {skills.map((s) => (
            <div key={s.name} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: INK }}>{s.name}</span>
                <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 600, color: INK }}>
                  {s.n}
                </span>
                <span style={{ fontSize: 11.5, color: FAINT, marginLeft: 8 }}>
                  {p.total ? Math.round((s.n / p.total) * 100) : 0}%
                </span>
              </div>
              <Bar width={`${(s.n / skillMax) * 100}%`} fill={INDIGO} height={9} />
            </div>
          ))}
        </Card>

        <Card>
          <CardHead
            title="Busiest centers"
            right={
              <Link
                href="/admin/centers"
                style={{ fontSize: 12.5, color: INDIGO, textDecoration: "none" }}
              >
                All centers →
              </Link>
            }
          />
          {busiest.map((c) => (
            <Link
              key={c.id}
              href={`/admin/centers/${c.id}`}
              className="sa-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 18px",
                borderBottom: "1px solid #F5F4F0",
                textDecoration: "none",
                color: INK,
              }}
            >
              <Identity
                glyph={initials(c.name)}
                name={c.name}
                meta={`${c.teachers} teacher${c.teachers === 1 ? "" : "s"} · ${c.groups} group${c.groups === 1 ? "" : "s"}`}
              />
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{c.students}</div>
                <div style={{ fontSize: 11, color: FAINT }}>students</div>
              </div>
              <Pill
                tone={c.status === "active" ? "green" : c.status === "pending" ? "amber" : "red"}
              >
                {c.status}
              </Pill>
            </Link>
          ))}
          {busiest.length === 0 ? (
            <Empty>
              No centers yet. They arrive through the Organization tab on the sign-up page.
            </Empty>
          ) : null}
        </Card>
      </Split>

      <div style={{ fontSize: 12, color: FAINT, marginTop: 4 }}>
        {stats.personalWorkspaces} personal workspaces · {stats.centerAdmins} center admins ·{" "}
        {engagement.activeLast30} learners practised in the last 30 days
      </div>
    </Surface>
  );
}
