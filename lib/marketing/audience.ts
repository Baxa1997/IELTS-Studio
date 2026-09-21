import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Who a broadcast can actually reach.
 *
 * ⚠️ "ALL REGISTERED EMAILS" IS NOT `auth.users.email`, AND GETTING THAT WRONG
 * MAILS NOBODY. A centre account never claims a real inbox: `handle_new_user`
 * gives it a synthetic address so it can sign in by login instead, and the real
 * address lives on `profiles.contact_email`. A teacher-created student gets the
 * same treatment at `students.engprogress.com`. Measured against production on
 * 2026-09-21: of 192 accounts, 12 are synthetic student addresses and 4 more
 * are synthetic centre ones — so the naive version bounces 16 and reaches none
 * of them, while the 4 centre admins who DO have a real inbox get nothing.
 *
 * So the address is resolved per person, preferring the contact address and
 * falling back to the auth one, and anything undeliverable is dropped with a
 * reason rather than silently.
 */

export type Segment = "learners" | "staff" | "everyone";

export interface Recipient {
  profileId: string;
  name: string;
  email: string;
  role: string;
  orgKind: string;
  /** False when they have unsubscribed — kept in the list so the composer can
   *  say "12 of these have opted out" rather than quietly showing a smaller
   *  number than the admin expected. */
  reachable: boolean;
  optedOut: boolean;
}

/**
 * Domains that exist to be undeliverable.
 *
 * The two `engprogress.com` subdomains are ours, minted by `handle_new_user`
 * for accounts that sign in by login. The rest are reserved by RFC 2606 and
 * RFC 6761 precisely so they can never receive mail — several seeded test
 * accounts use `example.com`, and mailing them would be a bounce every time,
 * which is itself a deliverability signal.
 */
const UNDELIVERABLE = [
  "students.engprogress.com",
  "centers.engprogress.com",
  "example.com",
  "example.net",
  "example.org",
  ".invalid",
  ".test",
  ".localhost",
];

function isDeliverable(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return false;
  const domain = email.slice(at + 1);
  if (!domain.includes(".")) return false;
  return !UNDELIVERABLE.some((bad) =>
    bad.startsWith(".") ? domain.endsWith(bad) : domain === bad,
  );
}

/** The one address that reaches this person, or null if none does. */
export function resolveAddress(
  contactEmail: string | null | undefined,
  authEmail: string | null | undefined,
): string | null {
  const contact = contactEmail?.trim().toLowerCase();
  if (contact && isDeliverable(contact)) return contact;
  const auth = authEmail?.trim().toLowerCase();
  if (auth && isDeliverable(auth)) return auth;
  return null;
}

const CENTER_ROLES = new Set(["center_admin", "administrator", "teacher"]);

/**
 * Does this person belong to that segment?
 *
 * Split out so the page can list EVERYONE once and slice it three ways, rather
 * than calling `loadAudience` per segment — each call paginates the whole
 * `auth.users` table through the Admin API, so three calls meant three full
 * listings to render one screen.
 */
export function inSegment(recipient: Pick<Recipient, "role" | "orgKind">, segment: Segment): boolean {
  if (segment === "everyone") return true;
  if (segment === "staff") return CENTER_ROLES.has(recipient.role);
  return recipient.orgKind === "personal" && recipient.role === "student";
}

/**
 * Every reachable person in a segment.
 *
 * `learners` is the default and means SOLO learners — a personal org. A centre
 * student is deliberately excluded: they only ever practise what their teacher
 * attaches to their group (`isHomeworkOnlyStudent`), so mailing them about new
 * practice content advertises something they cannot go and use, and it goes
 * around the teacher who chooses their material. They can still be picked by
 * hand, which is the difference between a default and a rule.
 */
export async function loadAudience(segment: Segment = "learners"): Promise<Recipient[]> {
  const admin = createAdminClient();

  const emailById = new Map<string, string>();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("[marketing] listUsers failed:", error.message);
      break;
    }
    const users = data?.users ?? [];
    for (const u of users) if (u.email) emailById.set(u.id, u.email);
    if (users.length < 1000) break;
  }

  const [{ data: profiles }, { data: orgs }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, role, contact_email, organization_id, marketing_opt_out")
      .order("created_at", { ascending: false }),
    admin.from("organizations").select("id, kind"),
  ]);

  const kindByOrg = new Map((orgs ?? []).map((o) => [String(o.id), String(o.kind)]));
  const out: Recipient[] = [];

  for (const p of profiles ?? []) {
    const orgKind = kindByOrg.get(String(p.organization_id)) ?? "unknown";
    const role = String(p.role);

    if (!inSegment({ role, orgKind }, segment)) continue;

    const email = resolveAddress(p.contact_email, emailById.get(String(p.id)));
    if (!email) continue; // no inbox exists — not a choice, a fact

    const optedOut = p.marketing_opt_out === true;
    out.push({
      profileId: String(p.id),
      name: (p.full_name as string | null)?.trim() || "Learner",
      email,
      role,
      orgKind,
      optedOut,
      reachable: !optedOut,
    });
  }

  return out;
}
