# Transactional email setup (Brevo)

How `no-reply@engprogress.com` sends mail, and how to change it later.

## The shape of it

There are **two** email systems, and both need the same credentials:

| Email | Sent by | Configured in |
| --- | --- | --- |
| Center application + approval / rejection<br>Student login credentials | our code (`lib/email/send.ts`, nodemailer) | `.env.local` + Vercel env |
| Signup confirmation, password reset | Supabase Auth | Supabase → Auth → SMTP |

### Who receives what, when a center applies

The single **Organization email** field on the application form becomes both the
center admin's sign-in address and `organizations.contact_email`. From it:

| Moment | Goes to |
| --- | --- |
| Application submitted | the **center** — "we have it, wait for review" |
| Application submitted | the **platform owner** — `PLATFORM_ADMIN_EMAIL`, a nudge to go and review |
| Approved / rejected | the **center**, at `contact_email` |

Supabase's SMTP box does **not** cover the first row. Configuring only Supabase
leaves center approvals silent — the approval still succeeds, and the admin UI
reports that no email went out.

## DNS facts for engprogress.com

- Nameservers are **ahost.uz** (`rdns1/2/3.ahost.uz`) → every DNS record goes in
  ahost's **DNS zone editor**, not in Vercel, and not via ahost's
  "create subdomain" button (that one is for websites and will not help).
- `A engprogress.com → 216.198.79.1` is **Vercel**. Never touch it.
- `MX engprogress.com → engprogress.com` points mail at the web server, which
  runs no SMTP. **Inbound mail to @engprogress.com is dead.** Brevo only sends,
  so this stays broken until ahost is asked to host a real mailbox.

## Brevo setup

1. Sign up at brevo.com. Free tier is **300 emails/day** — enough for approvals,
   not enough for a teacher bulk-adding a few hundred students in one afternoon.
2. **Senders, Domains & Dedicated IPs → Domains → Add a domain** →
   `engprogress.com`. Brevo prints the records to add.
3. Add them in ahost's DNS editor. Expect roughly:
   - `TXT` on the root — `brevo-code:…` (ownership check)
   - `TXT` on `mail._domainkey` — the DKIM public key
   - an SPF change, see the warning below
   The dashboard's exact values win over this list.
4. Wait for propagation (usually minutes, allow an hour) and hit **Verify**.
   Every record must read authenticated before sending will work properly.
5. **SMTP & API → SMTP tab** → generate an **SMTP key**.

## The four records

Brevo authenticates by **DKIM alignment**, so it asks for no SPF change at all.
Leave the existing SPF record alone.

| Type | Name | Value | Action |
| --- | --- | --- | --- |
| TXT | `@` (blank if `@` is rejected) | `brevo-code:…` | add |
| CNAME | `brevo1._domainkey` | `b1.engprogress-com.dkim.brevo.com` | add |
| CNAME | `brevo2._domainkey` | `b2.engprogress-com.dkim.brevo.com` | add |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` | **replace** |

DKIM arrives as CNAMEs, not a 400-character TXT key, so registrar panels that
truncate long TXT values are not a problem here.

## ⚠️ DMARC — edit, never add

The domain already has one: `v=DMARC1; p=none;`. **One DMARC record per domain** —
two of them is treated as none. Brevo's value replaces it (and adds `rua=`, which
turns on aggregate reports). The same rule governs SPF, which is why the record
above is an edit and not an addition.

Ordinary TXT records are different: the `brevo-code` TXT sits happily alongside
the existing `google-site-verification` TXT at the root. Only SPF and DMARC are
one-per-domain.

## SPF, for later

Untouched and currently:

```
v=spf1 +a +mx +ip4:185.196.212.52 ~all
```

`+a` authorizes Vercel's shared IP to send as this domain and `+mx` authorizes a
mail host that doesn't exist. Neither sends mail, so trimming them would tighten
the record — but only after Brevo is verified and working. One change at a time.

## The credentials

| Variable | Value |
| --- | --- |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `b4c665001@smtp-brevo.com` |
| `SMTP_PASS` | the **SMTP key** — *not* the Brevo account password |
| `SMTP_FROM` | `EngProgress <no-reply@engprogress.com>` |
| `PLATFORM_ADMIN_EMAIL` | where "a center has applied" lands — a mailbox you read |

`PLATFORM_ADMIN_EMAIL` matters more than it looks. Unset, notifications fall back
to the super admin's account email, `super_admin@engprogress.com` — and this
domain has **no inbound mail** (the MX points at Vercel), so that address is a
black hole. Applications would then sit in `/admin` unannounced.

`SMTP_USER` is **not** the Brevo account email — Brevo issues a dedicated login,
shown under *Your SMTP Settings*. Using the account email fails with
`535 5.7.8 Authentication failed`, as does using the account password in place of
the SMTP key.

### ⚠️ Never enable "block unauthorized IP addresses"

The SMTP & API page offers to restrict sending to an allow-list of IPs. **Do not
turn this on.** Production runs on Vercel serverless, whose egress IPs rotate
with no stable range to authorize, so enabling it breaks sending in production
while local dev keeps working — a confusing failure to chase down later.

These go in three places: `.env.local` (dev), Vercel project env vars (prod),
and Supabase → Auth → SMTP (host/port/user/pass plus sender name+address).

### ⚠️ The key expires two ways

Brevo SMTP keys expire on their set date **and after 90 days of inactivity**,
whichever comes first.

- Key `engprogress-app`, Standard (64), created **2026-08-07**, expires **2027-08-07**.

The inactivity clock is the dangerous one. Center approvals are rare, so a quiet
quarter kills the key on its own. The failure is silent: sending just starts
returning `535`, the approval still succeeds, and the admin UI reports the email
was not sent — which reads like an app bug.

**If email stops working after a quiet period, regenerate the key before
debugging anything else.** `node scripts/test-email.mjs` tells you in seconds.

## Verify before trusting it

```bash
node scripts/test-email.mjs you@gmail.com
```

Checks config, connection and auth, then sends a real message through the same
code path as the approval email. Check the spam folder too — a brand-new sending
domain often lands there for the first few sends.

## Known gaps

- **No inbound mail.** The rejection email invites the applicant to reply, and
  that reply currently goes nowhere. Either ask ahost to host a mailbox and fix
  the MX, or change the copy in `app/admin/actions.ts`.
- **Students created without an email** get a synthetic
  `<login>@students.engprogress.com` address that intentionally does not resolve,
  so they have no email password reset. Their teacher resets it.
