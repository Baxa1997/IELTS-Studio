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
    expect(body).toMatch(/notifyPlanExpired\(organizationId, previous, reason\)/);
  });

  it("is the only place a webhook downgrade goes through", () => {
    const apply = fn(service, "applyPlanChange");
    expect(apply).toMatch(/downgradeToFree\(change\.organizationId, effect\)/);
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

  it("leaves a live subscription alone", () => {
    expect(grant).toMatch(/sub\.status !== "canceled" && !isLiveSubscription\(sub\)/);
  });

  it("closes it only after the plan itself was written", () => {
    expect(grant.indexOf('.from("organizations")')).toBeLessThan(grant.indexOf("isLiveSubscription(sub)"));
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
