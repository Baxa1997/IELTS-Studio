import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { generateCode } from "./code";
import { fetchAll, resolveEmails, toAccount, type CommissionQueryRow } from "./db";
import { loadSettings } from "./service";
import { notifyApproved, notifyPaid, notifyRejected } from "./notify";
import { commissionState, formatMoney, payoutFloor } from "./types";
import type { CommissionRow, CurrencyTotal, ReferralAccount, ReviewDecision } from "./types";

/**
 * The referral programme as the REVIEWER sees it.
 *
 * SPLIT FROM `service.ts` DELIBERATELY. Everything in this file can read rows
 * belonging to people who are not the caller — `AdminLedgerRow` carries the name
 * of the person who paid, which is precisely the fact withheld from the
 * referrer's own column grant. Keeping that beside the learner's earnings loader
 * was an invitation to import the wrong one, and nothing in the type system
 * would have objected.
 *
 * Every function here assumes its caller has already passed
 * `requireSuperAdmin()`. None of them check it themselves — the guard belongs at
 * the route, where there is a session to check.
 */

/** Everything waiting on a decision, oldest first — a queue, not a list. */
export async function loadPendingApplications(): Promise<ReferralAccount[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_accounts")
    .select("id, code, status, percent, pitch, audience_url, applied_at, reviewed_at, review_note, profile_id, profiles(full_name, contact_email)")
    .eq("status", "pending")
    .order("applied_at", { ascending: true });
  return withEmails(admin, data ?? []);
}

/** Everyone already approved, plus the ones that were stopped. */
export async function loadDecidedAccounts(): Promise<ReferralAccount[]> {
  const admin = createAdminClient();
  /* PAGED, NOT CAPPED. This was `.limit(200)`, which looked like a sensible
     display cap and was quietly something else: the queue filters in memory,
     so the limit was also a SEARCH ceiling. Looking up a referrer who was
     decided long enough ago simply returned "nothing matches" — the same
     answer as a code that does not exist. A wrong answer that reads like a
     right one is worse than a slow page. */
  const rows = await fetchAll<Record<string, unknown>>((from, to) =>
    admin
      .from("referral_accounts")
      .select("id, code, status, percent, pitch, audience_url, applied_at, reviewed_at, review_note, profile_id, profiles(full_name, contact_email)")
      .neq("status", "pending")
      .order("reviewed_at", { ascending: false })
      .range(from, to),
  );
  return withEmails(admin, rows);
}

/**
 * Map rows to accounts, filling the address in from `auth.users` where the
 * profile has none — which, for a self-signup, is always.
 */
async function withEmails(
  admin: ReturnType<typeof createAdminClient>,
  rows: Record<string, unknown>[],
): Promise<ReferralAccount[]> {
  const accounts = rows.map(toAccount);
  const needing = rows
    .filter((r, i) => !accounts[i].applicantEmail)
    .map((r) => String(r.profile_id ?? ""));
  if (needing.length === 0) return accounts;

  const emails = await resolveEmails(admin, needing);
  return accounts.map((a, i) => {
    if (a.applicantEmail) return a;
    const email = emails.get(String(rows[i].profile_id ?? ""));
    return email ? { ...a, applicantEmail: email } : a;
  });
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

/* ── settling a month ─────────────────────────────────────────────────────── */

/** One referrer, and what they are owed in one currency, right now. */
export interface DuePayout {
  referralAccountId: string;
  name: string;
  code: string | null;
  /** Where to tell them it went out. Null means nowhere to write to. */
  email: string | null;
  currency: string;
  amountMinor: number;
  /** How many commissions make it up — what the payout row will settle. */
  count: number;
  /** Has it cleared the per-currency floor? Below it, nothing goes out. */
  ready: boolean;
}

/** A payout already made, newest first. */
export interface PayoutRecord {
  id: string;
  name: string;
  currency: string;
  amountMinor: number;
  reference: string | null;
  note: string | null;
  paidAt: string;
}

/**
 * Who is owed money, and how much.
 *
 * THE GAP THIS CLOSES. Commission accrued, cleared its hold, and then sat
 * there: `referral_payouts` had no writer anywhere in the codebase, so nothing
 * could mark a month settled and "Commission owed" was a number that only ever
 * went up. The programme promised monthly payouts and had no way to make one.
 *
 * Per currency, never summed — a referrer earning in both USD and UZS is owed
 * two separate amounts and there is no rate here to merge them with. Below-floor
 * balances are returned too, flagged `ready: false`, because "nearly there" is
 * something a reviewer wants to see rather than something to hide.
 */
export async function loadDuePayouts(): Promise<DuePayout[]> {
  const admin = createAdminClient();
  const settings = await loadSettings();

  const rows = await fetchAll<CommissionQueryRow & { referral_account_id: string }>((from, to) =>
    admin
      .from("referral_commissions")
      .select("id, referral_account_id, amount_minor, currency, status, payable_after")
      // Both unsettled states, though only `pending` is ever written today —
      // `payable` is derived at read time. Filtering on `pending` alone happens
      // to catch everything, by coincidence rather than design, and the day
      // anything starts storing `payable` this would quietly stop paying half
      // the ledger. Same reasoning as the revoke path above.
      .in("status", ["pending", "payable"])
      .range(from, to),
  );

  // Grouped by account AND currency: those two together are what one payout row
  // settles, so they are the key the whole screen is built on.
  const buckets = new Map<string, { accountId: string; currency: string; amountMinor: number; count: number }>();
  const now = Date.now();
  for (const row of rows) {
    // Only what has cleared its hold. A commission still inside the refund
    // window is a promise, not a payable.
    if (commissionState(row.status, row.payable_after ?? null, now) !== "released") continue;
    const accountId = String(row.referral_account_id);
    const currency = String(row.currency);
    const key = `${accountId}:${currency}`;
    const bucket = buckets.get(key) ?? { accountId, currency, amountMinor: 0, count: 0 };
    bucket.amountMinor += Number(row.amount_minor) || 0;
    bucket.count += 1;
    buckets.set(key, bucket);
  }
  if (buckets.size === 0) return [];

  const accountIds = [...new Set([...buckets.values()].map((b) => b.accountId))];
  const { data: accounts } = await admin
    .from("referral_accounts")
    .select("id, code, profile_id, profiles(full_name, contact_email)")
    .in("id", accountIds);

  const people = new Map<string, { name: string; code: string | null; email: string | null }>();
  for (const a of accounts ?? []) {
    const person = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
    people.set(String(a.id), {
      name: person?.full_name ?? "Someone",
      code: a.code ? String(a.code) : null,
      email: person?.contact_email ?? null,
    });
  }

  return [...buckets.values()]
    .map((b) => {
      const who = people.get(b.accountId);
      return {
        referralAccountId: b.accountId,
        name: who?.name ?? "Someone",
        code: who?.code ?? null,
        email: who?.email ?? null,
        currency: b.currency,
        amountMinor: b.amountMinor,
        count: b.count,
        ready: b.amountMinor >= payoutFloor(settings, b.currency),
      };
    })
    .sort((a, b) => Number(b.ready) - Number(a.ready) || b.amountMinor - a.amountMinor);
}

/**
 * Mark one referrer's cleared balance in one currency as paid.
 *
 * NO TRANSACTION IS AVAILABLE HERE, so the order is chosen to make every failure
 * visible rather than silent. The exact commission ids are read first, the payout
 * row is written for precisely that sum, and only then are those ids flipped to
 * `paid`. If the flip fails or covers fewer rows than expected — two admins
 * settling the same balance at once — the payout row is deleted again and the
 * caller is told. The alternative order leaves commissions marked paid with no
 * record of the payment, which is the failure you cannot reconstruct.
 *
 * Money leaving the platform happens OUTSIDE this function. This records that it
 * did; it does not move anything. `reference` is where the bank or Payme id
 * goes, and it is the only durable link between this row and the real transfer.
 */
export async function recordPayout(args: {
  referralAccountId: string;
  currency: string;
  reference: string | null;
  note: string | null;
  markedBy: string | null;
}): Promise<{ error: string | null; notice: string | null }> {
  const admin = createAdminClient();
  const settings = await loadSettings();

  const rows = await fetchAll<CommissionQueryRow>((from, to) =>
    admin
      .from("referral_commissions")
      .select("id, amount_minor, currency, status, payable_after")
      .eq("referral_account_id", args.referralAccountId)
      .eq("currency", args.currency)
      .in("status", ["pending", "payable"])
      .range(from, to),
  );

  const now = Date.now();
  const cleared = rows.filter(
    (r) => commissionState(r.status, r.payable_after ?? null, now) === "released",
  );
  const ids = cleared.map((r) => String(r.id)).filter(Boolean);
  const amountMinor = cleared.reduce((sum, r) => sum + (Number(r.amount_minor) || 0), 0);

  if (ids.length === 0 || amountMinor <= 0) {
    return { error: "Nothing has cleared its hold for this referrer yet.", notice: null };
  }
  if (amountMinor < payoutFloor(settings, args.currency)) {
    return {
      error: `That balance is under the ${formatMoney(payoutFloor(settings, args.currency), args.currency)} floor.`,
      notice: null,
    };
  }

  const { data: payout, error: payoutError } = await admin
    .from("referral_payouts")
    .insert({
      referral_account_id: args.referralAccountId,
      currency: args.currency,
      amount_minor: amountMinor,
      reference: args.reference,
      note: args.note,
      marked_by: args.markedBy,
    })
    .select("id")
    .single();

  if (payoutError || !payout) {
    return { error: `Couldn't record the payout: ${payoutError?.message ?? "no row"}`, notice: null };
  }

  const { data: settled, error: settleError } = await admin
    .from("referral_commissions")
    .update({ status: "paid", payout_id: payout.id })
    .in("id", ids)
    // Re-checked at write time: this is what makes a concurrent settlement
    // collide here instead of paying the same commission twice. It excludes
    // `paid` and `reversed`, which is the whole job.
    .in("status", ["pending", "payable"])
    .select("id");

  if (settleError || (settled?.length ?? 0) !== ids.length) {
    /* UNDO THE PARTIAL SETTLE BEFORE REMOVING THE PAYOUT ROW.
     *
     * The update above is a single statement, so Postgres has already committed
     * every row that DID match — a short count means another settlement got
     * there first, not that nothing happened. Deleting the payout row at this
     * point would leave those commissions `paid` with `payout_id` nulled out by
     * the FK's `on delete set null`: money marked paid with no record of the
     * payment. That is the exact state this whole ordering exists to prevent,
     * and the only failure here that cannot be reconstructed afterwards.
     *
     * So the rows go back first, and only then does the payout row go. */
    const { error: undoError } = await admin
      .from("referral_commissions")
      .update({ status: "pending", payout_id: null })
      .eq("payout_id", payout.id);

    if (undoError) {
      /* Leave the payout row alone. A payout row with its commissions still
       * attached reconciles — the amounts agree and a human can see what
       * happened. An orphaned `paid` row with a null payout does not. */
      return {
        error:
          `Partly settled and could not be undone: ${undoError.message}. ` +
          `Payout ${payout.id} is left in place — check it by hand before retrying.`,
        notice: null,
      };
    }

    await admin.from("referral_payouts").delete().eq("id", payout.id);
    return {
      error: settleError
        ? `Couldn't settle those commissions: ${settleError.message}`
        : "Some of those commissions changed while this was saving — nothing was recorded. Try again.",
      notice: null,
    };
  }

  await notifyPaid(args.referralAccountId, amountMinor, args.currency);
  return {
    error: null,
    notice: `Recorded ${formatMoney(amountMinor, args.currency)} — ${ids.length} commission${ids.length === 1 ? "" : "s"} settled.`,
  };
}

/** What has already gone out. The other half of an auditable ledger. */
export async function loadPayoutHistory(limit = 50): Promise<PayoutRecord[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_payouts")
    .select("id, currency, amount_minor, reference, note, paid_at, referral_accounts(profiles(full_name))")
    .order("paid_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const account: any = Array.isArray(r.referral_accounts) ? r.referral_accounts[0] : r.referral_accounts;
    const person = Array.isArray(account?.profiles) ? account.profiles[0] : account?.profiles;
    return {
      id: String(r.id),
      name: person?.full_name ?? "Someone",
      currency: String(r.currency),
      amountMinor: Number(r.amount_minor) || 0,
      reference: r.reference ?? null,
      note: r.note ?? null,
      paidAt: String(r.paid_at),
    };
  });
}
