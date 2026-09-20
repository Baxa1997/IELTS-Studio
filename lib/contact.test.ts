/**
 * The contact details stay in ONE file.
 *
 * ⚠️ WHAT THIS IS GUARDING AGAINST, BECAUSE IT ALREADY HAPPENED. The address
 * was spelled out in six files. Two centre-facing surfaces — the landing's
 * centres band and the console's enterprise "Contact sales" link — never had
 * the real one at all: they shipped `centers@engprogress.com` and
 * `sales@engprogress.com`, neither of which exists. A centre that wrote to
 * either got silence, and nothing failed, because an invented address is
 * indistinguishable from a real one to every tool in this repo.
 *
 * So the test is not "is the address correct" (nothing here can know that). It
 * is "is there exactly one place where the answer lives", which is the only
 * property that makes the address correctable in one edit.
 *
 * Sources are enumerated with `git ls-files` — the same approach as the theme
 * guards — so a new file is covered the moment it is tracked.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_TEL_HREF, CONTACT_WHATSAPP_HREF } from "./contact";

/** Where the values are allowed to appear as literals. */
const HOME = "lib/contact.ts";

function trackedSources(): string[] {
  const out = execFileSync("git", ["ls-files", "app", "components", "lib"], { encoding: "utf8" });
  return out
    .split("\n")
    .filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"))
    .filter((f) => f !== HOME);
}

/** The phone with every separator stripped, which is how a `tel:` or a wa.me
 *  link spells it — a copy that got reformatted is still a copy. */
const digits = (s: string) => s.replace(/[^0-9]/g, "");

describe("the contact details live in exactly one file", () => {
  it("no other source hardcodes the email", () => {
    const offenders = trackedSources().filter((f) => {
      // The deletions in a working tree are still listed by `git ls-files`
      // until they are staged, so a missing file is skipped rather than thrown.
      let src: string;
      try {
        src = readFileSync(f, "utf8");
      } catch {
        return false;
      }
      return src.includes(CONTACT_EMAIL);
    });
    expect(offenders, `import CONTACT_EMAIL from @/${HOME} instead`).toEqual([]);
  });

  it("no other source hardcodes the phone, in any spelling", () => {
    const bare = digits(CONTACT_PHONE);
    const offenders = trackedSources().filter((f) => {
      let src: string;
      try {
        src = readFileSync(f, "utf8");
      } catch {
        return false;
      }
      return src.includes(CONTACT_PHONE) || src.includes(bare);
    });
    expect(offenders, `import CONTACT_PHONE from @/${HOME} instead`).toEqual([]);
  });

  it("derives the hrefs from the display number rather than repeating it", () => {
    // `tel:` keeps the +, wa.me does not — the two must still describe the same
    // number, which is what breaks if someone edits one href by hand.
    expect(CONTACT_TEL_HREF).toBe(`tel:+${digits(CONTACT_PHONE)}`);
    expect(CONTACT_WHATSAPP_HREF).toBe(`https://wa.me/${digits(CONTACT_PHONE)}`);
  });

  it("publishes a real address, not a role account nobody reads", () => {
    /* `centers@` and `sales@` were the two that shipped and reached nobody.
       Any @engprogress.com contact has to exist as a mailbox first — this fails
       until someone deletes this line, which is the conversation we want. */
    expect(CONTACT_EMAIL).not.toMatch(/^(centers|sales|info|support|hello)@/);
  });
});
