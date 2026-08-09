# Telegram channels for centers — options

Exploration, not a build. The goal: each group has a Telegram channel, and when
a teacher attaches practice the channel gets a post. Teachers and super_admin
manage the connections.

Nothing below is implemented yet.

---

## 1. How the post gets sent — four options

### A. One platform bot ⭐ recommended to start

Create a single bot via BotFather (`@EngProgressBot`). A center adds it as an
**administrator** to their group's channel/supergroup, and the app posts with
`POST https://api.telegram.org/bot<TOKEN>/sendMessage`.

- **Sender identity:** the platform bot. Posts read as *EngProgress*.
- **Credentials:** one `TELEGRAM_BOT_TOKEN` env var. No per-center secrets.
- **Cost of setup for the center:** add a bot to a channel, run one command.
- **Downside:** the branding is ours, not theirs. And one bot is one blast
  radius — if it gets restricted for spam, every center goes quiet at once.

### B. Per-center bot (white-label)

Each center makes their own bot and pastes the token into Settings & roles.
Posts read as *Laqod Market*, not *EngProgress*.

- **Better:** branding, isolation, and each center owns its own rate limit.
- **Worse:** a token per tenant is a secret per tenant. It must be encrypted at
  rest (`pgsodium`/Vault, not a plain column), never returned to the browser,
  and rotated when staff leave. Setup asks a non-technical admin to talk to
  BotFather.

**Suggested path: build A, leave a nullable `telegram_bot_token` on
`organizations` so B is a later upgrade for centers that ask.** The send path is
identical — only which token it reads changes.

### C. Post as a real user account (MTProto / Telethon)

Posts appear from a person, not a bot. Needs a phone-number login and a stored
session string.

**Don't.** It's outside the Bot API's intent, sessions get invalidated,
and accounts used this way get banned — taking the center's own Telegram account
with them. The only thing it buys is cosmetic.

### D. Telegram Login Widget

Solves a different problem — identifying a *student* by their Telegram account,
e.g. to DM them individually. Worth keeping in mind for "message a student", but
it does not post to channels and is not this feature.

---

## 2. Getting the chat id — the part that's fiddly

You cannot look a channel up by name. The bot has to learn its `chat_id` from an
update, so linking needs a handshake. Two workable shapes:

### Code-in-channel (recommended)

1. Teacher opens the group → **Connect Telegram** → app shows `/link 7QK4-2M9F`
   and stores it against the group with a 15-minute expiry.
2. They add the bot to the channel as an admin and post that command.
3. The bot's webhook receives the message, matches the code, stores
   `chat_id` + `chat_title`, marks it verified, and replies "Connected to
   *IELTS Evening — Sept A*".

Robust, self-service, and the code **proves the person linking the channel is
the same person who has access to it** — without it, anyone who knew a chat id
could point their group at someone else's channel.

### `my_chat_member` auto-detect

The bot gets an update the moment it's added to a chat. Simpler, but it can't
tell *which group in which center* the channel belongs to — you'd still need the
admin to pick from a list afterwards, and you'd have unclaimed chat ids sitting
around. Fine as a convenience on top of the code flow, not instead of it.

**Either way the app needs a webhook**: `POST /api/telegram/webhook`, registered
once with `setWebhook`, verified with the `X-Telegram-Bot-Api-Secret-Token`
header (set via `secret_token` on `setWebhook`) so nobody can forge updates.

---

## 3. Schema sketch

```sql
create table telegram_links (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  -- null = a center-wide channel (announcements); set = that group's channel
  group_id        uuid,
  chat_id         bigint not null,
  chat_title      text,
  -- the handshake
  link_code       text,
  code_expires_at timestamptz,
  verified_at     timestamptz,
  linked_by       uuid,
  created_at      timestamptz not null default now(),
  unique (organization_id, chat_id),
  foreign key (group_id, organization_id) references groups (id, organization_id) on delete cascade,
  foreign key (linked_by, organization_id) references profiles (id, organization_id) on delete set null
);
```

RLS mirrors the existing rule: `can_manage_group(group_id)` to write, so a
teacher connects channels for their own classes and a center_admin for any of
them. `chat_id` is not secret, but the table should stay staff-only.

`unique (organization_id, chat_id)` stops the same channel being wired to two
groups in one center. It deliberately does **not** stop two different centers
claiming the same chat id — that can't happen in practice, and a global unique
would leak the existence of another tenant's channel through a constraint error.

---

## 4. Where the send hooks in

`notifyAssignment()` in `lib/notifications/send.ts` already fans an assignment
out to every group member in-app. Telegram is a second channel on the same
event, not a new event:

```
assignPractice
  └── notifyAssignment            (exists — in-app bell)
        └── notifyTelegram        (new — one post per linked group)
```

Rules to carry over from `notify()`:

- **Best-effort, always.** A failed post must never fail the assignment. Log and
  swallow, exactly as `notify` does today.
- **Service-role only.** No client ever holds the bot token.
- **Rate limits:** Telegram allows ~30 messages/second overall and about
  20/minute to one group. Setting practice for 10 classes is 10 posts — fine.
  A "remind all unpaid" style blast would need a queue; assignments don't.

### What the post should say

```
📝 New writing practice
Task 2 — Opinion essay: remote work
Due Tue 12 Aug
Open: https://engprogress.com/assignments
```

**No student names, no bands, no scores.** A channel is visible to everyone in
it, including parents in many centers. The post announces that work exists; the
work itself stays behind a login. Getting this wrong is a privacy incident, not
a bug.

---

## 5. Who connects what

| Role | Can connect |
| --- | --- |
| Teacher | A channel for a group they own |
| center_admin | Any group in their center, plus a center-wide announcements channel |
| super_admin | The platform bot itself (token, webhook, health) — in `/admin`, not per center |

That matches how `can_manage_group` already splits teacher vs admin, so it needs
no new permission concept.

---

## 6. Open questions for the owner

1. **Whose name is on the post** — platform bot (A) or the center's own bot (B)?
   A is one env var; B is a secret per tenant and a real key-management job.
2. **Channel or group?** A *channel* is broadcast — students can't reply, which
   keeps it clean. A *supergroup* lets them discuss, which centers often want.
   The bot works with both; the copy should differ.
3. **Announcements too?** `/console/announcements` already fans out in-app. If
   center-wide posts should also hit Telegram, the same link table covers it
   with `group_id = null`.
4. **Do students get DMs?** Only possible if each student starts a chat with the
   bot (Telegram forbids a bot messaging first). That's option D plus a
   per-student `telegram_chat_id`, and a separate piece of work.
