/**
 * AN INVITE ISSUED TO AN EMAIL ADDRESS IS SENT TO IT.
 *
 * The form asked for an address and then sent nothing; the panel admitted it in
 * small print. And "New link" mints a fresh token, which kills the old one — so
 * once the first link is emailed, renewing without re-sending leaves the
 * invitee holding a dead link. Source-read, like the billing wiring tests: jsdom
 * cannot run the server action.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/* Every server module of this route — the actions AND the `_lib/` helpers
   they call — listed from disk, not by name. ⚠️ These checks used to read
   `./actions.ts` alone; when the actions were split across files (2026-10-17)
   a function that moved would have been looked up where it no longer is. */
const here = dirname(fileURLToPath(import.meta.url));
const sources = ["", "_lib"].flatMap((sub) =>
  readdirSync(join(here, sub))
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .map((f) =>
      readFileSync(join(here, sub, f), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1"),
    ),
);
const panel = readFileSync(fileURLToPath(new URL("../_components/invite-member-panel.tsx", import.meta.url)), "utf8");

/** A function's body, cut at the next declaration IN ITS OWN FILE. */
function fn(name: string): string {
  for (const src of sources) {
    const start = src.search(new RegExp(`(export )?(async )?function ${name}\\b`));
    if (start < 0) continue;
    const rest = src.slice(start + 1);
    const next = rest.search(/\n(export |async function |function |type |interface |const )/);
    return next < 0 ? src.slice(start) : src.slice(start, start + 1 + next);
  }
  return "";
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
