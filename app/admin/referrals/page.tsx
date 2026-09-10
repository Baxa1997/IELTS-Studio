import Link from "next/link";

import { Card, Empty, FAINT, HEAD_BG, INK, LINE, MUTED, PageTitle, ROW_RULE, SANS, SOFT, Surface, clip } from "@/components/admin/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { loadDecidedAccounts, loadPendingApplications, loadProgrammeTotals } from "@/lib/referrals/admin";
import { loadSettings } from "@/lib/referrals/service";
import { STATUS_LABEL, type ReferralAccount } from "@/lib/referrals/types";
import { BRAND, BRAND_LINE, BRAND_SOFT } from "@/lib/theme/tokens";

import { ProgrammeSummary } from "./summary";

export const dynamic = "force-dynamic";

type Tab = "waiting" | "active" | "closed";

/**
 * The referral queue.
 *
 * Approval is the ONLY gate on this programme — there is no plan requirement and
 * no automatic check — so this screen is the whole defence. It leads with what
 * is owed and what is unread, because those are the two states here that cost
 * something.
 *
 * TABS AND SEARCH ARE URL STATE, not component state, so this stays a server
 * component: no bundle, no hydration, works with JavaScript off, and a reviewer
 * can link somebody straight to a filtered view. The rows are deliberately thin
 * — the pitch is long-form and belongs on the detail page, where there is room
 * to read it properly next to the checks.
 */
export default async function AdminReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;
  const tab: Tab = params.tab === "active" || params.tab === "closed" ? params.tab : "waiting";
  const q = (params.q ?? "").trim().toLowerCase();

  const [pending, decided, totals, settings] = await Promise.all([
    loadPendingApplications(),
    loadDecidedAccounts(),
    loadProgrammeTotals(),
    loadSettings(),
  ]);

  const active = decided.filter((a) => a.status === "active");
  const closed = decided.filter((a) => a.status !== "active");
  const source = tab === "waiting" ? pending : tab === "active" ? active : closed;
  const rows = q ? source.filter((a) => matches(a, q)) : source;

  return (
    <Surface>
      <PageTitle
        eyebrow="Programme"
        title="Referrals"
        subtitle={`${settings.defaultPercent}% by default · ${settings.holdDays}-day hold · paid monthly`}
      />

      <ProgrammeSummary
        owed={totals.owed}
        waiting={totals.waiting}
        oldestWaiting={totals.oldestWaiting}
        active={totals.active}
        referredSignups={totals.referredSignups}
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <h2 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: INK, margin: 0, marginRight: "auto" }}>
          Applications
        </h2>

        {/* A GET form, so search survives with JavaScript off and the result
            is a linkable URL rather than a state nobody else can reach. */}
        <form method="get" style={{ display: "flex", gap: 6 }}>
          <input type="hidden" name="tab" value={tab} />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Find a person or code"
            aria-label="Find a person or code"
            style={{
              width: 210,
              border: `1px solid ${LINE}`,
              borderRadius: 999,
              padding: "8px 15px",
              fontFamily: SANS,
              fontSize: 13,
              color: INK,
              background: "#fff",
            }}
          />
        </form>

        <div style={{ display: "flex", padding: 3, borderRadius: 999, background: "#EDEBE6", gap: 2 }}>
          <TabLink to="waiting" now={tab} q={params.q} count={pending.length}>
            Waiting
          </TabLink>
          <TabLink to="active" now={tab} q={params.q} count={active.length}>
            Active
          </TabLink>
          <TabLink to="closed" now={tab} q={params.q} count={closed.length}>
            Closed
          </TabLink>
        </div>
      </div>

      <p style={{ fontSize: 12.5, color: FAINT, margin: "0 0 12px" }}>{NOTE[tab]}</p>

      <Card>
        {rows.length === 0 ? (
          <Empty>{q ? `Nothing matches “${params.q}”.` : EMPTY[tab]}</Empty>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: HEAD_BG }}>
                  <Th>Applicant</Th>
                  <Th>Audience</Th>
                  <Th>{tab === "waiting" ? "Applied" : "Decided"}</Th>
                  <Th align="right"> </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <Row key={a.id} account={a} tab={tab} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Surface>
  );
}

const NOTE: Record<Tab, string> = {
  waiting: "A person reads each one — there is no other check.",
  active: "Closing ends the link; revoking also reverses commission still on hold.",
  closed: "Closed links stop working. The ledger is left as it was.",
};

const EMPTY: Record<Tab, string> = {
  waiting: "Nothing waiting.",
  active: "No active partners yet.",
  closed: "Nothing closed.",
};

/** Name, login and code — the three things a reviewer would type. */
function matches(a: ReferralAccount, q: string): boolean {
  return [a.applicantName, a.applicantEmail, a.code, a.pitch]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

function Row({ account, tab }: { account: ReferralAccount; tab: Tab }) {
  const name = account.applicantName ?? account.applicantEmail ?? "Someone";
  const when = tab === "waiting" ? account.appliedAt : (account.reviewedAt ?? account.appliedAt);

  return (
    <tr style={{ borderTop: `1px solid ${ROW_RULE}` }}>
      <td style={{ padding: "14px 20px", minWidth: 220 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 2 }}>
          <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: INK }}>{name}</span>
          {account.status !== "pending" ? (
            <span
              style={{
                fontSize: 11.5,
                whiteSpace: "nowrap",
                padding: "3px 10px",
                borderRadius: 999,
                background: account.status === "active" ? BRAND_SOFT : "#F1F0EB",
                border: `1px solid ${account.status === "active" ? BRAND_LINE : LINE}`,
                color: account.status === "active" ? BRAND : MUTED,
              }}
            >
              {STATUS_LABEL[account.status]}
            </span>
          ) : null}
        </div>
        <div style={{ fontSize: 12, color: SOFT, ...clip }}>
          {account.code ? `code ${account.code} · ` : ""}
          {account.applicantEmail ?? "no contact email"}
        </div>
      </td>

      <td style={{ padding: "14px 20px", maxWidth: 340, fontSize: 13, color: MUTED, lineHeight: 1.45 }}>
        {account.pitch ? truncate(account.pitch, 130) : "—"}
      </td>

      <td style={{ padding: "14px 20px", fontSize: 13, color: MUTED, whiteSpace: "nowrap" }}>
        {new Date(when).toLocaleDateString("en", { day: "numeric", month: "short" })}
      </td>

      <td style={{ padding: "14px 20px", textAlign: "right" }}>
        <Link
          href={`/admin/referrals/${account.id}`}
          style={{
            display: "inline-block",
            border: `1px solid ${LINE}`,
            borderRadius: 999,
            padding: "7px 17px",
            fontFamily: SANS,
            fontSize: 13,
            color: INK,
            background: "#fff",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Open
        </Link>
      </td>
    </tr>
  );
}

function TabLink({
  to,
  now,
  q,
  count,
  children,
}: {
  to: Tab;
  now: Tab;
  q?: string;
  count: number;
  children: React.ReactNode;
}) {
  const on = to === now;
  const href = q ? `/admin/referrals?tab=${to}&q=${encodeURIComponent(q)}` : `/admin/referrals?tab=${to}`;
  return (
    <Link
      href={href}
      style={{
        padding: "7px 15px",
        borderRadius: 999,
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: on ? 600 : 500,
        whiteSpace: "nowrap",
        textDecoration: "none",
        background: on ? "#fff" : "transparent",
        color: on ? INK : MUTED,
        boxShadow: on ? "0 1px 2px rgba(0,0,0,.06)" : "none",
      }}
    >
      {children} {count}
    </Link>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      style={{
        textAlign: align ?? "left",
        fontFamily: SANS,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        color: SOFT,
        padding: "12px 20px",
      }}
    >
      {children}
    </th>
  );
}

function truncate(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`;
}
