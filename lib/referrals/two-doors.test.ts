/**
 * The two ways a referral gets credited, and the order they are tried in.
 *
 * A link is caught by the proxy and stashed in a cookie; a code is typed into
 * the sign-up form. Both were specified from the start and only the first was
 * built for a while — which is the failure worth guarding, because it is
 * invisible: links keep working, so the feature looks fine, while every referrer
 * who shares a code out loud goes uncredited and has no way to tell.
 *
 * jsdom cannot run a sign-up, so this asserts the wiring where it lives.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const attribution = read("./attribution.ts");
const authActions = read("../../app/(auth)/actions.ts");
const dialog = read("../../app/_landing/sign-up-dialog.tsx");
const middleware = read("../../lib/supabase/middleware.ts");

describe("the link door", () => {
  it("is captured before the public-path early return", () => {
    // `/` is a public path AND the path every referral link lands on, so
    // capturing after that return would have matched nothing at all.
    const capture = middleware.indexOf("captureReferral(request, supabaseResponse)");
    const earlyReturn = middleware.indexOf("if (isPublicPath(pathname) && pathname !== \"/sign-in\")");
    expect(capture).toBeGreaterThan(-1);
    expect(earlyReturn).toBeGreaterThan(-1);
    expect(capture).toBeLessThan(earlyReturn);
  });

  it("keeps the first code clicked, not the last", () => {
    // Matches the unique organization_id downstream. If the cookie took the
    // newest code, the DB and the cookie would disagree about who referred whom.
    expect(middleware).toMatch(/if \(request\.cookies\.get\(REFERRAL_COOKIE\)\) return;/);
  });
});

describe("the code door", () => {
  it("exists on the sign-up form", () => {
    expect(dialog).toMatch(/name="referral_code"/);
  });

  it("is optional, so a wrong code cannot block a sign-up", () => {
    // The field must not be `required`. Somebody mistyping a friend's code
    // should still get an account; they just do not get attributed.
    const field = dialog.slice(dialog.indexOf('name="referral_code"'), dialog.indexOf('name="referral_code"') + 400);
    expect(field).not.toMatch(/\brequired\b/);
  });

  it("is actually passed to the claim", () => {
    // The field existing and being read are different things, and a form field
    // nothing reads looks exactly like one that works.
    expect(authActions).toMatch(/claimReferral\(String\(formData\.get\("referral_code"\)/);
  });
});

describe("when both doors are open at once", () => {
  it("tries the typed code before the stashed one", () => {
    const typed = attribution.indexOf('source: "code"');
    const stashed = attribution.indexOf('source: "link"');
    expect(typed).toBeGreaterThan(-1);
    expect(stashed).toBeGreaterThan(-1);
    // A ninety-day-old cookie from an accidental click should not outrank a
    // person typing a code at the moment they sign up.
    expect(typed).toBeLessThan(stashed);
  });

  it("only consumes the cookie after attribution succeeds", () => {
    // A transient database failure must not permanently lose a valid referral.
    const body = attribution.slice(
      attribution.indexOf("export async function claimReferral"),
      attribution.indexOf("export async function attribute"),
    );
    const consume = body.indexOf("store.delete(REFERRAL_COOKIE)");
    const firstAttribute = body.indexOf("await attribute(");
    expect(consume).toBeGreaterThan(-1);
    expect(consume).toBeGreaterThan(firstAttribute);
  });

  it("still records which door was used", () => {
    // `source` is the only way to answer "do links or codes actually work?"
    // later, and the answer decides where the effort goes.
    expect(attribution).toMatch(/source: "link" \| "code"/);
  });
});

describe("what neither door will do", () => {
  it("refuses a code belonging to a stopped account", () => {
    expect(attribution).toMatch(/account\.status !== "active"/);
  });

  it("refuses the referrer's own profile and their own workspace", () => {
    expect(attribution).toMatch(/account\.profile_id === args\.profileId/);
    expect(attribution).toMatch(/account\.organization_id === args\.organizationId/);
  });

  it("shape-checks before querying, since a ?ref= is attacker-controlled", () => {
    const check = attribution.indexOf("isCodeShape(code)");
    const query = attribution.indexOf('.from("referral_accounts")');
    expect(check).toBeLessThan(query);
  });
});

/*
 * THE TWO WAYS A REAL REFERRAL STILL LEAKED (audit, 2026-09-26).
 * Neither is visible from the referrer's side — they just never hear anything.
 */
describe("a referral survives the trip through someone else's device or Google", () => {
  it("is claimed at password sign-in, after the sign-in succeeded", () => {
    // The confirmation link is usually opened in a phone's mail app, which has
    // no cookie; the browser that has it only ever sees a sign-in.
    const signIn = authActions.slice(authActions.indexOf("export async function signIn"), authActions.indexOf("async function emailForLogin"));
    const ok = signIn.indexOf("signInWithPassword(");
    const claim = signIn.indexOf("await claimReferral();");
    expect(claim).toBeGreaterThan(ok);
    expect(claim).toBeLessThan(signIn.indexOf("redirect("));
  });

  it("keeps a code typed in the dialog when the person chooses Google", () => {
    const google = dialog.slice(dialog.indexOf("async function withGoogle"), dialog.indexOf("signInWithOAuth("));
    expect(google).toMatch(/await rememberReferralCode\(referral\.current\?\.value \?\? ""\)/);
    expect(dialog).toMatch(/ref=\{referral\}\s*id="su_ref"/);
    expect(authActions).toMatch(/export async function rememberReferralCode\(raw: string\): Promise<void> \{\s*await stashReferralCode\(raw\);/);
  });
});
