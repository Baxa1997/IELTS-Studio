import { requireOrgUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { loadEarnings, loadOwnAccount, loadSettings } from "@/lib/referrals/service";
import {
  formatMoney,
  payoutFloor,
  STATUS_LABEL,
  type CurrencyTotal,
  type Earnings,
  type ReferralAccount,
  type ReferralSettings,
} from "@/lib/referrals/types";
import { BRAND, BRAND_LINE, BRAND_SOFT, INK, LINE, MONO, MUTED, SANS, SERIF } from "@/lib/theme/tokens";

import { ApplyForm } from "./apply-form";
import { ShareCard } from "./share-card";

export const dynamic = "force-dynamic";

/**
 * Referrals, from the referrer's side.
 *
 * FOUR STATES, AND EACH ONE IS A DIFFERENT PAGE. Never applied is a pitch with a
 * form; waiting is a holding note; active is a dashboard; stopped is a receipt.
 * Rendering one layout with everything disabled would make the first and last of
 * those read as broken rather than as what they are.
 *
 * The active view leads with the LINK, because that is the only thing on this
 * page a person came here to do something with — the numbers underneath report
 * on it. Signups and upgrades are two separate figures on purpose: most
 * referrals never pay, and a single number would read as a bug to somebody who
 * had brought in thirty people and earned nothing.
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
        {account?.status === "active" ? "Your referrals" : "Earn from people you bring in"}
      </h1>

      {!account ? (
        <Pitch percent={percent} settings={settings} />
      ) : account.status === "active" && earnings ? (
        <Active account={account} earnings={earnings} percent={percent} settings={settings} />
      ) : (
        <Waiting account={account} earnings={earnings} settings={settings} />
      )}
    </div>
  );
}

/* ── never applied ────────────────────────────────────────────────────────── */

function Pitch({ percent, settings }: { percent: number; settings: ReferralSettings }) {
  return (
    <>
      <p style={{ fontSize: 15.5, color: MUTED, margin: "8px 0 24px", lineHeight: 1.6, maxWidth: 560 }}>
        Share a link. When someone you sent upgrades, you take <strong>{percent}%</strong> of their
        first payment — once for each person you bring in. Anyone can apply, on any plan.
      </p>
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 26 }}>
        <Note title="A person reads every application">
          There is no automatic approval and no plan requirement. Tell us where you would share it
          and we will come back to you.
        </Note>
        <Note title="Paid out monthly">
          Held for {settings.holdDays} days in case the payment is refunded, then included in the
          next monthly payout.
        </Note>
      </div>
      <ApplyForm percent={percent} />
    </>
  );
}

/* ── applied, but not earning ─────────────────────────────────────────────── */

function Waiting({
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
    <div style={{ ...card, marginTop: 20, maxWidth: 620 }}>
      <Badge>{STATUS_LABEL[account.status]}</Badge>
      <p style={{ fontSize: 14.5, color: MUTED, margin: "14px 0 0", lineHeight: 1.6 }}>
        {account.status === "pending"
          ? "A person reads every application, so this takes a day or two rather than a moment."
          : account.status === "rejected"
            ? "We didn't approve this one. You're welcome to ask again if things change."
            : /* Both stops say the same thing to the referrer, because from their
                 side the consequence is identical: the link is dead and the money
                 that already cleared is still theirs. */
              "Your link and code have stopped working. Anything you had already earned and cleared is still yours."}
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

    {/* The money survives the stop, so it stays on the page. Without this the
        promise made when an account is closed — "anything you had already
        earned is still yours" — is a sentence with nothing behind it. */}
    {owed.length > 0 ? (
      <div style={{ maxWidth: 620 }}>
        <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: INK, margin: "26px 0 12px" }}>
          Still yours
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {owed.map((t) => (
            <Money key={t.currency} total={t} settings={settings} />
          ))}
        </div>
      </div>
    ) : null}
    </>
  );
}

/* ── active ───────────────────────────────────────────────────────────────── */

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
  return (
    <>
      {/* The hero: the one thing here that is an action, not a report. */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(120deg,#2C0013 0%,#7D0132 62%,#9B1044 100%)",
          borderRadius: 18,
          padding: "24px 26px",
          marginTop: 18,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -90,
            right: -40,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(255,255,255,.14),transparent 62%)",
          }}
        />
        <div style={{ position: "relative", maxWidth: 620 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".11em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.72)",
              marginBottom: 16,
            }}
          >
            You earn {percent}% of each referral&apos;s first payment
          </div>
          <ShareCard url={url} code={account.code ?? ""} />
        </div>
      </div>

      {/* Two figures, never one. */}
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Stat value={String(earnings.signups)} label="Signed up through your link" />
        <Stat
          value={String(earnings.converted)}
          label="Upgraded — each earned you once"
          note={
            earnings.signups > 0 && earnings.converted === 0
              ? "Nobody has upgraded yet — commission only comes from an actual payment."
              : undefined
          }
        />
      </div>

      <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: INK, margin: "26px 0 12px" }}>
        Earnings
      </h2>
      {earnings.totals.length === 0 ? (
        <div style={{ ...card, fontSize: 14.5, color: MUTED }}>
          Nothing yet. When a referral pays, your share shows up here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {earnings.totals.map((t) => (
            <Money key={t.currency} total={t} settings={settings} />
          ))}
        </div>
      )}

      <p style={{ fontSize: 13, color: MUTED, margin: "18px 0 0", lineHeight: 1.6, maxWidth: 620 }}>
        You earn once per person — their first payment only, not their later months. Commission is
        held for {settings.holdDays} days in case that payment is refunded, and is paid out{" "}
        <strong>once a month</strong> on balances over {formatMoney(settings.minPayoutMinor, "usd")}{" "}
        (or {formatMoney(settings.minPayoutUzsMinor, "uzs")}).
        If a referral&apos;s payment is refunded before you have been paid, that commission is taken
        back. Totals stay in the currency they were earned in.
      </p>
    </>
  );
}

/** One currency. Never added to another — there is no rate here to add with. */
function Money({ total, settings }: { total: CurrencyTotal; settings: ReferralSettings }) {
  const ready = total.payableMinor >= payoutFloor(settings, total.currency);
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, letterSpacing: ".1em", color: MUTED }}>
          {total.currency.toUpperCase()}
        </span>
        {ready ? <Badge>In the next payout</Badge> : null}
      </div>
      <div className="lp-cols-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 14 }}>
        <Amount label="On hold" value={formatMoney(total.pendingMinor, total.currency)} muted />
        <Amount label="Ready" value={formatMoney(total.payableMinor, total.currency)} />
        <Amount label="Paid out" value={formatMoney(total.paidMinor, total.currency)} muted />
      </div>
    </div>
  );
}

/* ── small pieces ─────────────────────────────────────────────────────────── */

const card: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${LINE}`,
  borderRadius: 16,
  padding: 18,
};

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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
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
      {children}
    </span>
  );
}

function Stat({ value, label, note }: { value: string; label: string; note?: string }) {
  return (
    <div style={card}>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 34,
          lineHeight: 1,
          color: INK,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13.5, color: MUTED, marginTop: 8 }}>{label}</div>
      {note ? <div style={{ fontSize: 12.5, color: MUTED, marginTop: 6, lineHeight: 1.5 }}>{note}</div> : null}
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

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: INK }}>{title}</div>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "6px 0 0", lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}
