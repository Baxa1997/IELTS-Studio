# Transactional email setup (Brevo)

How `no-reply@engprogress.com` sends mail, and how to change it later.

## The shape of it

There are **two** email systems, and both need the same credentials:

| Email | Sent by | Configured in |
| --- | --- | --- |
| Center approval / rejection<br>Student login credentials | our code (`lib/email/send.ts`, nodemailer) | `.env.local` + Vercel env |
| Signup confirmation, password reset | Supabase Auth | Supabase → Auth → SMTP |

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

## ⚠️ The SPF record — edit, never add

The domain already has exactly one SPF record:

```
v=spf1 +a +mx +ip4:185.196.212.52 ~all
```

Brevo needs `include:spf.brevo.com` in it. **Edit this record in place:**

```
v=spf1 +a +mx +ip4:185.196.212.52 include:spf.brevo.com ~all
```

Rules that matter:

- **One SPF record per domain.** Two `v=spf1` records is treated as *none*, which
  is worse than not setting it up at all. If Brevo's instructions say "add a TXT
  record" for SPF and one already exists, they mean merge, not append.
- **`include:` must come before `~all`.** Anything after `all` is ignored.
- `_dmarc` is already `v=DMARC1; p=none;` — leave it there until mail is flowing,
  then consider tightening to `p=quarantine`.

(Optional later cleanup: `+a` authorizes Vercel's shared IP to send as this
domain, and `+mx` authorizes a mail host that doesn't exist. Neither sends mail.
Trimming them tightens the record, but do it only after Brevo is verified and
working — one change at a time.)

## The credentials

| Variable | Value |
| --- | --- |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | the login on Brevo's SMTP tab (an account email, or `…@smtp-brevo.com`) |
| `SMTP_PASS` | the **SMTP key** — *not* the Brevo account password |
| `SMTP_FROM` | `EngProgress <no-reply@engprogress.com>` |

The most common failure is using the account password instead of the SMTP key;
it fails with `535 authentication failed`.

These go in three places: `.env.local` (dev), Vercel project env vars (prod),
and Supabase → Auth → SMTP (host/port/user/pass plus sender name+address).

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
