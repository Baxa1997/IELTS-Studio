/**
 * THE WIRING AROUND THE LIFECYCLE RULES.
 *
 * The rules themselves are executed in lifecycle.test.ts and the Stripe mapping
 * with signed events in stripe-period.test.ts. What neither can see is whether
 * the callers actually USE those rules, in the right order — and every bug this
 * rewrite fixed was an ordering or a wiring bug:
 *
 * - the first nightly job closed a subscription before downgrading its org, and
 *   skipped closed rows, so a failure in between was never retried;
 * - it trusted Stripe's stored date, which one missed webhook would have turned
 *   into downgrading a customer the day after they were charged;
 * - the upsert wrote null for any column an event did not carry;
 * - opening a checkout overwrote a paid row with `incomplete`;
 * - comping somebody left their dead subscription row open for the job to undo.
 *
 * jsdom cannot run Postgres or Stripe, so this asserts the call order where it
 * is written. Slices are bounded at the next top-level declaration: an earlier
 * test in this codebase sliced to end-of-file and kept passing on a different
 * function's code.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

/** One declaration's body, bounded at the next top-level declaration. */
function fn(src: string, name: string): string {
  const start = src.search(new RegExp(`(export )?(async )?function ${name}\\b`));
  if (start < 0) return "";
  const rest = src.slice(start + 1);
  const next = rest.search(/\n(export |async function |function |type |interface |const )/);
  return next < 0 ? src.slice(start) : src.slice(start, start + 1 + next);
}

/**
 * The block that follows `header`, up to its MATCHING closing brace.
 *
 * Cutting at the first `}` instead is wrong in exactly the files this reads:
 * `errors.push(\`${organizationId}: …\`)` has a brace inside the template
 * literal, so the slice stopped mid-string and every "it continues" assertion
 * failed on code that did continue. Template-literal braces come in pairs, so a
 * depth count handles them.
 */
function block(src: string, header: string): string {
  const at = src.indexOf(header);
  if (at < 0) return "";
  const open = src.indexOf("{", at + header.length);
  if (open < 0) return "";
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth += 1;
    else if (src[i] === "}") {
      depth -= 1;
      if (depth === 0) return src.slice(at, i + 1);
    }
  }
  return src.slice(at);
}

const expiry = code("./expiry.ts");
const downgrade = code("./downgrade.ts");
const service = code("./service.ts");
const stripe = code("./stripe.ts");
const quota = code("../quota.ts");
const actions = code("../../app/admin/actions.ts");
const notify = read("./notify-expiry.ts");

describe("the nightly job asks Stripe instead of trusting a copy of its date", () => {
  const pass = fn(expiry, "expireLapsedSubscriptions");

  it("looks the subscription up in Stripe before changing a Stripe row", () => {
    const branch = pass.slice(pass.indexOf('row.provider === "stripe"'));
    const ask = branch.indexOf("fetchLiveStripeSubscription(");
    const act = branch.indexOf("applyPlanChange(");
    expect(ask).toBeGreaterThan(-1);
    expect(act).toBeGreaterThan(ask);
  });

  it("does nothing at all when Stripe cannot be reached", () => {
    // A network error must never take a plan away.
    const branch = block(pass, "if (!live.ok)");
    expect(branch).toMatch(/continue;/);
    expect(branch).not.toMatch(/downgradeToFree|applyPlanChange/);
  });

  it("does nothing when Stripe has no subscription for a row that claims to be paid", () => {
    const branch = block(pass, "if (!live.subscription)");
    expect(branch).toMatch(/continue;/);
    expect(branch).not.toMatch(/downgradeToFree|applyPlanChange/);
  });

  it("never date-expires a Stripe row directly", () => {
    // Bounded by the Stripe branch's own braces. An earlier version ended the
    // slice at a word that only appeared in a comment — which `code()` strips —
    // so it ran on into the Payme branch and matched ITS downgrade.
    const branch = block(pass, 'if (row.provider === "stripe")');
    expect(branch).toMatch(/fetchLiveStripeSubscription\(/);
    expect(branch).not.toMatch(/downgradeToFree\(/);
  });

  it("downgrades a Payme or Click org BEFORE closing its row", () => {
    // The first version closed first and skipped closed rows — so a failure in
    // between left the org on its paid plan forever.
    const down = pass.lastIndexOf("downgradeToFree(");
    const close = pass.lastIndexOf('status: "canceled"');
    expect(down).toBeGreaterThan(-1);
    expect(close).toBeGreaterThan(down);
  });

  it("leaves the row open when the downgrade fails, for the next run to finish", () => {
    const branch = block(pass, 'if (result === "failed")');
    expect(branch).toMatch(/continue;/);
    expect(branch).not.toMatch(/status: "canceled"/);
  });
});

describe("one downgrade path, and the write is the de-duplication", () => {
  const body = fn(downgrade, "downgradeToFree");

  it("only flips an org that is not already free, and checks it did", () => {
    expect(body).toMatch(/\.neq\("plan", "trial"\)/);
    expect(body).toMatch(/\.select\("id"\)/);
    expect(body).toMatch(/flipped\.length === 0\) return "already_free"/);
  });

  it("emails only after the flip, from the plan it held before", () => {
    const flip = body.indexOf('.update({ plan: "trial" })');
    const mail = body.indexOf("notifyPlanExpired(");
    expect(mail).toBeGreaterThan(flip);
    expect(body).toMatch(/notifyPlanExpired\(organizationId, previous, reason, periodEnd/);
  });

  it("is the only place a webhook downgrade goes through", () => {
    const apply = fn(service, "applyPlanChange");
    expect(apply).toMatch(/downgradeToFree\(change\.organizationId, effect, existing\?\.current_period_end\)/);
    expect(apply).not.toMatch(/plan: active \? change\.plan : "trial"/);
  });
});

describe("applyPlanChange keeps what it is not told about", () => {
  const apply = fn(service, "applyPlanChange");

  it("builds the upsert from the rule that omits missing columns", () => {
    expect(apply).toMatch(/subscriptionUpsert\(change,/);
    expect(apply).not.toMatch(/external_customer_id: change\.externalCustomerId \?\? null/);
    expect(apply).not.toMatch(/current_period_end: change\.currentPeriodEnd \?\? null/);
  });

  it("drops a dead second subscription's event before it touches anything", () => {
    const guard = apply.indexOf("isAboutAnotherSubscription(");
    const upsert = apply.indexOf(".upsert(");
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(upsert);
  });

  it("decides the org effect by the shared rule", () => {
    expect(apply).toMatch(/orgEffect\(change\.status\)/);
  });

  it("does not let opening a checkout overwrite a paid row", () => {
    const pending = fn(service, "markCheckoutPending");
    const check = pending.indexOf("shouldMarkPending(");
    const upsert = pending.indexOf(".upsert(");
    expect(check).toBeGreaterThan(-1);
    expect(check).toBeLessThan(upsert);
  });
});

describe("the Stripe mapper reads the period where this API version keeps it", () => {
  it("routes subscription events through the shared mapper", () => {
    expect(fn(stripe, "mapEvent")).toMatch(/changeFromSubscription\(obj, \{ organizationId, plan \}\)/);
    expect(fn(stripe, "mapEvent")).not.toMatch(/unixToIso\(obj\.current_period_end/);
  });

  it("reads the items before the old top-level field", () => {
    const period = fn(stripe, "periodEndOf");
    expect(period.indexOf("items")).toBeLessThan(period.indexOf("obj.current_period_end"));
  });

  it("gives a checkout an end date from the tier's own length", () => {
    const map = fn(stripe, "mapEvent");
    const branch = map.slice(map.indexOf('case "checkout.session.completed"'), map.indexOf('case "customer.subscription.updated"'));
    expect(branch).toMatch(/currentPeriodEnd: periodEndFor\(plan\)/);
    expect(fn(stripe, "periodEndFor")).toMatch(/planTier\(plan\)\?\.months/);
  });
});

describe("the quota reader and the durable downgrade agree", () => {
  const load = fn(quota, "loadOrg");

  it("uses the shared rule, with the provider it needs for Stripe's window", () => {
    expect(quota).toMatch(/import \{ hasLapsed \} from "@\/lib\/billing\/lifecycle"/);
    expect(load).toMatch(/subscriptions\(status, current_period_end, provider\)/);
    expect(load).toMatch(/if \(hasLapsed\(sub\)\)/);
  });

  it("derives trial without writing and without clearing admin overrides", () => {
    // The durable downgrade leaves overrides alone; clearing them here would
    // change the allowance the moment the nightly job ran.
    expect(load).not.toMatch(/\.update\(/);
    expect(load).toMatch(/plan: "trial"/);
    expect(load).not.toMatch(/grading_monthly_limit: null/);
  });
});

describe("a plan granted by hand is not undone the next morning", () => {
  const grant = fn(actions, "setAccountPlan");

  it("closes a subscription row nobody is paying for when the plan changes", () => {
    expect(grant).toMatch(/isLiveSubscription\(sub\)/);
    expect(grant).toMatch(/status: "canceled"/);
  });

  it("leaves a live PAID subscription alone, but always closes a hand-granted one", () => {
    expect(grant).toMatch(/sub\.status !== "canceled" &&\s*\(manualRow \|\| \(before\?\.plan !== plan && !isLiveSubscription\(sub\)\)\)/);
  });

  it("closes it only after the plan itself was written", () => {
    // Bounded on the UPDATE — an earlier version of this test matched the READ
    // of organizations at the top of the function and passed whatever the order.
    const write = grant.indexOf(".update({\n      plan,");
    expect(write).toBeGreaterThan(-1);
    expect(write).toBeLessThan(grant.indexOf("(manualRow || (before?.plan !== plan"));
  });
});

describe("what the learner is told", () => {
  it("does not claim a plan ended when a card merely declined", () => {
    expect(notify).toMatch(/We couldn't renew your EngProgress/);
    expect(notify).toMatch(/comes back by itself/);
    expect(notify).toMatch(/plan has ended/);
  });

  it("says their work is untouched, because that is the actual fear", () => {
    expect(notify).toMatch(/still there/);
  });

  it("finds the real address and never writes to the synthetic one", () => {
    expect(notify).toMatch(/auth\.admin\.getUserById/);
    expect(notify).toMatch(/students\.engprogress\.com/);
  });

  it("cannot fail the downgrade it is announcing", () => {
    expect(notify).toMatch(/catch \(err\)/);
  });
});

/*
 * EVERY PLAN CHANGE IS ANNOUNCED — ONCE, TRUTHFULLY, TO THE RIGHT PERSON.
 *
 * The audit of 2026-09-26 found the gaps these pin: a first payment and a plan
 * set by hand in /admin were silent, every auto-renewing Stripe customer was
 * told weekly-before-renewal that their plan was ending, and a centre's
 * billing mail would have gone to every student in it.
 */
describe("who hears about billing", () => {
  const people = fn(notify, "planOwners");

  it("writes to the owner, and to the learner only when there is no owner", () => {
    expect(people).toMatch(/isOrgOwner\(m\.role\)/);
    expect(people).toMatch(/owners\.length > 0 \? owners :/);
  });

  it("never lumps students in with the owner roles", () => {
    expect(code("./notify-expiry.ts")).not.toMatch(/m\.role === "student" \|\|/);
  });
});

describe("Stripe customers are not told a renewing plan is ending", () => {
  const pass = fn(expiry, "expireLapsedSubscriptions");

  it("sends no 'ends soon' reminder on the Stripe branch", () => {
    expect(block(pass, 'if (row.provider === "stripe")')).not.toMatch(/notifyPlanExpiring\(/);
  });

  it("still reminds Payme and Click, which never renew", () => {
    const stripeBranch = block(pass, 'if (row.provider === "stripe")');
    const afterStripe = pass.slice(pass.indexOf(stripeBranch) + stripeBranch.length);
    expect(afterStripe).toMatch(/notifyPlanExpiring\(/);
  });
});

describe("a plan starting is announced, and a renewal is a whole period", () => {
  const apply = fn(service, "applyPlanChange");

  it("announces a start when the org was not already paying", () => {
    expect(apply).toMatch(/if \(!wasPaying\) \{\s*await notifyPlanActivated\(/);
  });

  it("decides 'was paying' by status, so a missed renewal webhook is still a renewal", () => {
    expect(apply).toMatch(/\(existing\?\.status === "active" \|\| existing\?\.status === "trialing"\)/);
    expect(apply).not.toMatch(/wasPaying = isLiveSubscription/);
  });

  it("does not count a hand-granted plan as paying, so a comp's first payment is a start", () => {
    expect(apply).toMatch(/const wasPaying =\s*existing\?\.provider !== "manual" &&/);
  });

  it("does not call a correction of seconds a renewal", () => {
    expect(apply).toMatch(/nextEnd - previousEnd >= MIN_RENEWAL_ADVANCE_MS/);
    expect(service).toMatch(/const MIN_RENEWAL_ADVANCE_MS = 7 \* 24 \* 60 \* 60 \* 1000/);
  });
});

describe("a plan changed by hand is announced", () => {
  const grant = fn(actions, "setAccountPlan");

  it("tells them when a plan is taken away, and when one is given or extended", () => {
    expect(grant).toMatch(/if \(plan === "trial"\) \{\s*await notifyPlanRevoked\(/);
    expect(grant).toMatch(/await notifyPlanActivated\(profile\.organization_id as string, plan, until, at\)/);
  });

  it("only after the plan itself was written, and only when something changed", () => {
    expect(grant.indexOf(".update({\n      plan,")).toBeLessThan(grant.indexOf("notifyPlanRevoked("));
    expect(grant).toMatch(/if \(before\?\.plan && \(before\.plan !== plan \|\| endMoved\)\)/);
  });

  it("keys each hand-made notice to its own moment, so the second is not swallowed", () => {
    // The delivery table is unique per (org, recipient, kind, period_end) and a
    // hand-granted plan has no period end.
    expect(fn(notify, "notifyPlanRevoked")).toMatch(/deliveryKey: eventKey/);
    expect(fn(notify, "notifyPlanActivated")).toMatch(/deliveryKey: periodEnd \?\? eventKey/);
    expect(fn(notify, "notifyBillingPeople")).toMatch(/periodEnd: input\.deliveryKey \?\? input\.periodEnd/);
  });

  it("never says a plan ran out of what was paid for — a comp ends through the same words", () => {
    expect(code("./notify-expiry.ts")).not.toMatch(/end of what was paid for/);
    expect(notify).toMatch(/`Your \$\{planName\} plan has ended/);
  });
});

describe("a suspension is announced to the owner", () => {
  const suspend = fn(actions, "setAccountSuspended");

  it("emails after the status change landed, and reports the result", () => {
    const send = suspend.indexOf("const mail = await sendStatusEmail(");
    expect(send).toBeGreaterThan(suspend.indexOf(".update({ status: next })"));
    expect(suspend).toMatch(/notice: `\$\{done\} \$\{mail\}`/);
  });

  it("writes to the owner, never to every member, and never to a synthetic address", () => {
    const send = fn(actions, "sendStatusEmail");
    expect(send).toMatch(/isOrgOwner\(/);
    expect(send).toMatch(/students\.engprogress\.com/);
    expect(send).not.toMatch(/for \(const/);
  });
});

describe("a plan granted by hand can carry an end date", () => {
  const grant = fn(actions, "setAccountPlan");
  const revenue = code("../admin/revenue.ts");
  const settings = read("../../app/(app)/settings/[section]/_components/billing.tsx");

  it("is stored as a 'manual' subscription row, so the nightly job ends it like Payme", () => {
    const upsert = block(grant, "if (until)");
    expect(upsert).toMatch(/provider: "manual"/);
    expect(upsert).toMatch(/current_period_end: until/);
    // A leftover Stripe id would make a dead subscription's events look like this grant's.
    expect(upsert).toMatch(/external_subscription_id: null/);
  });

  it("refuses an end date over a live paid subscription, before writing anything", () => {
    const refuse = grant.indexOf("if (until && sub && !manualRow && isLiveSubscription(sub))");
    expect(refuse).toBeGreaterThan(-1);
    expect(refuse).toBeLessThan(grant.indexOf(".update({\n      plan,"));
  });

  it("ends at the close of the chosen day in Tashkent, not at UTC midnight", () => {
    expect(fn(actions, "grantEndFromDate")).toMatch(/T23:59:59\+05:00/);
  });

  it("is never counted as revenue", () => {
    expect(fn(revenue, "loadRevenue")).toMatch(/\.filter\(\(s\) => s\.provider !== "manual"\)/);
    expect(revenue).toMatch(/select\("organization_id, plan, status, provider,/);
  });

  it("does not tell a learner their plan 'renews' unless Stripe renews it", () => {
    expect(settings).toMatch(/sub\.provider === "stripe" \? "renews" : "ends"/);
  });
});
