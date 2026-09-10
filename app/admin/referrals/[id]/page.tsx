import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Card,
  FAINT,
  HEAD_BG,
  INK,
  LINE,
  MUTED,
  ROW_RULE,
  RULE,
  SANS,
  SERIF,
  SOFT,
  Surface,
  clip,
} from "@/components/admin/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { loadAccountDetail, loadSettings, type Check } from "@/lib/referrals/service";
import { formatMoney, STATUS_LABEL } from "@/lib/referrals/types";
import type { AdminLedgerRow } from "@/lib/referrals/service";
import { BRAND, BRAND_LINE, BRAND_SOFT } from "@/lib/theme/tokens";

import { DecisionBar } from "../decision-bar";

export const dynamic = "force-dynamic";

/**
 * One application, with everything a decision needs on one screen.
 *
 * THE CHECKS PANEL IS THE HEART OF IT, and it is shorter than the design's.
 * That mock listed "31 signups across 27 devices — no shared device or IP",
 * which would be the single most useful line here and is the one this cannot
 * write: nothing in the schema records an IP, a device or a fingerprint.
 * Printing it anyway would show a reviewer a fraud check that never ran, dressed
 * as one that passed — worse than leaving it out, which is what happens instead.
 *
 * Every check is computed from data that exists, and each states what it
 * observed rather than reaching a verdict. The verdict is the reviewer's, which
 * is the entire premise of a hand-reviewed programme.
 */
export default async function ReferralDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const [detail, settings] = await Promise.all([loadAccountDetail(id), loadSettings()]);
  if (!detail) notFound();

  const { account, checks, ledger, profile } = detail;
  const name = account.applicantName ?? account.applicantEmail ?? "Someone";
  const live = account.status === "active";
  const owedLead = detail.owed[0] ?? null;

  return (
    <Surface>
      <Link
        href="/admin/referrals"
        style={{ fontFamily: SANS, fontSize: 13, color: BRAND, textDecoration: "none" }}
      >
        ← Applications
      </Link>

      <Card style={{ padding: "24px 26px", margin: "14px 0 18px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
              <h1
                style={{
                  fontFamily: SERIF,
                  fontSize: 31,
                  fontWeight: 700,
                  lineHeight: 1.12,
                  letterSpacing: "-.01em",
                  margin: 0,
                  color: INK,
                }}
              >
                {name}
              </h1>
              <span
                style={{
                  fontSize: 11.5,
                  whiteSpace: "nowrap",
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: live ? BRAND_SOFT : "#F1F0EB",
                  border: `1px solid ${live ? BRAND_LINE : LINE}`,
                  color: live ? BRAND : MUTED,
                }}
              >
                {STATUS_LABEL[account.status]}
              </span>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: SOFT, marginTop: 6, ...clip }}>
              Applied {longDate(account.appliedAt)}
              {account.code ? ` · code ${account.code}` : ""}
              {` · ${account.percent ?? settings.defaultPercent}% rate`}
              {account.reviewedAt ? ` · reviewed ${longDate(account.reviewedAt)}` : ""}
            </div>
          </div>

          <DecisionBar account={account} defaultPercent={settings.defaultPercent} />
        </div>

        {account.status === "rejected" ? (
          <p style={{ fontFamily: SANS, fontSize: 13, color: MUTED, margin: "16px 0 0", lineHeight: 1.55 }}>
            Turned down. One row per person is enforced by the database, so there is no second
            application to review — letting them back in means reopening this one.
          </p>
        ) : account.status === "closed" || account.status === "revoked" ? (
          <p style={{ fontFamily: SANS, fontSize: 13, color: MUTED, margin: "16px 0 0", lineHeight: 1.55 }}>
            Their link and code no longer resolve. Money already on the ledger is untouched by this
            screen.
          </p>
        ) : null}

        <div
          className="sa-kpis"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,minmax(0,1fr))",
            gap: 1,
            background: RULE,
            border: `1px solid ${RULE}`,
            borderRadius: 12,
            overflow: "hidden",
            marginTop: 22,
          }}
        >
          <Cell
            value={owedLead ? formatMoney(owedLead.pendingMinor + owedLead.payableMinor, owedLead.currency) : "$0.00"}
            label="Commission owed"
            accent
          />
          <Cell value={String(detail.signups)} label="Signed up" />
          <Cell value={String(detail.upgraded)} label="Upgraded" />
          <Cell value={String(detail.refunded)} label="Refunded" />
        </div>
      </Card>

      <div
        className="sa-split"
        style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.5fr)", gap: 18, alignItems: "start" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Card style={{ padding: "20px 22px" }}>
            <Label>Applicant</Label>
            {profile.map((r) => (
              <div
                key={r.k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  fontFamily: SANS,
                  fontSize: 13.5,
                  padding: "9px 0",
                  borderTop: `1px solid ${ROW_RULE}`,
                }}
              >
                <span style={{ color: MUTED }}>{r.k}</span>
                <span style={{ color: INK, textAlign: "right", ...clip }}>{r.v}</span>
              </div>
            ))}
          </Card>

          <Card style={{ padding: "20px 22px" }}>
            <Label>Checks</Label>
            {checks.map((c, i) => (
              <CheckLine key={i} check={c} />
            ))}
            <p style={{ fontFamily: SANS, fontSize: 11.5, color: FAINT, margin: "12px 0 0", lineHeight: 1.5 }}>
              No device or IP check: none is recorded anywhere, so there is nothing to compare.
            </p>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Card style={{ padding: "20px 22px" }}>
            <Label>What they wrote</Label>
            {account.pitch ? (
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: 15.5,
                  lineHeight: 1.6,
                  color: INK,
                  margin: "0 0 12px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {account.pitch}
              </p>
            ) : (
              <p style={{ fontFamily: SANS, fontSize: 14, color: MUTED, margin: "0 0 12px" }}>
                Nothing written.
              </p>
            )}
            {account.audienceUrl ? (
              <a
                href={account.audienceUrl}
                target="_blank"
                rel="noreferrer nofollow noopener"
                style={{ fontFamily: SANS, fontSize: 14, color: BRAND }}
              >
                {account.audienceUrl}
              </a>
            ) : (
              <span style={{ fontFamily: SANS, fontSize: 13, color: FAINT }}>No audience link given.</span>
            )}
          </Card>

          {account.reviewNote ? (
            <Card style={{ padding: "20px 22px" }}>
              <Label>Reviewer&apos;s note</Label>
              <p style={{ fontFamily: SANS, fontSize: 14, color: INK, margin: 0, lineHeight: 1.6 }}>
                {account.reviewNote}
              </p>
            </Card>
          ) : null}

          <Card>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 16,
                padding: "18px 22px 12px",
                flexWrap: "wrap",
              }}
            >
              <Label style={{ marginBottom: 0 }}>Referrals and commission</Label>
              <span style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>
                {detail.owed.length === 0
                  ? "nothing owed"
                  : `owed ${detail.owed
                      .map((t) => formatMoney(t.pendingMinor + t.payableMinor, t.currency))
                      .join(" + ")}`}
              </span>
            </div>

            {ledger.length === 0 ? (
              <p style={{ fontFamily: SANS, fontSize: 13.5, color: MUTED, padding: "0 22px 20px", margin: 0 }}>
                Nobody has signed up through this link yet.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: HEAD_BG }}>
                      <Th>Person</Th>
                      <Th>Signed up</Th>
                      <Th>Upgraded</Th>
                      <Th>Commission</Th>
                      <Th align="right">State</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((r) => (
                      <LedgerRow key={r.organizationId} row={r} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p style={{ fontFamily: SANS, fontSize: 11.5, color: FAINT, margin: 0, padding: "12px 22px 18px", lineHeight: 1.5 }}>
              Balances stay in the currency they were earned in — there is no rate in this system to
              convert between them. Revoking reverses everything still inside its {settings.holdDays}-day
              hold; money already paid out is left alone.
            </p>
          </Card>
        </div>
      </div>
    </Surface>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────────── */

function CheckLine({ check }: { check: Check }) {
  const look = check.level === "look";
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "baseline", padding: "10px 0", borderTop: `1px solid ${ROW_RULE}` }}>
      <span
        style={{
          flex: "none",
          fontFamily: SANS,
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: "nowrap",
          padding: "3px 10px",
          borderRadius: 999,
          background: look ? "#FDF6EA" : "#EAF4EE",
          color: look ? "#8A5A12" : "#16794C",
        }}
      >
        {look ? "look" : "ok"}
      </span>
      <span style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.45, color: INK }}>{check.label}</span>
    </div>
  );
}

function LedgerRow({ row }: { row: AdminLedgerRow }) {
  const tone =
    row.state === "free"
      ? { bg: "#F1F0EB", fg: MUTED, label: "free" }
      : row.state === "held"
        ? { bg: "#FDF6EA", fg: "#8A5A12", label: "on hold" }
        : row.state === "reversed"
          ? { bg: "#F1F0EB", fg: MUTED, label: "refunded" }
          : row.state === "paid"
            ? { bg: "#EAF4EE", fg: "#16794C", label: "paid out" }
            : { bg: "#EAF4EE", fg: "#16794C", label: "ready" };

  return (
    <tr style={{ borderTop: `1px solid ${ROW_RULE}` }}>
      <Td>{row.who}</Td>
      <Td muted>{shortDate(row.joinedAt)}</Td>
      <Td muted>{row.upgradedAt ? shortDate(row.upgradedAt) : "—"}</Td>
      <Td
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: row.state === "reversed" || row.amountMinor == null ? MUTED : BRAND,
          fontVariantNumeric: "tabular-nums",
          textDecoration: row.state === "reversed" ? "line-through" : "none",
        }}
      >
        {row.amountMinor != null && row.currency ? formatMoney(row.amountMinor, row.currency) : "—"}
      </Td>
      <Td align="right">
        <span
          style={{
            fontFamily: SANS,
            fontSize: 11.5,
            whiteSpace: "nowrap",
            padding: "3px 11px",
            borderRadius: 999,
            background: tone.bg,
            color: tone.fg,
          }}
        >
          {tone.label}
        </span>
      </Td>
    </tr>
  );
}

function Cell({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div style={{ background: "#fff", padding: "16px 18px" }}>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 27,
          lineHeight: 1.12,
          color: accent ? BRAND : INK,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 11,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        fontWeight: 600,
        color: SOFT,
        marginBottom: 8,
        ...style,
      }}
    >
      {children}
    </div>
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
        padding: "11px 22px",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
  muted,
  style,
}: {
  children: React.ReactNode;
  align?: "right";
  muted?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        textAlign: align ?? "left",
        fontFamily: SANS,
        fontSize: 13.5,
        color: muted ? MUTED : INK,
        padding: "13px 22px",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </td>
  );
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short" });
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}
