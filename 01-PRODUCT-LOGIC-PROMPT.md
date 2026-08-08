# PROMPT 1 — Product & Domain Logic Specification

> Use this prompt when you want Claude (or Claude Code in plan mode) to reason about, complete, or review the **business logic** of EngProgress Organization Mode. It defines the domain model, roles, permissions, and every core flow. It contains no UI or code instructions — pair it with the UI prompt or the Claude Code prompt.

---

You are the product architect for **EngProgress**, an AI-powered IELTS/CEFR practice platform (Next.js + TypeScript + Supabase + Tailwind; Gemini for content generation, Claude Sonnet for grading). The platform has two modes: **Individual learners** and **Organizations (education centers)**. The organization mode is partially built. Your job is to complete the domain logic so that every role has a coherent, closed loop: content is created → assigned → practiced → graded → reported → acted on.

## 1. Roles and hierarchy

1. **Platform super admin (owner)** — sees all organizations, approves/rejects/suspends center applications, sees platform-wide stats (centers, students, gradings used, revenue by plan), can impersonate a center for support, manages plan quotas.
2. **Center admin** — owns one organization. Manages teachers, groups, students, billing, and sees center-wide reports. Cannot see other organizations.
3. **Teacher** — belongs to one center. Owns groups assigned to them. Creates/generates practices, publishes them, attaches them to groups, and reads per-student and per-group reports. Sees ONLY students in their own groups.
4. **Student (org student)** — belongs to one center and one or more groups. Sees assigned practices, completes them, receives graded feedback, sees own progress. Never sees other students' results.
5. **Individual learner** — existing B2C mode. Keep fully separate: an email may have both a personal learner account and an org identity; they never merge (the "stays separate" rule already shown in the registration modal is correct — keep it).

**Identity rule:** org users sign in with a center-scoped `login` (e.g. `dilnoza.t`) OR email. Login uniqueness is scoped per center, not global. Store identities as `auth user → membership(org_id, role, login)`.

## 2. Core entities (canonical data model)

- `organizations` — id, name, slug, status (`pending | approved | suspended | rejected`), plan (`free | standard | pro | enterprise`), contact_email, created_at, approved_at.
- `memberships` — user_id, org_id, role (`center_admin | teacher | student`), login (unique per org), display_name, status (`active | invited | disabled`).
- `groups` — org_id, name, teacher_id (nullable = unassigned), created_at, archived_at.
- `group_members` — group_id, student_membership_id, joined_at.
- `invites` — org_id, email, role, group_id (optional), token, status (`pending | accepted | expired`), expires_at. **This is the missing "Pending invites" logic behind the dashboard card.**
- `practices` (practice sets) — org_id, created_by (teacher), module (`writing | reading | listening`), level/target band, source (`ai_generated | manual`), content JSONB, status (`draft | published | archived`), created_at.
- `assignments` — practice_id, target (`group_id` OR `student_membership_id`), assigned_by, published_at, due_at (optional), settings (attempts allowed, time limit).
- `attempts` — assignment_id, student_membership_id, started_at, submitted_at, answers JSONB, status (`in_progress | submitted | graded | failed_grading`).
- `gradings` — attempt_id, band scores per criterion, overall band, error annotations (using your existing error taxonomy), model + prompt version, tokens/cost, created_at.
- `notifications` — recipient user_id, org_id, type, payload JSONB, created_at, read_at, delivered_channels (`in_app`, `telegram`).
- `telegram_links` — user_id, telegram_chat_id, linked_at, unlinked_at.
- `usage_counters` — org_id, period (month), gradings_used, generations_used. **All quota checks and the Billing page numbers read from here — never hardcode.**

## 3. Flows to define completely (state machines)

### 3.1 Organization lifecycle
`application submitted → pending → (approved | rejected)`; approved → active; active → suspended (non-payment or abuse) → reactivated. On approval: send confirmation email, activate the center-admin membership, start plan trial. Super admin console must list pending applications with approve/reject actions and reasons.

### 3.2 Teacher creation & invites
Two paths, both already hinted in the UI — make them real:
- **Direct create** (admin sets login + password, optionally emails credentials).
- **Email invite** (invite row created → email with token → teacher sets password → membership activates → pending-invites counter decrements). Invites expire in 7 days; resend and revoke actions exist.

### 3.3 Group & student management
- Groups belong to a teacher; reassigning a teacher moves report visibility.
- Students are created *inside a group* (admin or the group's teacher). Bulk add via CSV/paste (name per line → auto-generate logins/passwords → downloadable credentials sheet). This is critical for Uzbek education centers where students often have no email.
- A student can be in multiple groups; deleting from last group ≠ deleting the account (moves to "In no group" — that dashboard card must reflect this query).

### 3.4 Practice lifecycle (the core loop)
```
teacher generates/creates practice (draft)
  → previews & edits
  → publishes
  → attaches to one or more groups (or individual students) with optional due date
  → assignment created per target
  → notification fan-out to every student in target groups (in-app + Telegram if linked)
  → student opens practice → attempt (in_progress)
  → submit → grading job (async) → graded
  → student notified of results (in-app + Telegram)
  → grading aggregates into teacher & admin reports
```
Rules: a published practice attached to a group is visible to students the moment the assignment exists, not before. Editing a published practice creates a new version; existing attempts keep the version they answered. Teachers see all their own practices in a library (drafts, published, archived) with per-practice stats: assigned to N groups, X/Y completed, average band.

### 3.5 Grading & quota
Every submitted attempt consumes one grading from the org's monthly quota. If quota exhausted: attempt is queued with status `awaiting_quota`, teacher and admin get a notification with an upgrade CTA, and grading resumes automatically on plan upgrade or month rollover. Never silently drop attempts.

### 3.6 Notifications (in-app + Telegram)
**Events:** new assignment published, due-date reminder (24h before), attempt graded, teacher weekly digest (group completion %), admin monthly usage summary, quota at 80%/100%.
- **In-app:** notification center with unread badge, computed on login/poll — no email dependency for students (matches your requirement).
- **Telegram:** one bot. Student/teacher opens Settings → "Connect Telegram" → deep link `t.me/EngProgressBot?start=<one-time-token>` → bot resolves token → stores chat_id in `telegram_links`. Fan-out on the same events. Include ready-made Uzbek/Russian/English message templates. If a user blocks the bot, mark link inactive and fall back to in-app only.

### 3.7 Reports (what teachers actually pay for)
- **Per student:** band trajectory over time, per-criterion breakdown (TA/CC/LR/GRA for writing; question-type accuracy for reading/listening), top recurring errors from the taxonomy, last active.
- **Per group:** completion rate per assignment, band distribution, common weaknesses ranked (e.g. "62% of group loses marks on complex sentences"), students at risk (inactive 7+ days or band declining).
- **Per center (admin):** teacher activity, group comparison, usage vs quota.
Every stat card in the current UI (Students / Have practised / Never practised / In no group, etc.) must map to an explicit SQL query — list those queries. "Statistics seem inaccurate" is fixed by making each number a defined query, not a cached guess.

## 4. Permission matrix (enforce in RLS, not just UI)

| Action | Super admin | Center admin | Teacher | Student |
|---|---|---|---|---|
| Approve centers | ✅ | — | — | — |
| Manage teachers/billing | impersonate | ✅ | — | — |
| Create groups | — | ✅ | ✅ (own) | — |
| Add students | — | ✅ | ✅ (own groups) | — |
| Create/publish practices | — | ✅ (optional) | ✅ | — |
| Attach practice to group | — | ✅ | ✅ (own groups) | — |
| See student results | all | center-wide | own groups only | own only |
| Link Telegram | ✅ | ✅ | ✅ | ✅ |

## 5. Gap checklist — verify each exists end-to-end

1. Pending invites: creation, email, acceptance, expiry, counter.
2. Teacher self-service group/student creation (currently admin-only).
3. Practice → assignment → notification fan-out.
4. Async grading pipeline with retry + `failed_grading` recovery.
5. Quota enforcement wired to Billing plans.
6. Student "In no group" and "Never practised" as real queries.
7. Version-safe practice editing.
8. Telegram link/unlink + templates.
9. Role-based routing after sign-in (admin → console, teacher → teacher dashboard, student → student home).
10. Super admin console (center approval queue currently has no defined surface).

**Output format when using this prompt:** produce decisions, state machines, and query definitions — not code. Flag any place where the current screenshots contradict this spec and propose the resolution.
