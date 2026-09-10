import { requireOrgUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { loadEarnings, loadOwnAccount, loadSettings } from "@/lib/referrals/service";
import {
  formatMoney,
  payoutFloor,
  type CurrencyTotal,
  type Earnings,
  type ReferralAccount,
  type ReferralSettings,
} from "@/lib/referrals/types";
import {
  BRAND,
  BRAND_LINE,
  BRAND_SOFT,
  HAIR,
  INK,
  LINE,
  MUTED,
  SANS,
  SERIF,
  WHITE,
} from "@/lib/theme/tokens";

import { ApplyForm } from "./apply-form";
import { EarningsHero } from "./earnings-hero";
import { Ledger } from "./ledger";
import { PitchPanel } from "./pitch-panel";

export const dynamic = "force-dynamic";

/**
 * Referrals, from the referrer's side.
 *
 * THREE LAYOUTS, NOT ONE WITH THINGS DISABLED. Applying is a pitch beside a
 * form; earning is a dashboard; stopped is a receipt. Rendering a single layout
 * with the dead parts greyed out would make the first and last read as broken
 * rather than as what they are.
 *
 * The apply layout carries the waiting and rejected states too — the panel on
 * the left is the offer either way, and only the card beside it changes. That
 * keeps somebody who was turned down looking at the terms they might come back
 * for, rather than at an empty page.
 */
export default async function ReferralsPage() {
  const { profile } = await requireOrgUser();
  const [account, settings] = await Promise.all([loadOwnAccount(profile.id), loadSettings()]);
  /* EARNINGS ARE LOADED FOR A STOPPED ACCOUNT TOO.
     `pending` and `rejected` can never have earned anything, so they are the only
     states that skip this. `closed` and `revoked` can — and telling somebody
     their link is dead while showing them nothing about money they are still
     owed is the exact opposite of what stopping was supposed to mean. */
  const earnings =
    account && account.status !== "pending" && account.status !== "rejected"
      ? await loadEarnings(account.id)
      : null;
  const percent = account?.percent ?? settings.defaultPercent;
  const earning = account?.status === "active" && earnings;

  return (
    <div style={{ fontFamily: SANS, color: INK }}>
      <Eyebrow>Referrals</Eyebrow>
      <h1
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: "clamp(24px,2.6vw,32px)",
          lineHeight: 1.08,
          letterSpacing: "-.015em",
          margin: "6px 0 0",
          color: INK,
        }}
      >
        {earning ? "Your referrals" : "Earn from people you bring in"}
      </h1>

      {earning ? (
        <Active account={account} earnings={earnings} percent={percent} settings={settings} />
      ) : account && (account.status === "closed" || account.status === "revoked") ? (
        <Stopped account={account} earnings={earnings} settings={settings} />
      ) : (
        <ApplySplit account={account} percent={percent} settings={settings} />
      )}
    </div>
  );
}

/* ── applying: the offer, and whatever stage the application is at ────────── */

function ApplySplit({
  account,
  percent,
  settings,
}: {
  account: ReferralAccount | null;
  percent: number;
  settings: ReferralSettings;
}) {
  return (
    <div
      className="lp-cols-2"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)",
        gap: 20,
        alignItems: "stretch",
        marginTop: 18,
      }}
    >
      <PitchPanel percent={percent} settings={settings} />

      <div style={{ ...card, padding: 28, display: "flex", flexDirection: "column" }}>
        {!account ? (
          <>
            <h2 style={{ ...h2, marginBottom: 4 }}>Apply</h2>
            <p style={{ fontSize: 14.5, color: MUTED, margin: "0 0 20px", lineHeight: 1.55 }}>
              A person reads every application — usually within two working days. There is no plan
              requirement and no automatic approval.
            </p>
            <ApplyForm />
          </>
        ) : account.status === "pending" ? (
          <>
            <Badge>Waiting for review</Badge>
            <h2 style={{ ...h2, margin: "14px 0 8px" }}>Your application is with a reviewer</h2>
            <p style={{ fontSize: 14.5, color: MUTED, margin: "0 0 18px", lineHeight: 1.6 }}>
              Sent {formatDate(account.appliedAt)}. We&apos;ll write to you either way — you can
              have one application open at a time, so there is nothing else to send.
            </p>
            <Well>Approved applications get a link and code the same day.</Well>
          </>
        ) : (
          <>
            <Badge tone="neutral">Not approved</Badge>
            <h2 style={{ ...h2, margin: "14px 0 8px" }}>
              {account.reviewedAt ? `Reviewed on ${formatDate(account.reviewedAt)}` : "Reviewed"}
            </h2>
            {account.reviewNote ? (
              <p
                style={{
                  fontSize: 15.5,
                  lineHeight: 1.6,
                  color: INK,
                  borderLeft: `3px solid ${BRAND_LINE}`,
                  paddingLeft: 14,
                  margin: "0 0 18px",
                }}
              >
                {account.reviewNote}
              </p>
            ) : (
              <p style={{ fontSize: 14.5, color: MUTED, margin: "0 0 18px", lineHeight: 1.6 }}>
                We didn&apos;t approve this one.
              </p>
            )}
            {/* No "apply again" button. `profile_id` is unique on
                `referral_accounts` — one row per person, for good — so a second
                application is refused by the database. Offering a button that
                cannot work would be worse than saying so. */}
            <Well>
              Get in touch if your audience changes and you&apos;d like this looked at again.
            </Well>
          </>
        )}
      </div>
    </div>
  );
}

/* ── earning ──────────────────────────────────────────────────────────────── */

function Active({
  account,
  earnings,
  percent,
  settings,
}: {
  account: ReferralAccount;
  earnings: Earnings;
  percent: number;
  settings: ReferralSettings;
}) {
  const url = `${serverEnv.siteUrl}/?ref=${account.code}`;
  // Averaged inside one currency only — the busiest one. There is no rate in
  // this system to average across two with.
  const busiest = [...earnings.totals].sort((a, b) => b.count - a.count)[0] ?? null;
  const average = busiest
    ? formatMoney(
        Math.round(
          (busiest.pendingMinor + busiest.payableMinor + busiest.paidMinor) / busiest.count,
        ),
        busiest.currency,
      )
    : "—";

  return (
    <>
      <EarningsHero
        totals={earnings.totals}
        settings={settings}
        url={url}
        code={account.code ?? ""}
      />

      {/* Three figures, and signups is kept apart from upgrades on purpose:
          most referrals never pay, and one merged number would read as a bug to
          somebody who had brought in thirty people and earned nothing. */}
      <div
        className="lp-cols-3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,minmax(0,1fr))",
          gap: 14,
          margin: "14px 0 34px",
        }}
      >
        <Stat value={String(earnings.signups)} label="Signed up through your link" />
        <Stat value={String(earnings.converted)} label="Upgraded — each earned you once" />
        <Stat value={average} label="Average per upgrade" />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <h2 style={h2}>Earnings</h2>
        <span style={{ fontSize: 13.5, color: MUTED }}>
          {payoutLine(earnings.totals, settings)}
        </span>
      </div>

      {earnings.rows.length === 0 ? (
        <Nothing />
      ) : (
        <Ledger rows={earnings.rows} holdDays={settings.holdDays} />
      )}

      {/* <p style={{ fontSize: 13, color: MUTED, margin: "16px 0 0", lineHeight: 1.6, maxWidth: "74ch" }}>
        You earn once per person — their first payment only, not their later months. Commission is
        held for {settings.holdDays} days in case that payment is refunded, then paid out{" "}
        <strong>once a month</strong> on balances over {formatMoney(settings.minPayoutMinor, "usd")}{" "}
        ({formatMoney(settings.minPayoutUzsMinor, "uzs")}). Totals stay in the currency they were
        earned in — there is no conversion between them. Your rate is {percent}%.
      </p> */}
    </>
  );
}

/* ── stopped: the link is dead, the money is not ──────────────────────────── */

function Stopped({
  account,
  earnings,
  settings,
}: {
  account: ReferralAccount;
  earnings: Earnings | null;
  settings: ReferralSettings;
}) {
  const owed = (earnings?.totals ?? []).filter(
    (t) => t.pendingMinor + t.payableMinor + t.paidMinor > 0,
  );

  return (
    <>
      <div style={{ ...card, padding: 26, marginTop: 18, maxWidth: 640 }}>
        <Badge tone="neutral">{account.status === "revoked" ? "Revoked" : "Closed"}</Badge>
        <p style={{ fontSize: 15, color: INK, margin: "14px 0 0", lineHeight: 1.6 }}>
          {/* Both stops say the same thing to the referrer, because from their
              side the consequence is identical: the link is dead and the money
              that already cleared is still theirs. */}
          Your link and code have stopped working. Anything you had already earned and cleared is
          still yours, and still goes out in the next monthly payout.
        </p>
        {account.reviewNote ? (
          <p
            style={{
              fontSize: 14,
              color: INK,
              margin: "14px 0 0",
              padding: "12px 14px",
              background: BRAND_SOFT,
              border: `1px solid ${BRAND_LINE}`,
              borderRadius: 11,
              lineHeight: 1.6,
            }}
          >
            {account.reviewNote}
          </p>
        ) : null}
      </div>

      {owed.length > 0 ? (
        <div style={{ maxWidth: 640 }}>
          <h2 style={{ ...h2, fontSize: 20, margin: "28px 0 12px" }}>Still yours</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {owed.map((t) => (
              <Money key={t.currency} total={t} settings={settings} />
            ))}
          </div>
          {earnings && earnings.rows.length > 0 ? (
            <div style={{ marginTop: 14 }}>
              <Ledger rows={earnings.rows} holdDays={settings.holdDays} />
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

/** One currency. Never added to another — there is no rate here to add with. */
function Money({ total, settings }: { total: CurrencyTotal; settings: ReferralSettings }) {
  const ready = total.payableMinor >= payoutFloor(settings, total.currency);
  return (
    <div style={{ ...card, padding: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".1em", color: MUTED }}>
          {total.currency.toUpperCase()}
        </span>
        {ready ? <Badge>In the next payout</Badge> : null}
      </div>
      <div
        className="lp-cols-3"
        style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 14 }}
      >
        <Amount label="On hold" value={formatMoney(total.pendingMinor, total.currency)} muted />
        <Amount label="Ready" value={formatMoney(total.payableMinor, total.currency)} />
        <Amount label="Paid out" value={formatMoney(total.paidMinor, total.currency)} muted />
      </div>
    </div>
  );
}

/** The line beside the Earnings heading: what is going out, and what is not. */
function payoutLine(totals: CurrencyTotal[], settings: ReferralSettings): string {
  const ready = totals.filter((t) => t.payableMinor >= payoutFloor(settings, t.currency));
  const held = totals.filter((t) => t.pendingMinor > 0);
  if (ready.length === 0 && held.length === 0) return "Nothing due yet";

  const parts: string[] = [];
  if (ready.length > 0) {
    parts.push(
      `${ready.map((t) => formatMoney(t.payableMinor, t.currency)).join(" + ")} in the next payout`,
    );
  }
  if (held.length > 0) {
    parts.push(
      `${held.map((t) => formatMoney(t.pendingMinor, t.currency)).join(" + ")} still on hold`,
    );
  }
  return parts.join(" · ");
}

/* ── small pieces ─────────────────────────────────────────────────────────── */

const card: React.CSSProperties = {
  background: WHITE,
  border: `1px solid ${LINE}`,
  borderRadius: 16,
};

const h2: React.CSSProperties = {
  fontFamily: SERIF,
  fontWeight: 600,
  fontSize: 26,
  lineHeight: 1.15,
  letterSpacing: "-.015em",
  color: INK,
  margin: 0,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "long" });
}

function Nothing() {
  return (
    <div style={{ ...card, padding: "44px 24px", textAlign: "center" }}>
      <div
        style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 22, color: INK, marginBottom: 4 }}
      >
        Nothing yet
      </div>
      <p style={{ fontSize: 14.5, color: MUTED, margin: 0 }}>
        When a referral pays, your share shows up here.
      </p>
    </div>
  );
}

function Well({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: "auto",
        background: "#FBFBFC",
        border: `1px solid ${HAIR}`,
        borderRadius: 12,
        padding: "14px 16px",
        fontSize: 13.5,
        color: MUTED,
        lineHeight: 1.55,
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".09em",
        textTransform: "uppercase",
        color: MUTED,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "neutral" }) {
  const neutral = tone === "neutral";
  return (
    <span
      style={{
        alignSelf: "flex-start",
        display: "inline-block",
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: ".05em",
        padding: "4px 12px",
        borderRadius: 999,
        background: neutral ? "#F2F2F4" : BRAND_SOFT,
        border: `1px solid ${neutral ? HAIR : BRAND_LINE}`,
        color: neutral ? MUTED : BRAND,
      }}
    >
      {children}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ ...card, padding: "20px 22px" }}>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 34,
          lineHeight: 1.1,
          color: INK,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13.5, color: MUTED, marginTop: 6, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

function Amount({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: MUTED }}>{label}</div>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 20,
          color: muted ? MUTED : INK,
          marginTop: 4,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}
