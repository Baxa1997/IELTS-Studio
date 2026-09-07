import { requireOrgUser } from "@/lib/auth";
import { loadOwnAccount, loadSettings } from "@/lib/referrals/service";
import { STATUS_LABEL } from "@/lib/referrals/types";
import {
  BRAND,
  BRAND_LINE,
  BRAND_SOFT,
  cardStyle,
  INK,
  MUTED,
  SANS,
  SERIF,
} from "@/lib/theme/tokens";

import { ApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";

/**
 * The referral programme, from the referrer's side.
 *
 * Phase 2 of the plan: apply, and see where the application got to. The earnings
 * dashboard — link, copy button, signups vs upgrades, balance per currency — is
 * phase 5, and deliberately not faked here: a page that shows a $0.00 balance
 * before any attribution exists teaches people the feature is broken.
 */
export default async function ReferralsPage() {
  const { profile } = await requireOrgUser();
  const [account, settings] = await Promise.all([loadOwnAccount(profile.id), loadSettings()]);
  const percent = account?.percent ?? settings.defaultPercent;

  return (
    <div style={{ fontFamily: SANS, color: INK, maxWidth: 720 }}>
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: ".09em",
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        Referrals
      </div>
      <h1
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: "clamp(24px,2.6vw,32px)",
          lineHeight: 1.1,
          letterSpacing: "-.015em",
          margin: "6px 0 0",
          color: INK,
        }}
      >
        {account ? "Your application" : "Earn from people you bring in"}
      </h1>

      {account ? (
        <Status
          label={STATUS_LABEL[account.status]}
          code={account.code}
          note={account.reviewNote}
          percent={percent}
          status={account.status}
        />
      ) : (
        <>
          <p style={{ fontFamily: SANS, fontSize: 15.5, color: MUTED, margin: "8px 0 26px", lineHeight: 1.6 }}>
            Share a link, and when someone you sent upgrades, you take a cut of what they pay —
            every month they stay. Anyone can apply, on any plan.
          </p>
          <ApplyForm percent={percent} />
        </>
      )}
    </div>
  );
}

function Status({
  label,
  code,
  note,
  percent,
  status,
}: {
  label: string;
  code: string | null;
  note: string | null;
  percent: number;
  status: string;
}) {
  const live = status === "active";
  return (
    <div style={{ ...cardStyle, padding: 22, marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: SANS,
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: 999,
            background: BRAND_SOFT,
            border: `1px solid ${BRAND_LINE}`,
            color: BRAND,
          }}
        >
          {label}
        </span>
        {live ? (
          <span style={{ fontFamily: SANS, fontSize: 14, color: MUTED }}>
            You earn {percent}% of what your referrals pay.
          </span>
        ) : null}
      </div>

      {live && code ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>Your code</div>
          <div
            style={{
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
              fontSize: 22,
              fontWeight: 700,
              color: INK,
              marginTop: 4,
              letterSpacing: ".04em",
            }}
          >
            {code}
          </div>
        </div>
      ) : null}

      {note ? (
        <p style={{ fontFamily: SANS, fontSize: 14, color: MUTED, margin: "14px 0 0", lineHeight: 1.6 }}>
          {note}
        </p>
      ) : null}

      {status === "pending" ? (
        <p style={{ fontFamily: SANS, fontSize: 14, color: MUTED, margin: "14px 0 0", lineHeight: 1.6 }}>
          A person reads every application, so this takes a day or two rather than a moment.
        </p>
      ) : null}
    </div>
  );
}
