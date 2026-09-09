/**
 * Closing the feedback loop, without opening a privacy hole.
 *
 * A referral programme only works if the referrer finds out it worked. Before
 * this they applied and heard nothing, were approved and heard nothing, and when
 * someone they introduced actually paid, heard nothing then either. The third
 * email is the one that decides whether anybody shares their link twice.
 *
 * The risk that comes with it: the earnings email is sent at the exact moment we
 * know who paid, which is precisely the fact the referrer is not allowed to have
 * — `organization_id` is withheld from their column grant for that reason. An
 * email is the easiest place in the system to leak it back.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const notify = read("./notify.ts");
const accrual = read("./accrual.ts");
const service = read("./service.ts");
const shareCard = read("../../app/(app)/referrals/share-card.tsx");

describe("the earnings email says what happened, not who", () => {
  it("never puts the paying organization in a message", () => {
    // notifyEarned takes an amount and a currency. If it ever grows an
    // organizationId, or reads one, the referrer is one template edit away from
    // being handed the identity the column grant exists to withhold.
    const fn = notify.slice(notify.indexOf("export async function notifyEarned"), notify.length);
    expect(fn).not.toMatch(/organization/i);
    expect(fn).not.toMatch(/paid_by|payer|customer/i);
  });

  it("is sent only after the ledger row is committed", () => {
    // Announcing money before it is recorded is how somebody gets told twice
    // about a commission that exists once.
    const insert = accrual.indexOf('.insert({');
    const email = accrual.indexOf("notifyEarned(");
    expect(insert).toBeGreaterThan(-1);
    expect(email).toBeGreaterThan(insert);
  });

  it("stays silent on a duplicate accrual", () => {
    // 23505 means this referral already earned — and was already told. A second
    // email for the same commission reads as a second payment.
    const tail = accrual.slice(accrual.indexOf('error.code !== "23505"'));
    const bail = tail.indexOf("if (error) return 0;");
    const email = tail.indexOf("notifyEarned(");
    expect(bail).toBeGreaterThan(-1);
    expect(bail).toBeLessThan(email);
  });
});

describe("no email can break the thing it is announcing", () => {
  it("swallows its own failures", () => {
    // Three try/catch blocks, one per notification. An approval that rolls back
    // because SMTP was down is a worse outcome than a silent one.
    expect(notify.match(/catch \(err\)/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("sends after the decision lands, never before", () => {
    const update = service.indexOf('status: "active"');
    const email = service.indexOf("notifyApproved(");
    expect(email).toBeGreaterThan(update);
  });

  it("skips addresses that cannot receive mail", () => {
    // A teacher-created student gets an undeliverable address at
    // students.engprogress.com (CLAUDE.md). Writing to it bounces every time.
    expect(notify).toMatch(/students\.engprogress\.com/);
  });

  it("escapes anything user-supplied that reaches an HTML body", () => {
    // Names and codes both land in HTML. A name is free text the user chose.
    expect(notify).toMatch(/function escapeHtml/);
    expect(notify).toMatch(/escapeHtml\(who\.name\)/);
  });
});

describe("sharing where it actually gets shared", () => {
  it("offers Telegram, not only a clipboard", () => {
    expect(shareCard).toMatch(/t\.me\/share\/url/);
  });

  it("encodes both the link and the message", () => {
    // An un-encoded URL breaks at the first `&`, and the referral code is the
    // part after it — so the link would arrive without its attribution.
    expect(shareCard).toMatch(/encodeURIComponent\(url\)/);
    expect(shareCard).toMatch(/encodeURIComponent\(message\)/);
  });

  it("writes the message for them", () => {
    // A bare link in a group chat gets scrolled past. Most people will not
    // write their own pitch, so shipping one is the difference.
    expect(shareCard).toMatch(/const message = /);
  });

  it("needs no bot token", () => {
    // t.me/share is a plain URL. Reaching for the Bot API here would put a
    // secret behind a button that does not need one.
    expect(shareCard).not.toMatch(/TELEGRAM_BOT_TOKEN|api\.telegram\.org/);
  });
});
