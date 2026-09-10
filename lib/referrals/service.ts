import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { generateCode, normalizeCode } from "./code";
import { notifyApproved, notifyRejected } from "./notify";
import { commissionState } from "./types";
import type {
  CommissionRow,
  CommissionStatus,
  CurrencyTotal,
  Earnings,
  ReferralAccount,
  ReferralSettings,
  ReviewDecision,
} from "./types";

/**
 * The referral programme's server side.
 *
 * ONE RULE RUNS THROUGH ALL OF IT: a client may create an application and read
 * its own rows, and nothing else. Every state change here goes through the
 * service-role client, because `status`, `percent` and `code` are not in the
 * column grants (see 20260907120000_referrals.sql) — a client write of them
 * fails at the database, not at a check somebody remembered to add.
 */

/** A commission as the three aggregate readers below select it. */
interface CommissionQueryRow {
  id?: string;
  amount_minor: number | string;
  currency: string;
  status: CommissionStatus;
  percent_applied?: number | string;
  payable_after: string | null;
  created_at?: string;
  organization_id?: string | null;
}

/** The platform defaults. One row, seeded by the migration. */
export async function loadSettings(): Promise<ReferralSettings> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_settings")
    .select("default_percent, hold_days, min_payout_minor, min_payout_uzs_minor, cookie_days")
    .eq("id", true)
    .single();

  // The migration seeds this row, so a miss means the migration has not been
  // applied. Falling back keeps the page up rather than 500ing on a value that
  // has a sensible default anyway.
  return {
    defaultPercent: Number(data?.default_percent ?? 15),
    holdDays: data?.hold_days ?? 7,
    minPayoutMinor: data?.min_payout_minor ?? 2000,
    minPayoutUzsMinor: data?.min_payout_uzs_minor ?? 25_000_000,
    cookieDays: data?.cookie_days ?? 90,
  };
}

/** The caller's own referral account, or null if they have never applied. */
export async function loadOwnAccount(profileId: string): Promise<ReferralAccount | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_accounts")
    .select("id, code, status, percent, pitch, audience_url, applied_at, reviewed_at, review_note")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data ? toAccount(data) : null;
}

/**
 * File an application.
 *
 * Deliberately does NOT take a status or a percent: this writes the applicant's
 * case and nothing else, and the row lands `pending` on the column default.
 * Returns a message rather than throwing so the form can render it.
 */
export async function applyToRefer(args: {
  profileId: string;
  organizationId: string;
  pitch: string;
  audienceUrl: string | null;
}): Promise<{ error: string | null }> {
  const pitch = args.pitch.trim();
  if (pitch.length < 20) {
    return { error: "Tell us a little more about where you'd share it — a sentence or two." };
  }
  if (pitch.length > 2000) return { error: "That's longer than we need — 2000 characters or fewer." };

  const url = args.audienceUrl?.trim() || null;
  if (url && !/^https?:\/\/\S+$/i.test(url)) {
    return { error: "That link doesn't look right. Include the https:// part." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("referral_accounts").insert({
    profile_id: args.profileId,
    organization_id: args.organizationId,
    pitch,
    audience_url: url,
  });

  // profile_id is unique — one code per person — so a second application is a
  // duplicate-key error rather than a second row.
  if (error?.code === "23505") return { error: "You've already applied. We'll be in touch." };
  if (error) return { error: `Couldn't send that: ${error.message}` };
  return { error: null };
}

/** Everything waiting on a decision, oldest first — a queue, not a list. */
export async function loadPendingApplications(): Promise<ReferralAccount[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_accounts")
    .select("id, code, status, percent, pitch, audience_url, applied_at, reviewed_at, review_note, profiles(full_name, contact_email)")
    .eq("status", "pending")
    .order("applied_at", { ascending: true });
  return (data ?? []).map(toAccount);
}

/** Everyone already approved, plus the ones that were stopped. */
export async function loadDecidedAccounts(): Promise<ReferralAccount[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_accounts")
    .select("id, code, status, percent, pitch, audience_url, applied_at, reviewed_at, review_note, profiles(full_name, contact_email)")
    .neq("status", "pending")
    .order("reviewed_at", { ascending: false })
    .limit(200);
  return (data ?? []).map(toAccount);
}

/**
 * Approve, reject, or stop one application.
 *
 * APPROVING MINTS THE CODE, and it is minted here rather than chosen by the
 * applicant: a free-text code needs an impersonation and profanity blocklist in
 * three languages before it can be safe, and that is not worth blocking the
 * programme on. Retries on collision — the space is large, but "large" is not
 * "never".
 *
 * BOTH STOPS END FUTURE EARNING. The link stops resolving and accrual refuses
 * any status but `active`, so a stopped referrer earns nothing more — not even
 * from somebody they had already introduced who pays next week. They differ only
 * in what happens to money already on the ledger: `closed` leaves it alone,
 * `revoked` reverses everything still `pending` (the abuse case). Neither
 * touches `paid` — that money has left.
 */
export async function decideApplication(args: {
  accountId: string;
  decision: ReviewDecision;
  note: string | null;
  reviewerId: string | null;
  /** An override for this account, or null to leave whatever it has. Only ever
   *  applied on `approve` — changing somebody's rate while closing them would
   *  be a silent rewrite of what they were owed. */
  percent?: number | null;
}): Promise<{ error: string | null; notice: string | null }> {
  const admin = createAdminClient();

  const { data: account } = await admin
    .from("referral_accounts")
    .select("id, status, code")
    .eq("id", args.accountId)
    .single();
  if (!account) return { error: "That application no longer exists.", notice: null };

  const now = new Date().toISOString();
  const base = { reviewed_at: now, reviewed_by: args.reviewerId, review_note: args.note };

  if (args.decision === "approve") {
    if (account.status === "active") return { error: null, notice: "Already approved." };
    const code = account.code ?? (await mintCode(admin));
    if (!code) return { error: "Couldn't allocate a code. Try again.", notice: null };
    /* THE RATE IS SET AT APPROVAL, and only here. `percent_applied` is copied
       onto every commission at accrual, so changing this later moves nobody's
       existing money — which is the behaviour we want, and the reason a rate
       change is not offered anywhere a ledger already exists. */
    const rateOverride =
      typeof args.percent === "number" && Number.isFinite(args.percent) ? args.percent : null;
    if (rateOverride !== null && (rateOverride <= 0 || rateOverride > 100)) {
      return { error: "A rate has to be between 1 and 100.", notice: null };
    }

    const { error } = await admin
      .from("referral_accounts")
      .update({
        ...base,
        status: "active",
        code,
        stopped_at: null,
        ...(rateOverride !== null ? { percent: rateOverride } : null),
      })
      .eq("id", args.accountId);
    if (error) return { error: `Update failed: ${error.message}`, notice: null };

    // After the decision has landed, and never allowed to undo it. The same
    // rule `recordAdminAction` follows: the approval matters more than the
    // notification about it, and a half-applied decision is worse than an
    // unannounced one.
    /* THEIR rate, not the platform's. An account can carry an override — that is
       what `percent` is for — and quoting the default at somebody who was given
       25% is a wrong statement about money in the first thing they ever read
       from us. Falls back to the default only when there is no override. */
    const { data: current } = await admin
      .from("referral_accounts")
      .select("percent")
      .eq("id", args.accountId)
      .single();
    const { data: settings } = await admin
      .from("referral_settings")
      .select("default_percent")
      .eq("id", true)
      .single();
    const rate = Number(current?.percent ?? settings?.default_percent ?? 15);
    await notifyApproved(args.accountId, code, rate);
    return { error: null, notice: `Approved — their code is ${code}. Email sent.` };
  }

  if (args.decision === "reject") {
    const { error } = await admin
      .from("referral_accounts")
      .update({ ...base, status: "rejected" })
      .eq("id", args.accountId);
    if (error) return { error: `Update failed: ${error.message}`, notice: null };
    await notifyRejected(args.accountId, args.note);
    return { error: null, notice: "Rejected — email sent." };
  }

  // close | revoke — both kill the link immediately.
  const status = args.decision === "revoke" ? "revoked" : "closed";
  const { error } = await admin
    .from("referral_accounts")
    .update({ ...base, status, stopped_at: now })
    .eq("id", args.accountId);
  if (error) return { error: `Update failed: ${error.message}`, notice: null };

  if (args.decision === "revoke") {
    /* Everything not yet settled. `paid` is left alone — that money has left.
       Both unsettled states are listed even though only `pending` is ever
       WRITTEN today: `payable` is derived from `payable_after` at read time, so
       filtering on `pending` alone happens to catch everything. That is true by
       coincidence, not by design, and the day somebody starts storing `payable`
       this would silently stop reversing half the ledger. */
    const { error: reverseError, count } = await admin
      .from("referral_commissions")
      .update({ status: "reversed", reversed_reason: "referral account revoked" }, { count: "exact" })
      .eq("referral_account_id", args.accountId)
      .in("status", ["pending", "payable"])
      .select("id");
    if (reverseError) {
      return { error: `Stopped, but reversing pending commission failed: ${reverseError.message}`, notice: null };
    }
    return { error: null, notice: `Revoked — ${count ?? 0} pending commission${count === 1 ? "" : "s"} reversed.` };
  }

  return { error: null, notice: "Closed — the link is dead, existing referrals keep paying out." };
}

/** A free code, or null if the space refused to yield one. */
async function mintCode(admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
  for (let i = 0; i < 8; i++) {
    const candidate = generateCode();
    // `.eq`, not `.ilike` — same reasoning as the lookup in attribution.ts.
    // A generated candidate never contains `_`, so this one was not exploitable,
    // but a collision check that matches by pattern is a collision check that
    // can reject a free code for no reason.
    const { data } = await admin
      .from("referral_accounts")
      .select("id")
      .eq("code", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toAccount(row: any): ReferralAccount {
  const person = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    code: row.code ? normalizeCode(row.code) : null,
    status: row.status,
    percent: row.percent == null ? null : Number(row.percent),
    pitch: row.pitch ?? null,
    audienceUrl: row.audience_url ?? null,
    appliedAt: row.applied_at,
    reviewedAt: row.reviewed_at ?? null,
    reviewNote: row.review_note ?? null,
    applicantName: person?.full_name ?? null,
    applicantEmail: person?.contact_email ?? null,
  };
}

/**
 * What a referrer has earned, and from how many people.
 *
 * TOTALS ARE PER CURRENCY, never one number. Stripe settles USD and the UZ
 * gateways settle UZS; adding them would produce a figure that is wrong in both
 * currencies, and there is no rate in this system to convert with.
 *
 * `signups` and `converted` are reported apart on purpose. Most referrals sign
 * up and stay free — if the page showed one figure, somebody who brought in
 * thirty people and earned nothing would conclude it was broken.
 */
export async function loadEarnings(accountId: string): Promise<Earnings> {
  const admin = createAdminClient();

  const [rows, { count: signups }] = await Promise.all([
    fetchAll<CommissionQueryRow>((from, to) =>
      admin
        .from("referral_commissions")
        .select("id, amount_minor, currency, status, percent_applied, payable_after, created_at")
        .eq("referral_account_id", accountId)
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
    admin
      .from("referral_attributions")
      .select("organization_id", { count: "exact", head: true })
      .eq("referral_account_id", accountId),
  ]);

  const byCurrency = new Map<string, CurrencyTotal>();
  const converted = new Set<string>();

  /**
   * PAYABLE IS DERIVED, NOT STORED — and that is a fix, not a shortcut.
   *
   * Accrual writes `pending` with a `payable_after` date and nothing ever
   * promoted it, so every balance would have sat under "on hold" forever and
   * "ready to withdraw" would have been permanently zero. The obvious repair is
   * a scheduled job flipping rows at midnight; the better one is not to store a
   * state that a clock already decides. A row is ready when its hold has passed,
   * and asking that question at read time cannot drift, cannot miss a night, and
   * needs no infrastructure.
   *
   * `paid` and `reversed` stay stored, because those are decisions somebody
   * made, not facts a date implies.
   */
  const now = Date.now();
  const ledger: CommissionRow[] = [];

  for (const row of rows) {
    const currency = String(row.currency);
    const amount = Number(row.amount_minor) || 0;
    const state = commissionState(row.status, row.payable_after ?? null, now);

    ledger.push({
      id: String(row.id),
      earnedAt: String(row.created_at),
      amountMinor: amount,
      currency,
      percentApplied: Number(row.percent_applied) || 0,
      state,
      clearsAt: state === "held" ? String(row.payable_after) : null,
    });

    // `reversed` is deliberately counted in no total: it is money that came
    // back. It stays in `ledger` above, because a row that silently vanished
    // from a statement is how a person concludes the numbers are made up.
    if (state === "reversed") continue;

    const bucket = byCurrency.get(currency) ?? {
      currency,
      pendingMinor: 0,
      payableMinor: 0,
      paidMinor: 0,
      count: 0,
    };
    if (state === "paid") bucket.paidMinor += amount;
    else if (state === "released") bucket.payableMinor += amount;
    else bucket.pendingMinor += amount;
    bucket.count += 1;
    byCurrency.set(currency, bucket);
  }

  // One commission row per payment, so distinct paying orgs is the honest
  // "how many of them actually upgraded" — a renewal must not count twice.
  const payers = await fetchAll<{ organization_id: string | null }>((from, to) =>
    admin
      .from("referral_commissions")
      .select("organization_id")
      .eq("referral_account_id", accountId)
      .neq("status", "reversed")
      .range(from, to),
  );
  for (const p of payers) if (p.organization_id) converted.add(String(p.organization_id));

  return {
    signups: signups ?? 0,
    converted: converted.size,
    totals: [...byCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
    rows: ledger,
  };
}


/**
 * Every row, not the first thousand.
 *
 * THE BUG THIS EXISTS FOR: PostgREST caps a select that carries no range, and
 * this project's cap is 1000 (verified against `ai_usage` — 2335 rows, an
 * unbounded select returns 1000). Every balance on every referral screen was
 * computed by fetching the rows and adding them up, so past a thousand
 * commissions the arithmetic silently stopped at the cap. Nothing errors and
 * nothing looks wrong: the referrer is simply shown less money than they are
 * owed, and the platform is shown a smaller liability than it has.
 *
 * It is the shape of bug that only appears once the programme succeeds, and by
 * then the wrong number has been on the page for months.
 *
 * Pages explicitly rather than trusting the default. A SQL aggregate would be
 * better still, but that is a migration, and this is correct today.
 */
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const SIZE = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += SIZE) {
    const { data, error } = await page(from, from + SIZE - 1);
    if (error || !data) break;
    out.push(...data);
    if (data.length < SIZE) break;
  }
  return out;
}

/* ── the programme, seen from above ──────────────────────────────────────── */

/** What the whole programme currently costs and carries. Admin only. */
export interface ProgrammeTotals {
  /** Owed but not yet settled, per currency. Never summed across them. */
  owed: CurrencyTotal[];
  waiting: number;
  /** ISO date of the longest-waiting application, or null when none wait. */
  oldestWaiting: string | null;
  active: number;
  closed: number;
  /** Signups attributed to accounts that are still active. */
  referredSignups: number;
}

/**
 * The three figures the queue leads with.
 *
 * "Owed" is the one that matters: it is a liability the platform has already
 * incurred and has no screen to discharge. It counts everything not yet `paid`
 * and not `reversed` — money on hold is still money promised, and showing only
 * the withdrawable part would understate what the programme has cost.
 */
export async function loadProgrammeTotals(): Promise<ProgrammeTotals> {
  const admin = createAdminClient();

  const [statuses, commissions, { count: referredSignups }] = await Promise.all([
    fetchAll<{ status: string; applied_at: string }>((from, to) =>
      admin.from("referral_accounts").select("status, applied_at").range(from, to),
    ),
    fetchAll<CommissionQueryRow>((from, to) =>
      admin
        .from("referral_commissions")
        .select("amount_minor, currency, status, payable_after")
        .neq("status", "reversed")
        .range(from, to),
    ),
    admin
      .from("referral_attributions")
      .select("organization_id", { count: "exact", head: true }),
  ]);

  const pendingRows = statuses.filter((a) => a.status === "pending");
  const oldest = pendingRows
    .map((a) => String(a.applied_at))
    .sort()
    .at(0) ?? null;

  const byCurrency = new Map<string, CurrencyTotal>();
  const now = Date.now();
  for (const row of commissions) {
    const currency = String(row.currency);
    const bucket = byCurrency.get(currency) ?? {
      currency,
      pendingMinor: 0,
      payableMinor: 0,
      paidMinor: 0,
      count: 0,
    };
    const amount = Number(row.amount_minor) || 0;
    const state = commissionState(row.status, row.payable_after ?? null, now);
    if (state === "paid") bucket.paidMinor += amount;
    else if (state === "released") bucket.payableMinor += amount;
    else bucket.pendingMinor += amount;
    bucket.count += 1;
    byCurrency.set(currency, bucket);
  }

  return {
    owed: [...byCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
    waiting: pendingRows.length,
    oldestWaiting: oldest,
    active: statuses.filter((a) => a.status === "active").length,
    closed: statuses.filter((a) => a.status === "closed" || a.status === "revoked").length,
    referredSignups: referredSignups ?? 0,
  };
}

/* ── one application, in full ─────────────────────────────────────────────── */

/** One referred person, as the REVIEWER sees them — names included. */
export interface AdminLedgerRow {
  organizationId: string;
  who: string;
  /** When they signed up through the link. */
  joinedAt: string;
  /** When they paid, or null — most never do. */
  upgradedAt: string | null;
  amountMinor: number | null;
  currency: string | null;
  state: CommissionRow["state"] | "free";
}

/** One reviewable observation. Not a score — a reviewer still decides. */
export interface Check {
  level: "ok" | "look";
  label: string;
}

export interface AccountDetail {
  account: ReferralAccount;
  /** Facts about the applicant, as label/value pairs for a definition list. */
  profile: { k: string; v: string }[];
  checks: Check[];
  ledger: AdminLedgerRow[];
  signups: number;
  upgraded: number;
  refunded: number;
  owed: CurrencyTotal[];
}

/**
 * Everything a reviewer needs about one application, on one screen.
 *
 * THE CHECKS ARE THE POINT, and they are deliberately fewer than the design
 * asked for. It mocked up "31 signups across 27 devices — no shared device or
 * IP", which would be the strongest signal here and is the one thing this
 * cannot say: no IP, device or fingerprint is recorded anywhere in the schema.
 * Rendering that line from nothing would be worse than omitting it — a reviewer
 * would read a fraud check that never ran as a fraud check that passed.
 *
 * So every check below is computed from data that actually exists, and each one
 * says what it observed rather than passing judgement.
 */
export async function loadAccountDetail(accountId: string): Promise<AccountDetail | null> {
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("referral_accounts")
    .select(
      "id, code, status, percent, pitch, audience_url, applied_at, reviewed_at, review_note, organization_id, profile_id, profiles(full_name, contact_email, created_at, username)",
    )
    .eq("id", accountId)
    .maybeSingle();
  if (!row) return null;

  const account = toAccount(row);
  const person = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  const [{ data: org }, attributions, commissions, { data: authUser }] = await Promise.all([
    admin.from("organizations").select("plan, created_at").eq("id", row.organization_id).maybeSingle(),
    fetchAll<{ organization_id: string; attributed_at: string; source: string }>((from, to) =>
      admin
        .from("referral_attributions")
        .select("organization_id, attributed_at, source")
        .eq("referral_account_id", accountId)
        .order("attributed_at", { ascending: false })
        .range(from, to),
    ),
    fetchAll<CommissionQueryRow>((from, to) =>
      admin
        .from("referral_commissions")
        .select("organization_id, amount_minor, currency, status, payable_after, created_at")
        .eq("referral_account_id", accountId)
        .range(from, to),
    ),
    admin.auth.admin.getUserById(String(row.profile_id)),
  ]);

  // Names for the referred orgs. A personal org has exactly one profile, which
  // is the case the programme is built for; a centre would return several, so
  // the first is taken rather than assumed to be alone.
  const orgIds = attributions.map((a) => String(a.organization_id));
  const names = new Map<string, string>();
  if (orgIds.length > 0) {
    const { data: members } = await admin
      .from("profiles")
      .select("organization_id, full_name")
      .in("organization_id", orgIds);
    for (const m of members ?? []) {
      const id = String(m.organization_id);
      if (!names.has(id) && m.full_name) names.set(id, String(m.full_name));
    }
  }

  const now = Date.now();
  const byOrg = new Map<string, CommissionQueryRow>();
  for (const c of commissions) {
    if (c.organization_id) byOrg.set(String(c.organization_id), c);
  }

  const ledger: AdminLedgerRow[] = attributions.map((a) => {
    const id = String(a.organization_id);
    const c = byOrg.get(id);
    return {
      organizationId: id,
      who: names.get(id) ?? "—",
      joinedAt: String(a.attributed_at),
      upgradedAt: c?.created_at ? String(c.created_at) : null,
      amountMinor: c ? Number(c.amount_minor) || 0 : null,
      currency: c ? String(c.currency) : null,
      state: c ? commissionState(c.status, c.payable_after ?? null, now) : "free",
    };
  });

  const owedByCurrency = new Map<string, CurrencyTotal>();
  let refunded = 0;
  for (const c of commissions) {
    const state = commissionState(c.status, c.payable_after ?? null, now);
    if (state === "reversed") {
      refunded += 1;
      continue;
    }
    const currency = String(c.currency);
    const bucket = owedByCurrency.get(currency) ?? {
      currency,
      pendingMinor: 0,
      payableMinor: 0,
      paidMinor: 0,
      count: 0,
    };
    const amount = Number(c.amount_minor) || 0;
    if (state === "paid") bucket.paidMinor += amount;
    else if (state === "released") bucket.payableMinor += amount;
    else bucket.pendingMinor += amount;
    bucket.count += 1;
    owedByCurrency.set(currency, bucket);
  }

  const contact = person?.contact_email?.trim() || authUser?.user?.email?.trim() || "";
  const deliverable = contact && !contact.endsWith("students.engprogress.com");
  const upgraded = ledger.filter((r) => r.state !== "free").length;

  /* SIGNUP BURST. The one abuse signal available without recording anything
     new: thirty accounts arriving on one afternoon looks nothing like thirty
     arriving over six weeks, and the attribution timestamps already say which
     happened. It reports the spread and leaves the judgement to a person. */
  const days = new Set(attributions.map((a) => String(a.attributed_at).slice(0, 10)));

  const checks: Check[] = [];
  checks.push(
    deliverable
      ? { level: "ok", label: `Reachable at ${contact}` }
      : {
          level: "look",
          label: contact
            ? "Only a placeholder address — approval and payout emails will bounce"
            : "No contact email — approval and payout notices have nowhere to go",
        },
  );
  checks.push(
    account.audienceUrl
      ? { level: "ok", label: `Audience link given — open it and check it matches the pitch` }
      : { level: "look", label: "No audience link, so the pitch cannot be verified from here" },
  );
  if (ledger.length === 0) {
    checks.push({ level: "ok", label: "No referrals yet — nothing to weigh either way" });
  } else {
    checks.push(
      days.size >= Math.min(4, ledger.length)
        ? { level: "ok", label: `${ledger.length} signups spread over ${days.size} days` }
        : {
            level: "look",
            label: `${ledger.length} signups on only ${days.size} day${days.size === 1 ? "" : "s"} — check they are real people`,
          },
    );
  }
  if (refunded > 0) {
    checks.push({
      level: "look",
      label: `${upgraded + refunded} referred payments, ${refunded} refunded and reversed`,
    });
  } else if (upgraded > 0) {
    checks.push({ level: "ok", label: `${upgraded} referred payments, none refunded` });
  }

  /* NO DEVICE OR IP CHECK. It would be the most useful line here and there is
     nothing behind it — see the note on this function. */

  return {
    account,
    profile: [
      { k: "Account", v: person?.username ? `${person.username}` : "—" },
      {
        k: "Joined",
        v: person?.created_at
          ? new Date(String(person.created_at)).toLocaleDateString("en", { month: "long", year: "numeric" })
          : "—",
      },
      { k: "Plan", v: org?.plan ? String(org.plan) : "—" },
      { k: "Contact", v: contact || "none on file" },
    ],
    checks,
    ledger,
    signups: ledger.length,
    upgraded,
    refunded,
    owed: [...owedByCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
  };
}
