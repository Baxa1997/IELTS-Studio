import Link from "next/link";

import {
  Card,
  CardHead,
  Empty,
  FAINT,
  HEAD_BG,
  Identity,
  INDIGO,
  INK,
  Kpi,
  KpiRow,
  LINE,
  MUTED,
  Pill,
  PageTitle,
  SERIF,
  SOFT,
  Surface,
  TableHead,
  TableRow,
  TONE,
  clip,
} from "@/components/admin/ui";
import { loadUsers, type PlatformUser } from "@/lib/admin/platform";
import { monthlyPrice } from "@/lib/admin/revenue";
import { requireSuperAdmin } from "@/lib/auth";
import { PLAN_ORDER, PLAN_TIERS, type OrgPlan } from "@/lib/billing/plans";

import { PlanControls } from "./plan-controls";

export const dynamic = "force-dynamic";

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

const COLS = "2.3fr 1fr 1.4fr .9fr .8fr 1fr 60px";
const PAGE_SIZE = 25;

const PLAN_COLOR: Record<OrgPlan, string> = {
  trial: "#C9C7E4",
  starter: "#E5A85C",
  pro: "#7FD8A8",
  enterprise: "#7C79DB",
};

const PLAN_TONE: Record<OrgPlan, "neutral" | "indigo" | "amber" | "green"> = {
  trial: "neutral",
  starter: "indigo",
  pro: "amber",
  enterprise: "green",
};

/** Colour a person's avatar by their name, so the same face keeps the same tile. */
const AVATAR: ("indigo" | "green" | "amber" | "red" | "neutral")[] = [
  "indigo",
  "green",
  "amber",
  "red",
  "neutral",
];
const avatarTone = (name: string) =>
  AVATAR[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length];

const SORTS = {
  recent: { label: "Newest first", cmp: (a: PlatformUser, b: PlatformUser) => b.createdAt.localeCompare(a.createdAt) },
  oldest: { label: "Oldest first", cmp: (a: PlatformUser, b: PlatformUser) => a.createdAt.localeCompare(b.createdAt) },
  practice: { label: "Most practice", cmp: (a: PlatformUser, b: PlatformUser) => b.practiceCount - a.practiceCount },
  idle: { label: "No practice first", cmp: (a: PlatformUser, b: PlatformUser) => a.practiceCount - b.practiceCount },
  name: { label: "Name A–Z", cmp: (a: PlatformUser, b: PlatformUser) => a.name.localeCompare(b.name) },
} as const;

type SortKey = keyof typeof SORTS;

const field: React.CSSProperties = {
  border: "1px solid #E4E2DC",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 12.5,
  background: "#fff",
  fontFamily: "inherit",
  color: INK,
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    kind?: string;
    sort?: string;
    plan?: string;
    page?: string;
  }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const query = sp.q?.trim() || undefined;
  const role = sp.role && sp.role !== "all" ? sp.role : undefined;
  const kind = sp.kind && sp.kind !== "all" ? sp.kind : undefined;
  const plan = sp.plan && sp.plan !== "all" ? sp.plan : undefined;
  const sort: SortKey = (sp.sort && sp.sort in SORTS ? sp.sort : "recent") as SortKey;

  const all = await loadUsers(query);
  const filtered = all
    .filter((u) => (role ? u.role === role : true))
    .filter((u) => (kind ? u.orgKind === kind : true))
    .filter((u) => (plan ? u.orgPlan === plan : true))
    .sort(SORTS[sort].cmp);

  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const inCenters = all.filter((u) => u.orgKind === "center").length;
  const practising = all.filter((u) => u.practiceCount > 0).length;
  const byPlan = (p: OrgPlan) => all.filter((u) => u.orgPlan === p).length;

  // A URL builder that keeps every other filter — the classic bug here is a
  // pagination link that silently drops the search you had typed.
  const url = (over: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q: query, role: sp.role, kind: sp.kind, plan: sp.plan, sort, ...over };
    for (const [k, v] of Object.entries(merged)) {
      if (v != null && v !== "" && v !== "all") params.set(k, String(v));
    }
    const qs = params.toString();
    return `/admin/users${qs ? `?${qs}` : ""}`;
  };

  return (
    <Surface>
      <PageTitle
        eyebrow="Platform"
        title="Users"
        subtitle="Everyone on the platform, with how much work each of them owns."
      />

      <KpiRow cols={4}>
        <Kpi label="Users" value={all.length} sub="all roles" />
        <Kpi label="Individual" value={all.length - inCenters} sub="own workspace" />
        <Kpi label="In a center" value={inCenters} sub="on a centre roll" />
        <Kpi
          label="Never practised"
          value={all.length - practising}
          delta={`${all.length ? Math.round(((all.length - practising) / all.length) * 100) : 0}%`}
          deltaTone="red"
          sub="of everyone"
        />
      </KpiRow>

      {/* ── plan mix ───────────────────────────────────────────────────── */}
      <Card pad style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, margin: 0, color: INK }}>
            Plan mix
          </h2>
          <span style={{ fontSize: 12.5, color: SOFT }}>counted over people, not workspaces</span>
          <Link
            href="/admin/plans"
            style={{ marginLeft: "auto", fontSize: 12.5, color: INDIGO, textDecoration: "none" }}
          >
            Plans &amp; revenue →
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
            const on = plan === p;
            return (
              <Link
                key={p}
                href={url({ plan: on ? "all" : p, page: undefined })}
                style={{
                  textDecoration: "none",
                  borderRadius: 10,
                  padding: "8px 10px",
                  border: `1px solid ${on ? TONE.indigo.border : "transparent"}`,
                  background: on ? TONE.indigo.tint : "transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span
                    style={{ width: 8, height: 8, borderRadius: 3, background: PLAN_COLOR[p] }}
                  />
                  <span style={{ fontSize: 12, color: MUTED }}>{PLAN_TIERS[p].name}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4, color: INK }}>{n}</div>
                <div style={{ fontSize: 11, color: FAINT }}>
                  {monthlyPrice(p) > 0 ? `$${monthlyPrice(p).toFixed(2)}/mo each` : "free"}
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* ── the table ──────────────────────────────────────────────────── */}
      <Card>
        <CardHead
          title={query ? `Matching “${query}”` : "All users"}
          note="Capped at the 500 most recent accounts."
          badge={
            <span style={{ fontSize: 12, color: FAINT, fontWeight: 400 }}>
              {filtered.length} shown{filtered.length !== all.length ? ` of ${all.length}` : ""}
            </span>
          }
        />

        <form
          method="get"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "14px 18px",
            borderBottom: "1px solid #F0EEE9",
            flexWrap: "wrap",
          }}
        >
          <input
            name="q"
            defaultValue={query ?? ""}
            placeholder="Name, email or login…"
            aria-label="Search users"
            style={{ ...field, flex: 1, minWidth: 200, maxWidth: 280, background: "#FAFAF8" }}
          />
          <select name="role" defaultValue={sp.role ?? "all"} aria-label="Role" style={field}>
            <option value="all">Any role</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="center_admin">Center admin</option>
            <option value="administrator">Administrator</option>
          </select>
          <select name="kind" defaultValue={sp.kind ?? "all"} aria-label="Workspace" style={field}>
            <option value="all">Anywhere</option>
            <option value="personal">Individual</option>
            <option value="center">In a center</option>
          </select>
          <select name="plan" defaultValue={sp.plan ?? "all"} aria-label="Plan" style={field}>
            <option value="all">Any plan</option>
            {PLAN_ORDER.map((p) => (
              <option key={p} value={p}>
                {PLAN_TIERS[p].name}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={sort} aria-label="Sort" style={field}>
            {Object.entries(SORTS).map(([value, s]) => (
              <option key={value} value={value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            style={{
              ...field,
              background: INDIGO,
              color: "#fff",
              border: 0,
              fontWeight: 600,
              cursor: "pointer",
              padding: "9px 16px",
            }}
          >
            Apply
          </button>
        </form>

        <div className="ad-scroll">
          <div>
            <TableHead cols={COLS}>
              <div>USER</div>
              <div>ROLE</div>
              <div>WORKSPACE</div>
              <div>PLAN</div>
              <div style={{ textAlign: "right" }}>PRACTICE</div>
              <div>JOINED</div>
              <div style={{ textAlign: "right" }}>PLAN</div>
            </TableHead>

            {rows.map((u) => (
              <TableRow key={u.id} cols={COLS}>
                <Identity
                  glyph={initials(u.name)}
                  tone={avatarTone(u.name)}
                  round
                  name={u.name}
                  meta={
                    <>
                      {u.email ?? u.username ?? "—"}
                      {/* Shown, not hidden — but labelled, because a support reply
                          to a synthetic address disappears without a bounce. */}
                      {u.emailUndeliverable ? (
                        <span title="Synthetic sign-in address — cannot receive mail">
                          {" "}
                          (no inbox)
                        </span>
                      ) : null}
                    </>
                  }
                />
                <div>
                  <Pill tone={u.role === "center_admin" ? "indigo" : "neutral"}>
                    {u.role.replace("_", " ")}
                  </Pill>
                </div>
                <div style={{ color: "#4C4A63", fontSize: 12.5, ...clip }}>
                  {u.orgKind === "center" ? u.orgName : "Individual"}
                </div>
                <div>
                  <Pill tone={PLAN_TONE[u.orgPlan]}>{PLAN_TIERS[u.orgPlan].name}</Pill>
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontWeight: 600,
                    color: u.practiceCount === 0 ? FAINT : INK,
                  }}
                >
                  {u.practiceCount}
                </div>
                <div style={{ color: SOFT, fontSize: 12.5 }}>{dateFmt(u.createdAt)}</div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <PlanControls
                    profileId={u.id}
                    name={u.name}
                    plan={u.orgPlan}
                    orgKind={u.orgKind}
                    orgName={u.orgName}
                    gradingLimit={u.gradingLimit}
                    generationLimit={u.generationLimit}
                    orgMemberCount={u.orgMemberCount}
                  />
                </div>
              </TableRow>
            ))}

            {rows.length === 0 ? <Empty>Nobody matches those filters.</Empty> : null}
          </div>
        </div>

        {/* ── pagination ─────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 18px",
            fontSize: 12.5,
            color: SOFT,
            background: HEAD_BG,
            borderTop: `1px solid ${LINE}`,
          }}
        >
          <span>
            {filtered.length === 0
              ? "Nothing to show"
              : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          </span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {safePage > 1 ? (
              <Link href={url({ page: safePage - 1 })} className="ad-act" style={{ color: "#4C4A63", textDecoration: "none" }}>
                ‹
              </Link>
            ) : (
              <span className="ad-act" style={{ color: "#CFCDC8", cursor: "default" }}>
                ‹
              </span>
            )}
            {safePage < pages ? (
              <Link href={url({ page: safePage + 1 })} className="ad-act" style={{ color: "#4C4A63", textDecoration: "none" }}>
                ›
              </Link>
            ) : (
              <span className="ad-act" style={{ color: "#CFCDC8", cursor: "default" }}>
                ›
              </span>
            )}
          </span>
        </div>
      </Card>
    </Surface>
  );
}
