/**
 * THE WHOLE CHAIN, DRIVEN FOR REAL: click → sign-up → payment → commission.
 *
 * Every other test in this directory asserts against source text, because jsdom
 * cannot run Postgres. That is fine for a constraint that lives in a migration
 * and useless for the question that actually gets asked — "if somebody signs up
 * through my link and pays, do I see the money?" — which is not answered by any
 * single line of code. So this one stands up an in-memory stand-in for the
 * service-role client and runs `attribute()` and `accrueCommission()` against
 * it, end to end, with the arithmetic checked at the far side.
 *
 * It also pins the two bugs found in production on 2026-09-21, both of which
 * passed every existing test:
 *
 *   1. ATTRIBUTION FIRED ON SIGN-IN. `/auth/callback` is every Google sign-in,
 *      not just a sign-up, so an existing customer who opened a referral link
 *      and signed in was credited to that referrer forever. Org 827add5b,
 *      created 2026-08-02, was attributed to a code approved 2026-09-19.
 *   2. THE SELF-REFERRAL GUARD WAS A NO-OP. It compared `profiles.phone`, and
 *      Google OAuth never supplies one — so it returned false on its first line
 *      for every account that has ever used this programme.
 *
 * Both guards below have been mutation-tested: reverting the fix turns the
 * matching case red, which is the only thing that makes a guard worth having.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

/* ── an in-memory stand-in for the service-role client ────────────────────── */

interface Row {
  [column: string]: unknown;
}

/** Unique keys the real schema enforces, and that a fake must too — otherwise
 *  "first touch wins" and "one commission per referral" test as true here while
 *  being false in Postgres, which is worse than not testing them. */
const UNIQUE: Record<string, string[]> = {
  referral_attributions: ["organization_id"],
  referral_commissions: ["organization_id", "billing_event_id"],
};

function makeDb(seed: Record<string, Row[]>, authEmails: Record<string, string> = {}) {
  const tables: Record<string, Row[]> = {};
  for (const [name, rows] of Object.entries(seed)) tables[name] = rows.map((r) => ({ ...r }));

  const query = (table: string) => {
    const filters: Array<(r: Row) => boolean> = [];
    let head = false;
    const matched = () => (tables[table] ?? []).filter((r) => filters.every((f) => f(r)));

    const q = {
      select(_columns?: string, options?: { count?: string; head?: boolean }) {
        if (options?.head) head = true;
        return q;
      },
      eq(column: string, value: unknown) {
        filters.push((r) => r[column] === value);
        return q;
      },
      in(column: string, values: unknown[]) {
        filters.push((r) => values.includes(r[column]));
        return q;
      },
      limit() {
        return q;
      },
      async maybeSingle() {
        return { data: matched()[0] ?? null, error: null };
      },
      async single() {
        const rows = matched();
        return rows.length
          ? { data: rows[0], error: null }
          : { data: null, error: { code: "PGRST116", message: "no rows" } };
      },
      async insert(row: Row) {
        const existing = tables[table] ?? (tables[table] = []);
        for (const column of UNIQUE[table] ?? []) {
          if (row[column] !== undefined && existing.some((r) => r[column] === row[column])) {
            // What Postgres returns for a unique violation, which both call
            // sites branch on explicitly.
            return { error: { code: "23505", message: `duplicate key on ${column}` } };
          }
        }
        existing.push({ ...row });
        return { error: null };
      },
      // Awaited directly by the count and list queries.
      then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
        const rows = matched();
        return Promise.resolve({
          data: head ? null : rows,
          count: rows.length,
          error: null,
        }).then(resolve, reject);
      },
    };
    return q;
  };

  return {
    tables,
    client: {
      from: (table: string) => query(table),
      auth: {
        admin: {
          async getUserById(id: string) {
            const email = authEmails[id];
            return email ? { data: { user: { id, email } }, error: null } : { data: null, error: null };
          },
        },
      },
    },
  };
}

let db: ReturnType<typeof makeDb>;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => db.client,
}));
// The email is about the money, not the money. Silenced so a test run never
// tries to reach SMTP.
vi.mock("./notify", () => ({ notifyEarned: vi.fn(async () => {}) }));

const { attribute } = await import("./attribution");
const { accrueCommission } = await import("./accrual");

/* ── the world these tests run in ─────────────────────────────────────────── */

const REFERRER_PROFILE = "referrer-profile";
const REFERRER_ORG = "referrer-org";
const ACCOUNT_ID = "referral-account";
const CODE = "mhgn8hfc";

const NEWCOMER_PROFILE = "newcomer-profile";
const NEWCOMER_ORG = "newcomer-org";

const DAY = 24 * 60 * 60 * 1000;

function world(options: {
  /** When the referred organization was created. */
  orgCreatedAt: number;
  accountStatus?: string;
  percent?: number | null;
  referrerPhone?: string | null;
  newcomerPhone?: string | null;
  referrerName?: string | null;
  newcomerName?: string | null;
  commissions?: Row[];
  attributions?: Row[];
} & Record<string, unknown>) {
  return makeDb(
    {
      organizations: [
        { id: REFERRER_ORG, created_at: new Date(0).toISOString() },
        { id: NEWCOMER_ORG, created_at: new Date(options.orgCreatedAt).toISOString() },
      ],
      referral_accounts: [
        {
          id: ACCOUNT_ID,
          profile_id: REFERRER_PROFILE,
          organization_id: REFERRER_ORG,
          code: CODE,
          status: options.accountStatus ?? "active",
          percent: options.percent ?? 15,
        },
      ],
      referral_attributions: options.attributions ?? [],
      referral_commissions: options.commissions ?? [],
      referral_settings: [{ id: true, default_percent: 15, hold_days: 7 }],
      profiles: [
        {
          id: REFERRER_PROFILE,
          organization_id: REFERRER_ORG,
          phone: options.referrerPhone ?? null,
          contact_email: null,
          full_name: options.referrerName ?? "Referrer Person",
        },
        {
          id: NEWCOMER_PROFILE,
          organization_id: NEWCOMER_ORG,
          phone: options.newcomerPhone ?? null,
          contact_email: null,
          full_name: options.newcomerName ?? "Somebody Else",
        },
      ],
    },
    (options.authEmails as Record<string, string>) ?? {
      [REFERRER_PROFILE]: "referrer@gmail.com",
      [NEWCOMER_PROFILE]: "newcomer@gmail.com",
    },
  );
}

const claim = (notBefore: number | null, source: "link" | "code" = "link") =>
  attribute({
    code: CODE,
    organizationId: NEWCOMER_ORG,
    profileId: NEWCOMER_PROFILE,
    source,
    notBefore,
  });

/* ── the question everybody actually asks ─────────────────────────────────── */

describe("click → sign-up → payment → money on the ledger", () => {
  beforeEach(() => {
    const clickedAt = Date.now() - 60_000;
    db = world({ orgCreatedAt: clickedAt + 1_000 });
  });

  it("pays the referrer 15% of the first payment, held for seven days", async () => {
    const clickedAt = Date.now() - 60_000;
    expect(await claim(clickedAt)).toBe(true);

    // $49.00 in cents, the shape Stripe puts on `checkout.session.completed`.
    const earned = await accrueCommission({
      organizationId: NEWCOMER_ORG,
      billingEventId: "event-1",
      amountMinor: 4900,
      currency: "usd",
    });

    expect(earned).toBe(735); // $7.35 — 15% of $49.00
    const [commission] = db.tables.referral_commissions;
    expect(commission).toMatchObject({
      referral_account_id: ACCOUNT_ID,
      organization_id: NEWCOMER_ORG,
      amount_minor: 735,
      currency: "usd",
      percent_applied: 15,
      status: "pending",
    });
    // Seven days of hold, so it is visible immediately and withdrawable later.
    const holdMs = Date.parse(commission.payable_after as string) - Date.now();
    expect(holdMs).toBeGreaterThan(6.5 * DAY);
    expect(holdMs).toBeLessThan(7.5 * DAY);
  });

  it("rounds the fraction of a cent DOWN, never up", async () => {
    // Rounding up means paying out fractionally more than was taken in, forever.
    expect(await claim(Date.now() - 60_000)).toBe(true);
    // 15% of 999 = 149.85
    const earned = await accrueCommission({
      organizationId: NEWCOMER_ORG,
      billingEventId: "event-1",
      amountMinor: 999,
      currency: "usd",
    });
    expect(earned).toBe(149);
  });

  it("earns nothing on the second payment, however it arrives", async () => {
    expect(await claim(Date.now() - 60_000)).toBe(true);
    const first = await accrueCommission({
      organizationId: NEWCOMER_ORG,
      billingEventId: "event-1",
      amountMinor: 4900,
      currency: "usd",
    });
    const renewal = await accrueCommission({
      organizationId: NEWCOMER_ORG,
      billingEventId: "event-2",
      amountMinor: 4900,
      currency: "usd",
    });
    expect(first).toBe(735);
    expect(renewal).toBe(0);
    expect(db.tables.referral_commissions).toHaveLength(1);
  });

  it("pays nothing at all when no money changed hands", async () => {
    // The case that matters for a plan set by hand in /admin: that path writes
    // `organizations.plan` directly and never produces a billing event or an
    // amount, so there is nothing to take a percentage of.
    expect(await claim(Date.now() - 60_000)).toBe(true);
    const earned = await accrueCommission({
      organizationId: NEWCOMER_ORG,
      billingEventId: "event-1",
      amountMinor: 0,
      currency: "usd",
    });
    expect(earned).toBe(0);
    expect(db.tables.referral_commissions).toHaveLength(0);
  });
});

/* ── bug 1: an existing customer following a public link ──────────────────── */

describe("only an account the link actually brought in", () => {
  it("refuses an organization that already existed when the link was clicked", async () => {
    /* ⚠️ THE PRODUCTION BUG, IN ITS ORIGINAL SHAPE. Org created 2026-08-02,
       link clicked 2026-09-19 — an existing customer signing in with Google.
       Before the fix this returned true and the row was permanent. */
    const clickedAt = Date.parse("2026-09-19T04:28:54Z");
    db = world({ orgCreatedAt: Date.parse("2026-08-02T17:42:43Z") });

    expect(await claim(clickedAt)).toBe(false);
    expect(db.tables.referral_attributions).toHaveLength(0);
  });

  it("allows an account created after the click, however late the confirmation", async () => {
    // The reason this is a timestamp and not a freshness window: somebody who
    // takes three days to answer their confirmation email is still a referral.
    const clickedAt = Date.now() - 30 * DAY;
    db = world({ orgCreatedAt: clickedAt + 5_000 });

    expect(await claim(clickedAt)).toBe(true);
    expect(db.tables.referral_attributions).toHaveLength(1);
  });

  it("accepts an org created in the same millisecond as the stamp", async () => {
    // A code typed into the sign-up form stashes and provisions together.
    const clickedAt = Date.now();
    db = world({ orgCreatedAt: clickedAt });
    expect(await claim(clickedAt, "code")).toBe(true);
  });

  it("falls back to a freshness window for a legacy cookie with no stamp", async () => {
    db = world({ orgCreatedAt: Date.now() - 2 * DAY });
    expect(await claim(null)).toBe(false);

    db = world({ orgCreatedAt: Date.now() - 60_000 });
    expect(await claim(null)).toBe(true);
  });

  it("fails closed when the organization cannot be read", async () => {
    // An attribution that cannot be justified must not be made: the row is
    // permanent and pays real money.
    db = makeDb({
      organizations: [],
      referral_accounts: [{ id: ACCOUNT_ID, profile_id: REFERRER_PROFILE, organization_id: REFERRER_ORG, code: CODE, status: "active", percent: 15 }],
      referral_attributions: [],
    });
    expect(await claim(Date.now() - 60_000)).toBe(false);
  });

  it("still refuses a stopped account, and still refuses a self-referral", async () => {
    const clickedAt = Date.now() - 60_000;

    db = world({ orgCreatedAt: clickedAt + 1_000, accountStatus: "revoked" });
    expect(await claim(clickedAt)).toBe(false);

    db = world({ orgCreatedAt: clickedAt + 1_000 });
    expect(
      await attribute({
        code: CODE,
        organizationId: REFERRER_ORG,
        profileId: REFERRER_PROFILE,
        source: "link",
        notBefore: null,
      }),
    ).toBe(false);
  });
});

/* ── bug 2: the guard that did nothing for a Google account ───────────────── */

describe("self-referral across two accounts", () => {
  const clickedAt = Date.now() - 60_000;
  const pay = () =>
    accrueCommission({
      organizationId: NEWCOMER_ORG,
      billingEventId: "event-1",
      amountMinor: 4900,
      currency: "usd",
    });

  it("catches the same gmail inbox behind a +tag", async () => {
    db = world({
      orgCreatedAt: clickedAt + 1_000,
      authEmails: {
        [REFERRER_PROFILE]: "someone@gmail.com",
        [NEWCOMER_PROFILE]: "someone+ielts@gmail.com",
      },
    });
    expect(await claim(clickedAt)).toBe(true);
    expect(await pay()).toBe(0);
    expect(db.tables.referral_commissions).toHaveLength(0);
  });

  it("catches the same gmail inbox behind dots", async () => {
    db = world({
      orgCreatedAt: clickedAt + 1_000,
      authEmails: {
        [REFERRER_PROFILE]: "someone@gmail.com",
        [NEWCOMER_PROFILE]: "so.me.one@googlemail.com",
      },
    });
    expect(await claim(clickedAt)).toBe(true);
    expect(await pay()).toBe(0);
  });

  it("does NOT strip dots on a non-gmail domain, where they identify people", async () => {
    // a.b@ and ab@ are two different mailboxes nearly everywhere else, and
    // merging them would refuse a real referrer's money.
    db = world({
      orgCreatedAt: clickedAt + 1_000,
      authEmails: {
        [REFERRER_PROFILE]: "ab@example.com",
        [NEWCOMER_PROFILE]: "a.b@example.com",
      },
    });
    expect(await claim(clickedAt)).toBe(true);
    expect(await pay()).toBe(735);
  });

  it("still catches a shared phone number in any format", async () => {
    db = world({
      orgCreatedAt: clickedAt + 1_000,
      referrerPhone: "+998 90 123-45-67",
      newcomerPhone: "998901234567",
    });
    expect(await claim(clickedAt)).toBe(true);
    expect(await pay()).toBe(0);
  });

  it("pays two genuinely different people", async () => {
    db = world({ orgCreatedAt: clickedAt + 1_000 });
    expect(await claim(clickedAt)).toBe(true);
    expect(await pay()).toBe(735);
  });

  it("FLAGS a shared name rather than swallowing the commission", async () => {
    /* Deliberate, and the line most likely to be "tightened" by somebody who
       has not thought it through: siblings share a surname and refer each other
       honestly. Refusing on a string comparison takes real money from a real
       referrer who is never told why. Warn, pay, let a person review. */
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    db = world({
      orgCreatedAt: clickedAt + 1_000,
      referrerName: "Javohir Abdumalikov",
      newcomerName: "javohir  ABDUMALIKOV",
    });
    expect(await claim(clickedAt)).toBe(true);
    expect(await pay()).toBe(735);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("REVIEW"));
    warn.mockRestore();
  });
});

/* ── the cookie format both doors write ───────────────────────────────────── */

describe("parsing the stashed referral", () => {
  it("splits code from click time", async () => {
    const { parseStashedReferral } = await import("./attribution");
    expect(parseStashedReferral("mhgn8hfc.1758000000000")).toEqual({
      code: "mhgn8hfc",
      clickedAt: 1758000000000,
    });
  });

  it("reads a legacy cookie as an unknown click time, not as now", async () => {
    // "now" would re-open the bug: every legacy cookie would attribute whatever
    // account happened to sign in next.
    const { parseStashedReferral } = await import("./attribution");
    expect(parseStashedReferral("mhgn8hfc")).toEqual({ code: "mhgn8hfc", clickedAt: null });
  });

  it("refuses junk rather than turning it into a lookup", async () => {
    const { parseStashedReferral } = await import("./attribution");
    expect(parseStashedReferral("")).toBeNull();
    expect(parseStashedReferral(null)).toBeNull();
    expect(parseStashedReferral("!!.123")).toBeNull();
    expect(parseStashedReferral("ab.123")).toBeNull(); // too short for the CHECK
  });

  it("treats an unparseable stamp as unknown, not as zero", async () => {
    // Zero would pass every `created_at >= notBefore` comparison there is.
    const { parseStashedReferral } = await import("./attribution");
    expect(parseStashedReferral("mhgn8hfc.banana")).toEqual({ code: "mhgn8hfc", clickedAt: null });
  });
});
