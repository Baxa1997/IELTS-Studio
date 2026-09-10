import { BRAND, GREEN, HAIR, INK, LINE, MUTED, SANS, WHITE } from "@/lib/theme/tokens";
import { formatMoney, type CommissionRow } from "@/lib/referrals/types";

/**
 * Every commission, one row each.
 *
 * WHAT IS NOT IN THIS TABLE IS A DECISION, NOT AN OMISSION. The design had a
 * "Person" column and a "Their payment" column — Dilnoza R. paid $39.00, your
 * cut was $5.85. Both were dropped. `organization_id` is withheld from the
 * referrer's column grant on purpose, `referral_attributions` denies them
 * entirely, and the earnings email is tested never to name a payer; publishing
 * the same fact in a table would route around all three. The gross is the same
 * disclosure in different clothes — it says which plan somebody bought.
 *
 * A referrer generally knows who they sent. They do not get told what those
 * people spent.
 *
 * REVERSED ROWS STAY. They count toward no total, but a row that silently
 * disappeared from a statement is how a person decides the numbers are invented.
 */
export function Ledger({ rows, holdDays }: { rows: CommissionRow[]; holdDays: number }) {
  return (
    <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 460, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FBFBFC" }}>
              <Th>Earned</Th>
              <Th>Rate</Th>
              <Th>Your cut</Th>
              <Th align="right">Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderTop: `1px solid ${HAIR}` }}>
                <Td>{formatDate(row.earnedAt)}</Td>
                <Td muted>{row.percentApplied}%</Td>
                <Td
                  style={{
                    fontSize: 16.5,
                    fontWeight: 700,
                    color: row.state === "reversed" ? MUTED : BRAND,
                    fontVariantNumeric: "tabular-nums",
                    textDecoration: row.state === "reversed" ? "line-through" : "none",
                  }}
                >
                  {formatMoney(row.amountMinor, row.currency)}
                </Td>
                <Td align="right">
                  <StatusTag row={row} holdDays={holdDays} />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The four states a commission can be in, each saying what happens next. */
function StatusTag({ row, holdDays }: { row: CommissionRow; holdDays: number }) {
  const tone =
    row.state === "held"
      ? { bg: "#FDF6EA", fg: "#8A5A12" }
      : row.state === "reversed"
        ? { bg: "#F2F2F4", fg: MUTED }
        : { bg: "#EAF4EE", fg: GREEN };

  const label =
    row.state === "held"
      ? row.clearsAt
        ? `Clears ${formatDate(row.clearsAt)}`
        : `On ${holdDays}-day hold`
      : row.state === "released"
        ? "Ready"
        : row.state === "paid"
          ? "Paid out"
          : "Refunded";

  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: SANS,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        padding: "4px 12px",
        borderRadius: 999,
        background: tone.bg,
        color: tone.fg,
      }}
    >
      {label}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short" });
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      style={{
        textAlign: align ?? "left",
        fontFamily: SANS,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        color: MUTED,
        padding: "12px 20px",
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
        fontSize: 14.5,
        color: muted ? MUTED : INK,
        padding: "14px 20px",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </td>
  );
}
