import Link from "next/link";

import { MenuIcon } from "@/components/admin/menu-icons";
import { OverflowMenu } from "@/components/admin/menu";
import {
  Card,
  CardHead,
  FAINT,
  INDIGO,
  INK,
  LINE,
  MUTED,
  PageTitle,
  SERIF,
  SOFT,
  Surface,
  TONE,
  clip,
} from "@/components/admin/ui";
import { loadEngagement, loadUsers } from "@/lib/admin/platform";
import { monthlyPrice } from "@/lib/admin/revenue";
import { requireSuperAdmin } from "@/lib/auth";
import { PLAN_ORDER, PLAN_TIERS, type OrgPlan } from "@/lib/billing/plans";

import { UsersTable, type UserRow } from "./users-table";

export const dynamic = "force-dynamic";

/** Straight from the design's `planMix`: free is the quiet grey that should
 *  dominate the bar, and the paid tiers climb toward the indigo accent. */
const PLAN_COLOR: Record<OrgPlan, string> = {
  trial: "#D8D6D0",
  starter: "#7C79DB",
  pro: "#4340CB",
  enterprise: "#E5A85C",
};

/** The design's small KPI tile: 23px value in its own colour, 12px label. */
function Tile({
  label,
  value,
  sub,
  ink,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  ink: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 7 }}>{label}</div>
      <div style={{ fontSize: 23, fontWeight: 600, color: ink, letterSpacing: "-.02em" }}>
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: FAINT, marginTop: 4, ...clip }}>{sub}</div>
    </div>
  );
}

/**
 * Everyone on the platform.
 *
 * The page loads the list once and hands the whole thing to a client table —
 * filtering, sorting and paging all happen in the browser, which is what makes
 * the controls act instantly instead of costing a round trip per keystroke.
 * Only `q` survives as a URL parameter, because the header's search deep-links
 * into here.
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;

  const [all, engagement] = await Promise.all([loadUsers(), loadEngagement()]);

  const inCenters = all.filter((u) => u.orgKind === "center").length;
  const practising = all.filter((u) => u.practiceCount > 0).length;
  const byPlan = (p: OrgPlan) => all.filter((u) => u.orgPlan === p).length;
  const paidPeople = all.filter((u) => u.orgPlan !== "trial").length;
  const suspendedCount = all.filter((u) => u.orgStatus === "suspended").length;
  // Deliverable addresses only: a centre-created account's address is synthetic
  // and mailing it just bounces into the void.
  const neverPractisedEmails = all
    .filter((u) => u.practiceCount === 0 && u.email && !u.emailUndeliverable)
    .map((u) => u.email as string);

  const rows: UserRow[] = all.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username,
    emailUndeliverable: u.emailUndeliverable,
    role: u.role,
    orgKind: u.orgKind,
    orgName: u.orgName,
    orgPlan: u.orgPlan,
    orgStatus: u.orgStatus,
    gradingLimit: u.gradingLimit,
    generationLimit: u.generationLimit,
    orgMemberCount: u.orgMemberCount,
    practiceCount: u.practiceCount,
    createdAt: u.createdAt,
  }));

  return (
    <Surface>
      <PageTitle
        eyebrow="Platform"
        title="Users"
        subtitle="Everyone on the platform, with how much work each of them owns."
        actions={
          <OverflowMenu
            label="User actions"
            items={[
              {
                label: `Email never-practised (${all.length - practising})`,
                // A real mailto, BCC'd, so nobody sees anyone else's address.
                // Capped at 90 recipients because a mailto: longer than roughly
                // 2000 characters is silently truncated by some mail clients —
                // better a first batch that works than a link that half-sends.
                href: `mailto:?bcc=${encodeURIComponent(neverPractisedEmails.slice(0, 90).join(","))}&subject=${encodeURIComponent("Your EngProgress practice is waiting")}`,
                icon: MenuIcon.mail,
                tone: "indigo",
              },
              {
                label: "Plans & revenue",
                href: "/admin/plans",
                icon: MenuIcon.card,
                tone: "indigo",
              },
              {
                label: "Export users (Excel)",
                href: "/api/admin/export?kind=users",
                icon: MenuIcon.sheet,
                tone: "green",
                download: true,
                separated: true,
              },
              {
                label: `Suspended accounts (${suspendedCount})`,
                href: "/admin/users?filter=suspended",
                icon: MenuIcon.ban,
                tone: "red",
                separated: true,
              },
            ]}
          />
        }
      />

      {/* The design's split: four small tiles in a 2×2 on the left, the plan
          mix filling the same height on the right. */}
      <div
        className="ad-split-users"
        style={{ display: "grid", gridTemplateColumns: "1.1fr 1.9fr", gap: 12, marginBottom: 16 }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          <Tile
            label="Users"
            value={all.length}
            sub={`${all.length - inCenters} individual · ${inCenters} in a center`}
            ink={INDIGO}
          />
          <Tile
            label="Active this week"
            value={engagement.activeLast7}
            sub={`${all.length ? Math.round((engagement.activeLast7 / all.length) * 100) : 0}% of the base`}
            ink={INK}
          />
          <Tile
            label="Never practised"
            value={all.length - practising}
            sub="worth one nudge email"
            ink={TONE.red.ink}
          />
          <Tile
            label="On a paid plan"
            value={paidPeople}
            sub={
              PLAN_ORDER.filter((p) => p !== "trial" && byPlan(p) > 0)
                .map((p) => `${byPlan(p)} ${PLAN_TIERS[p].name}`)
                .join(" · ") || "nobody yet"
            }
            ink={TONE.green.ink}
          />
        </div>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${LINE}`,
            borderRadius: 12,
            padding: "16px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, margin: 0, color: INK }}>
              Plan mix
            </h2>
            <span style={{ fontSize: 12.5, color: SOFT }}>
              {all.length} accounts · {paidPeople} on a paid plan
            </span>
            <Link
              href="/admin/plans"
              style={{ marginLeft: "auto", fontSize: 12.5, color: INDIGO, textDecoration: "none" }}
            >
              Plans &amp; limits →
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              height: 10,
              borderRadius: 6,
              overflow: "hidden",
              gap: 2,
              marginBottom: 14,
            }}
          >
            {PLAN_ORDER.filter((p) => byPlan(p) > 0).map((p) => (
              <div
                key={p}
                title={`${PLAN_TIERS[p].name}: ${byPlan(p)}`}
                style={{
                  background: PLAN_COLOR[p],
                  width: `${(byPlan(p) / Math.max(1, all.length)) * 100}%`,
                }}
              />
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {PLAN_ORDER.map((p) => {
              const n = byPlan(p);
              return (
                <div key={p}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span
                      style={{ width: 8, height: 8, borderRadius: 3, background: PLAN_COLOR[p] }}
                    />
                    <span style={{ fontSize: 12, color: MUTED }}>{PLAN_TIERS[p].name}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4, color: INK }}>{n}</div>
                  {/* List value, not billed revenue — the two differ, and the
                      difference is spelled out on Plans & revenue where there is
                      room to explain it rather than imply it in a caption. */}
                  <div style={{ fontSize: 11, color: FAINT }}>
                    {monthlyPrice(p) > 0 ? `$${(n * monthlyPrice(p)).toFixed(0)}/mo listed` : "$0"}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <Card>
        <CardHead title="All users" note="Capped at the 500 most recent accounts." />
        <UsersTable users={rows} initialQuery={sp.q ?? ""} initialFilter={sp.filter ?? ""} />
      </Card>
    </Surface>
  );
}
