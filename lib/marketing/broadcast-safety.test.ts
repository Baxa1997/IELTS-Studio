/**
 * The four ways a marketing broadcast can quietly do damage.
 *
 * This feature is the only non-transactional mail the platform sends, and every
 * failure mode below is silent — the send "works", and the cost arrives later
 * as bounces, complaints, or a suspended sender that takes password resets and
 * centre approvals down with it.
 *
 *   1. MAILING THE WRONG ADDRESS. "All registered emails" is not
 *      `auth.users.email`: 16 of 192 production accounts carry a synthetic
 *      address they can never receive at, and the centre accounts that DO have
 *      a real inbox keep it somewhere else entirely.
 *   2. AN UNSUBSCRIBE ANYONE CAN FORGE, or one that does not work — the first
 *      lets a stranger opt somebody out, the second earns a spam complaint.
 *   3. A URL THAT IS NOT A URL. `javascript:` in a footer is what a phishing
 *      filter looks for, and one of them sinks the whole broadcast.
 *   4. A SERVER ACTION WITHOUT ITS OWN GUARD. The page's `requireSuperAdmin`
 *      protects the page; the action behind it is a separate RPC endpoint.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");

beforeAll(() => {
  // So the HMAC does not depend on a real service-role key being present.
  process.env.MARKETING_UNSUBSCRIBE_SECRET = "test-secret-for-unsubscribe-tokens";
});

/* ── 1. who actually receives it ──────────────────────────────────────────── */

describe("resolving the one address that reaches somebody", () => {
  it("prefers the contact address over the auth one", async () => {
    // A centre account's auth address is synthetic by design — the real inbox
    // is on `profiles.contact_email`.
    const { resolveAddress } = await import("./audience");
    expect(resolveAddress("real@gmail.com", "centre-x@centers.engprogress.com")).toBe("real@gmail.com");
  });

  it("refuses both of our own synthetic domains", async () => {
    const { resolveAddress } = await import("./audience");
    expect(resolveAddress(null, "someone@students.engprogress.com")).toBeNull();
    expect(resolveAddress(null, "someone@centers.engprogress.com")).toBeNull();
  });

  it("refuses the reserved domains that can never receive mail", async () => {
    // Several seeded accounts use example.com; mailing them is a guaranteed
    // bounce, and bounces are themselves a deliverability signal.
    const { resolveAddress } = await import("./audience");
    expect(resolveAddress(null, "a@example.com")).toBeNull();
    expect(resolveAddress(null, "a@example.org")).toBeNull();
    expect(resolveAddress(null, "a@something.invalid")).toBeNull();
    expect(resolveAddress(null, "a@box.test")).toBeNull();
  });

  it("falls through to the auth address when the contact one is synthetic", async () => {
    const { resolveAddress } = await import("./audience");
    expect(resolveAddress("x@students.engprogress.com", "real@gmail.com")).toBe("real@gmail.com");
  });

  it("normalises case, because an address is not case-sensitive in practice", async () => {
    const { resolveAddress } = await import("./audience");
    expect(resolveAddress(null, "  Real@Gmail.COM ")).toBe("real@gmail.com");
  });

  it("returns null rather than something unusable", async () => {
    const { resolveAddress } = await import("./audience");
    expect(resolveAddress(null, null)).toBeNull();
    expect(resolveAddress("", "not-an-email")).toBeNull();
    expect(resolveAddress(null, "no-domain@localpart")).toBeNull();
  });
});

/* ── 2. the unsubscribe ───────────────────────────────────────────────────── */

describe("the unsubscribe token", () => {
  const A = "11111111-1111-1111-1111-111111111111";
  const B = "22222222-2222-2222-2222-222222222222";

  it("accepts the token it minted", async () => {
    const { unsubscribeToken, tokenMatches } = await import("./unsubscribe");
    expect(tokenMatches(A, unsubscribeToken(A))).toBe(true);
  });

  it("refuses one minted for somebody else", async () => {
    // Without this, `?u=<any profile id>` unsubscribes a stranger — and the ids
    // are not secret, they appear in our own URLs.
    const { unsubscribeToken, tokenMatches } = await import("./unsubscribe");
    expect(tokenMatches(A, unsubscribeToken(B))).toBe(false);
  });

  it("refuses an absent or empty token", async () => {
    const { tokenMatches } = await import("./unsubscribe");
    expect(tokenMatches(A, null)).toBe(false);
    expect(tokenMatches(A, undefined)).toBe(false);
    expect(tokenMatches(A, "")).toBe(false);
  });

  it("compares in constant time", async () => {
    // A length-leaking or short-circuiting compare lets a token be walked one
    // character at a time — the same class of mistake as the `ilike` referral
    // lookup that leaked a referral code.
    const source = read("./unsubscribe.ts");
    expect(source).toMatch(/timingSafeEqual/);
    expect(source).not.toMatch(/expected === given|token === unsubscribeToken/);
  });

  it("puts the token in both the reader's link and the one-click endpoint", async () => {
    const { unsubscribeUrl, unsubscribePostUrl, unsubscribeToken } = await import("./unsubscribe");
    const token = unsubscribeToken(A);
    expect(unsubscribeUrl(A)).toContain(`t=${token}`);
    expect(unsubscribePostUrl(A)).toContain(`t=${token}`);
    // Different paths, because App Router will not allow a route.ts beside a
    // page.tsx — see the note on unsubscribePostUrl.
    expect(unsubscribeUrl(A)).toContain("/unsubscribe?");
    expect(unsubscribePostUrl(A)).toContain("/api/unsubscribe?");
  });

  it("is reachable without a session", () => {
    /* ⚠️ BOTH ROUTES MUST BE PUBLIC. The person clicking is in their inbox and
       usually signed out; bouncing them to /sign-in reads as "they won't let me
       leave", which is the moment somebody presses the spam button instead. The
       API route is hit by Gmail itself, with no cookie at all. */
    const middleware = read("../supabase/middleware.ts");
    expect(middleware).toMatch(/"\/unsubscribe",/);
    expect(middleware).toMatch(/"\/api\/unsubscribe",/);
  });
});

/* ── 3. what goes in the message ──────────────────────────────────────────── */

describe("link safety", () => {
  it("allows ordinary web links", async () => {
    const { isSafeUrl } = await import("./render");
    expect(isSafeUrl("https://www.engprogress.com/read")).toBe(true);
    expect(isSafeUrl("http://example.org/a.pdf")).toBe(true);
  });

  it("refuses every scheme a phishing filter looks for", async () => {
    const { isSafeUrl } = await import("./render");
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeUrl("not a url at all")).toBe(false);
  });
});

describe("rendering the message", () => {
  const base = {
    body: "New reading tests are live.\n\nGo and try one.",
    links: [{ label: "Open", url: "https://www.engprogress.com/read" }],
    name: "Javohir",
    unsubscribeUrl: "https://www.engprogress.com/unsubscribe?u=1&t=2",
  };

  it("always carries the unsubscribe link in BOTH parts", async () => {
    // A recipient reading the plain-text part must have the same way out as one
    // reading the HTML; a footer that only exists in HTML is not an opt-out.
    const { renderText, renderHtml } = await import("./render");
    expect(renderText(base)).toContain(base.unsubscribeUrl);
    // `&` is escaped inside an href, which is correct HTML — the browser
    // unescapes it back to a working URL. Asserting the raw form here would be
    // asserting a bug.
    expect(renderHtml(base)).toContain(base.unsubscribeUrl.replace(/&/g, "&amp;"));
  });

  it("escapes the body so a stray angle bracket cannot break the markup", async () => {
    const { renderHtml } = await import("./render");
    const html = renderHtml({ ...base, body: "5 < 6 & <script>alert(1)</script>" });
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("escapes the reader's own name", async () => {
    const { renderHtml } = await import("./render");
    expect(renderHtml({ ...base, name: "<b>X" })).toContain("&lt;b&gt;X");
  });

  it("turns a blank line into a paragraph", async () => {
    const { renderHtml } = await import("./render");
    const html = renderHtml(base);
    expect(html.match(/<p style="margin:0 0 14px">/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("sends a text part at all", async () => {
    // A bulk HTML email with no text alternative is one of the loudest spam
    // signals there is.
    const broadcast = read("./broadcast.ts");
    expect(broadcast).toMatch(/text: renderText\(/);
    expect(broadcast).toMatch(/html: renderHtml\(/);
  });

  it("asks mail clients for a native unsubscribe button", async () => {
    const broadcast = read("./broadcast.ts");
    expect(broadcast).toMatch(/"List-Unsubscribe"/);
    expect(broadcast).toMatch(/"List-Unsubscribe-Post": "List-Unsubscribe=One-Click"/);
  });
});

/* ── 4. who is allowed to press send ──────────────────────────────────────── */

describe("the server actions guard themselves", () => {
  const actions = read("../../app/admin/marketing/actions.ts");

  for (const fn of ["uploadAssets", "composeBroadcast", "drainBroadcast"]) {
    it(`${fn} calls requireSuperAdmin before doing anything`, () => {
      /* A server action is an RPC endpoint any signed-in account can POST to.
         The guard on the page that renders the form protects the form, not
         this — and the thing behind it is every learner's inbox. */
      const start = actions.indexOf(`export async function ${fn}`);
      expect(start).toBeGreaterThan(-1);
      const body = actions.slice(start, start + 600);
      expect(body).toMatch(/await requireSuperAdmin\(\)/);
    });
  }

  it("never lets the browser name an address", () => {
    /* The form sends profile ids and the addresses are re-resolved server-side.
       If an address could arrive from the client, this action would be an open
       relay wearing our own domain. */
    expect(actions).toMatch(/profile_ids/);
    expect(actions).not.toMatch(/formData\.get\("email/);
    const broadcast = read("./broadcast.ts");
    expect(broadcast).toMatch(/resolveAddress\(p\.contact_email/);
  });
});

/* ── the opt-out is actually honoured ─────────────────────────────────────── */

describe("an unsubscribed person is not mailed", () => {
  const broadcast = read("./broadcast.ts");

  it("is filtered when the broadcast is queued", () => {
    expect(broadcast).toMatch(/marketing_opt_out === true/);
  });

  it("is checked AGAIN immediately before each message goes out", () => {
    /* Draining 180 recipients takes minutes, and somebody may click unsubscribe
       from an earlier batch of this very send. Mailing them after that is
       exactly the complaint the opt-out exists to prevent. */
    const occurrences = broadcast.match(/marketing_opt_out === true/g) ?? [];
    expect(occurrences.length).toBeGreaterThanOrEqual(2);
    expect(broadcast).toMatch(/unsubscribed mid-send/);
  });
});
