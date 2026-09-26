/**
 * AN INVITE ISSUED TO AN EMAIL ADDRESS IS SENT TO IT.
 *
 * The form asked for an address and then sent nothing; the panel admitted it in
 * small print. And "New link" mints a fresh token, which kills the old one — so
 * once the first link is emailed, renewing without re-sending leaves the
 * invitee holding a dead link. Source-read, like the billing wiring tests: jsdom
 * cannot run the server action.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const src = readFileSync(fileURLToPath(new URL("./actions.ts", import.meta.url)), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/.*$/gm, "$1");
const panel = readFileSync(fileURLToPath(new URL("./invite-member-panel.tsx", import.meta.url)), "utf8");

function fn(name: string): string {
  const start = src.search(new RegExp(`(export )?(async )?function ${name}\\b`));
  if (start < 0) return "";
  const rest = src.slice(start + 1);
  const next = rest.search(/\n(export |async function |function |type |interface |const )/);
  return next < 0 ? src.slice(start) : src.slice(start, start + 1 + next);
}

describe("invites reach the person they name", () => {
  it("emails a new invite after the row is saved", () => {
    const invite = fn("inviteMember");
    expect(invite.indexOf('.from("invites").upsert(')).toBeGreaterThan(-1);
    expect(invite.indexOf("sendInviteEmail(")).toBeGreaterThan(invite.indexOf('.from("invites").upsert('));
  });

  it("re-sends when the link is renewed, because the old link is now dead", () => {
    const renew = fn("refreshInvite");
    expect(renew.indexOf("const emailNote = await sendInviteEmail(")).toBeGreaterThan(renew.indexOf('.from("invites")'));
    expect(renew).toMatch(/inviteUrl: `\$\{origin\}\/accept-invite\?token=\$\{token\}`, emailNote \}/);
  });

  it("links to the public site, never the request origin", () => {
    expect(fn("sendInviteEmail")).toMatch(/serverEnv\.outboundSiteUrl\}\/accept-invite\?token=/);
  });

  it("still hands the link back, so a failed send is not a dead end", () => {
    expect(fn("inviteMember")).toMatch(/inviteUrl: `\$\{origin\}\/accept-invite\?token=\$\{token\}`, emailNote/);
  });

  it("no longer tells the staffer that nothing is sent", () => {
    expect(panel).not.toMatch(/no email is sent/);
    expect(panel).toMatch(/state\.emailNote/);
  });
});
