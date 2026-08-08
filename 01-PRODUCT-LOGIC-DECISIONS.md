# Prompt 1 applied — Organization Mode: domain decisions, state machines, queries

Output of `01-PRODUCT-LOGIC-PROMPT.md` run against the repo as it stands on branch
`feature/organizations` (2026-08-08). Decisions and queries only — no code.
Where the shipped build contradicts the spec, the contradiction is named and a
resolution proposed (§7).

---

## 1. What already exists (ground truth, verified in the repo)

| Spec entity | Reality | State |
|---|---|---|
| `organizations` | `organizations` — `kind (personal\|center)`, `status (pending\|active\|rejected\|suspended)`, `plan`, `contact_email`, `approved_at`, `billing_enforced`, per-org limit overrides. `status`/`plan` not client-writable (column grants). | ✅ built |
| `memberships` | `profiles` — PK **is** the auth user id, so one auth user = one org = one role. Fields: `organization_id`, `role`, `full_name`, `phone`, `username` (**globally** unique), `avatar_path`. | ⚠️ different shape |
| `groups` | `groups` (org, name, `teacher_id`, `created_by`) + composite FK `(id, organization_id)` for tenant-proof children. No `archived_at`. | ✅ built |
| `group_members` | `group_members` (group, student, org, `added_by`, `joined_at`) | ✅ built |
| `invites` | `invites` (org, email, role, token, `group_id`, `accepted_at`, `expires_at` = +7d). No `status` column (derived), **no resend/revoke**. | ⚠️ partial |
| `practices` | No such table. Content lives in native tables: `writing_prompts` (with `status pending\|approved\|rejected`, `source ai\|manual`), `reading_tests` (cloned per-org from a shared library), listening/speaking libraries. | ⚠️ different shape |
| `assignments` | `assignments` (org, **group_id only**, `kind writing\|reading`, title, instructions, `prompt_id` XOR `reading_test_id`, `due_at`). No `published_at`, no settings, no per-student target. | ⚠️ partial |
| `attempts` | Per-skill, no unified table: `essays`, `reading_attempts`, `listening_attempts`, `speaking_sessions`, `cefr_attempts`. Assignments deliberately carry **no id** on them — reports join *group member × content id*. | ⚠️ different shape |
| `gradings` | `gradings` (writing only — `essay_id`, `criteria` JSONB, `overall_band`, `graded_by`). Reading/listening score inside the attempt row; speaking inside `speaking_sessions`. | ⚠️ writing only |
| `notifications` | **Nothing.** No table, no bell, no fan-out. | ❌ missing |
| `telegram_links` | **Nothing.** | ❌ missing |
| `usage_counters` | No table. Quota is *computed by counting rows* (`gradings`, `ai_usage`) in `lib/quota.ts`. | ⚠️ different shape |
| async grading | `grading_jobs` (queued/processing/done/failed, `attempts`/`max_attempts` 5, `run_after` backoff) drained by `POST /api/jobs/grade-queue` behind `CRON_SECRET`. It is a **fallback**, not the primary path: `/api/essays/[id]/grade` grades synchronously and only enqueues on model failure. | ⚠️ partial |

Surfaces built: `/console` (dashboard, teachers, groups + group detail, students,
per-student report, per-assignment report, billing, review, cohort), `/admin`
(centers, approve/reject, users, platform stats), `/assignments` (student).
No `/teach`, no `/learn`, no notification centre, no practice library page.

---

## 2. Decisions (D1–D14)

**D1 — `profiles` stays; there is no `memberships` table.**
One auth user = one profile = one org = one role. Every RLS policy in ~40
migrations resolves tenancy through `current_org_id()`/`current_app_role()`,
which read that single row. Introducing `memberships` rewrites all of them and
every runner. *Consequence, accepted:* a person who teaches at two centers needs
two accounts. Spec §2's `memberships` is a naming difference, not a redesign.

**D2 — logins stay globally unique, not per-center.**
The sign-in box has no center context (one field takes login-or-email), so a
per-center login cannot be resolved. Collisions are handled in the UI
("`aziza` is taken, try `aziza2`"). Spec §1's per-center uniqueness is rejected.

**D3 — "one email, two identities" is already solved and stays as-is.**
A center applying with an address that already has a learner account gets a
synthetic auth address (`<login>@centers.engprogress.com`); `contact_email` holds
the real address and is where mail goes. Same mechanism as e-mail-less students
(`@students.engprogress.com`). The two accounts never merge — spec §1 satisfied.

**D4 — org status value is `active`, not `approved`.**
Spec §2 says `pending|approved|suspended|rejected`; the enum ships `active`.
Keep `active` (it also covers personal orgs, which are never "approved"). All
spec text should read `active`.

**D5 — no generic `practices` table with `content JSONB`.**
Content stays in its native tables. A generic practice row would fork four
runners and four graders, all of which key off native content ids
(`/write/{prompt_id}`, `/read/test/{test_id}`, …). "The practice library" is a
**view over native content**, not a new store. This preserves the deliberate
"assignments carry no id on attempts" design.

**D6 — the draft→published lifecycle already exists for writing; reuse it.**
`writing_prompts.status` is `pending → approved | rejected` with RLS hiding
non-approved prompts from students. Map spec's `draft` → `pending`,
`published` → `approved`. `archived` is the one genuinely missing value; add it
as a new enum value rather than a new table. Reading tests are org-local clones
of library rows — an org clone is by definition published.

**D7 — version-safe editing is achieved by immutability, not versioning.**
Generated prompts and cloned reading tests are never edited after assignment; to
change a practice you assign a new one. This satisfies spec §3.4's
"existing attempts keep the version they answered" with zero schema. *Rule to
enforce:* block `UPDATE` on `writing_prompts.prompt_text` / `reading_tests` once
an assignment references the row (trigger, or simply no edit UI).

**D8 — assignments stay group-targeted; per-student targeting is deferred.**
Group is the unit a teacher thinks in, RLS keys on `is_group_member(group_id)`,
and per-student targeting would need a second policy path for one rare case.
If it comes back: add `assignment_targets(assignment_id, student_id)` rather
than a nullable second FK.

**D9 — "attempts allowed" is not implemented for writing, and that is correct.**
The revision loop (resubmit + re-grade the same essay) is the product's moat;
capping attempts fights it. For reading, one attempt per (student, test) is the
intended rule and should be enforced in the runner, not as an assignment setting.
Spec §2's `settings.attempts_allowed` is dropped for writing, kept as a reading-
only rule.

**D10 — `usage_counters` is a **view**, not a counters table.**
Source of truth is already the row set (`gradings` where `graded_by is null`,
`ai_usage` where `task='practice'`), which is drift-proof and needs no backfill
or reconciliation cron. Expose `v_org_usage_month` (§6.7) so the Billing page,
the sidebar widget and `lib/quota.ts` cannot disagree. Spec §2's counter table is
rejected; its *requirement* ("never hardcode; Billing reads from here") is met.

**D11 — `awaiting_quota` is specified but stays unreachable for centers today.**
`organizations.billing_enforced = false` for centers, so `effectiveLimit()`
returns unlimited and no attempt can ever be queued for quota. Build the state
and the notification, keep the switch off; flipping the column turns the whole
machine on at once (single choke point in `lib/quota.ts`).

**D12 — grading stays synchronous-first with a queue fallback.**
A student watching a spinner for 20 s beats a student polling for a result.
What is missing is not async-by-default but a **surfaced failure state**:
exhausted jobs park the essay back at `submitted` with no one told. Add
`failed_grading` as a *derived* status (essay `submitted` + a `grading_jobs` row
at `failed`) plus a teacher-visible re-run action. No enum change needed.

**D13 — "practice" means graded work.**
Every stat that counts practice counts **graded** attempts only. Drafts,
abandoned attempts and in-progress essays never count. (Today they do — §7.2.)

**D14 — teacher visibility is group-scoped for every skill.**
`can_view_student()` already expresses the rule (center_admin → org; teacher →
students in groups they own) and governs listening/speaking. The older
`essays`/`reading_attempts` staff policies are still org-wide, which contradicts
the permission matrix — see §7.1.

---

## 3. State machines

### 3.1 Organization
```
(application submitted) ──► pending
pending ──approve──► active        (approved_at set, confirmation email w/ login)
pending ──reject───► rejected      (terminal for that application; re-apply = new org)
active  ──suspend──► suspended     (non-payment / abuse) ──reactivate──► active
```
Guards: `requireOrgUser()` sends anything not `active` to `/awaiting-approval`.
Writes only via service_role (column grants). `personal` orgs are created `active`
and never leave it.
Missing: suspend/reactivate actions in `/admin` (§7.6).

### 3.2 Invite
```
created ──► pending ──accept──► accepted        (profile provisioned in org+role,
   │                                             joined to group_id if present)
   ├──(now > expires_at)──► expired             (derived, not stored)
   ├──revoke──► revoked                          [NOT BUILT]
   └──resend──► pending (new token, +7d)         [NOT BUILT]
```
Rule: `status` stays **derived**, never a column — `accepted_at is null and
expires_at > now()` is the only definition of pending, and every surface must use
it (today two surfaces disagree — §7.3). Revoke = delete the row. Resend =
new token + `expires_at = now() + 7d`, same row (the `(org, email)` unique
constraint makes upsert the natural implementation, already used for create).

### 3.3 Practice (per D5/D6)
```
writing:  generate ──► pending ──approve──► approved ──assign──► (immutable)
                            └──reject──► rejected
                                              approved ──archive──► archived  [enum value to add]
reading:  library template ──clone into org──► org test (published by definition)
```
The current `createAssignment` collapses generate→approve→assign into one atomic
action, i.e. there is no preview. Resolution in §7.5.

### 3.4 Assignment + attempt (the loop, as actually wired)
```
staff creates assignment (group, content id, due_at)
  └─► visible to group members immediately (assignments_member_select)
        └─► student opens deep link → runner creates attempt on the CONTENT id
              └─► submit → grade
                    ├─ writing:  essay submitted → grading → graded
                    │              └─ model failure → queued → (retry ×5) → submitted + job failed
                    ├─ reading:  attempt in_progress → graded (auto-scored)
                    │
                    └─► report joins group member × content id
```
There is no `assignment_id` anywhere on the attempt, by design. Consequence to
state plainly: **a student who practises the same prompt/test outside the
assignment satisfies the assignment**, and a second assignment of the same
content to the same group is indistinguishable. Both are acceptable; the second
is worth blocking in the UI ("this group already has this test").

### 3.5 Grading job
```
queued ──claim──► processing ──ok──► done (row dropped)
                     └─fail──► attempts+1
                                 ├─ < max: queued, run_after = now + backoff(jitter)
                                 └─ = max: failed  → essay parked at 'submitted'
                                                     → derived status failed_grading
                                                     → teacher notified + re-run action  [NOT BUILT]
```

### 3.6 Quota (built, dormant for centers — D11)
```
submit → effectiveLimit(org)
   ├─ billing_enforced = false → unlimited → grade
   ├─ used < limit → grade (429 + Retry-After when exceeded, today)
   └─ used ≥ limit → [SPEC] attempt parked awaiting_quota
                      + notify center_admin (upgrade CTA) and teacher
                      + resume on plan upgrade or month rollover (cron)
```
Today an over-quota grade returns HTTP 429 and the essay is simply not graded —
that violates "never silently drop attempts". Fix: on 429, enqueue a
`grading_jobs` row with `run_after = quota.resetAt` instead of failing.

### 3.7 Notification (to build)
```
event ──► notifications row (recipient, org, type, payload)
            ├─► in-app: unread badge (poll or Realtime)
            └─► telegram: if telegram_links.active → send; on 403 blocked →
                          mark link inactive, in-app only
```
Events: `assignment_published`, `due_soon_24h`, `attempt_graded`,
`grading_failed` (staff), `quota_80`, `quota_100` (admin), `weekly_digest`
(teacher), `monthly_usage` (admin), `center_approved`.

---

## 4. Permission matrix vs. actual RLS

| Action | Spec | Enforced today |
|---|---|---|
| Approve centers | super_admin | ✅ `requireSuperAdmin` + service_role; org columns not client-writable |
| Suspend / reactivate | super_admin | ❌ no action exists (status enum has it) |
| Impersonate a center | super_admin | ❌ not built |
| Manage teachers / billing | center_admin | ✅ |
| Create groups | admin + teacher (own) | ✅ `groups_teacher_insert` requires `teacher_id = auth.uid()` |
| Add students | admin + teacher (own groups) | ✅ `can_manage_group` + explicit check in the service-role action |
| Create / publish practice | admin + teacher | ✅ (collapsed into assign — §7.5) |
| Attach practice to group | admin + teacher (own) | ✅ `assignments_staff_manage` |
| See student results | teacher: own groups only | ⚠️ **true for listening/speaking, false for essays/reading** (§7.1) |
| See classmate list | student: no | ✅ `group_members_self_select` returns own row only |
| Link Telegram | all | ❌ not built |

---

## 5. Gap checklist verdict (spec §5)

| # | Item | Verdict |
|---|---|---|
| 1 | Pending invites: create, email, accept, expiry, counter | ⚠️ create/email/accept/expiry ✅; **no revoke, no resend**; counter wrong (§7.3) |
| 2 | Teacher self-service groups + students | ✅ done (migration `20260807160000`) |
| 3 | Practice → assignment → notification fan-out | ⚠️ practice→assignment ✅; **fan-out missing entirely** |
| 4 | Async grading with retry + `failed_grading` recovery | ⚠️ queue + retry ✅; **no surfaced failure, no re-run** |
| 5 | Quota wired to billing plans | ✅ wired, deliberately off for centers (D11); over-quota drops the attempt (§3.6) |
| 6 | "In no group" / "Never practised" as real queries | ⚠️ computed in TypeScript, and "practised" counts ungraded rows (§7.2) |
| 7 | Version-safe practice editing | ✅ by immutability (D7) — needs the edit-block trigger |
| 8 | Telegram link/unlink + templates | ❌ nothing |
| 9 | Role-based routing after sign-in | ✅ `roleHome()` + middleware + server guards; **but spec 03 wants `/teach` and `/learn`** (§7.7) |
| 10 | Super admin console | ⚠️ approve/reject/list/stats ✅; **suspend, reactivate, impersonate missing** |

---

## 6. Query definitions — every number on screen

Build these as views **`with (security_invoker = true)`** so RLS on the base
tables still applies and a teacher's read is automatically narrowed.

**6.1 `v_practice_activity`** — the single definition of "a practice" (D13).
```sql
create view public.v_practice_activity with (security_invoker = true) as
  select student_id, organization_id, 'writing'::text  as skill, created_at as at
    from public.essays where status = 'graded'
  union all
  select student_id, organization_id, 'reading',  coalesce(submitted_at, created_at)
    from public.reading_attempts where status = 'graded'
  union all
  select student_id, organization_id, 'listening', created_at
    from public.listening_attempts where status = 'graded'
  union all
  select student_id, organization_id, 'speaking', started_at
    from public.speaking_sessions where state = 'graded';
```

**6.2 `v_center_student_stats`** — one row per student; backs the roster and all
four cards on `/console/students`.
```sql
create view public.v_center_student_stats with (security_invoker = true) as
select p.id                as student_id,
       p.organization_id,
       p.full_name, p.username, p.avatar_path,
       count(a.*)          as practice_count,
       max(a.at)           as last_active,
       count(distinct gm.group_id) as group_count
  from public.profiles p
  left join public.v_practice_activity a on a.student_id = p.id
  left join public.group_members gm      on gm.student_id = p.id
 where p.role = 'student'
 group by p.id;
```
- **Students** = `count(*)`
- **Have practised** = `count(*) filter (where practice_count > 0)`
- **Never practised** = `count(*) filter (where practice_count = 0)`
- **In no group** = `count(*) filter (where group_count = 0)` *(center_admin only —
  a teacher cannot have ungrouped students by definition)*
- Clicking a card filters the roster by the same predicate (`?filter=never|nogroup`).

**6.3 Teacher-scoped roster.** Same view, plus:
```sql
where student_id in (select gm.student_id from public.group_members gm
                       join public.groups g on g.id = gm.group_id
                      where g.teacher_id = auth.uid())
```
This is the **only** correct student population for a teacher — the console
dashboard must use it too (§7.4).

**6.4 Pending invites** — one definition, everywhere:
```sql
select count(*) from public.invites
 where organization_id = :org and accepted_at is null and expires_at > now();
```

**6.5 `v_group_completion`** — per assignment.
```sql
create view public.v_group_completion with (security_invoker = true) as
select asg.id as assignment_id, asg.group_id, asg.organization_id,
       count(distinct gm.student_id) as members,
       count(distinct done.student_id) as completed,
       round(avg(done.band)::numeric, 1) as avg_band
  from public.assignments asg
  join public.group_members gm on gm.group_id = asg.group_id
  left join lateral (
      select e.student_id, g.overall_band as band
        from public.essays e
        join public.gradings g on g.essay_id = e.id
       where asg.kind = 'writing' and e.prompt_id = asg.prompt_id
         and e.student_id = gm.student_id and e.status = 'graded'
      union all
      select ra.student_id, ra.band
        from public.reading_attempts ra
       where asg.kind = 'reading' and ra.test_id = asg.reading_test_id
         and ra.student_id = gm.student_id and ra.status = 'graded'
  ) done on true
 group by asg.id;
```
Completion % = `completed / nullif(members,0)`. "At risk" = member with
`last_active < now() - interval '7 days'` or a band lower than their previous.

**6.6 Teacher activity (center admin report)**
```sql
select g.teacher_id,
       count(distinct g.id)                             as groups,
       count(distinct gm.student_id)                    as students,
       count(distinct asg.id) filter (where asg.created_at > now() - interval '30 days')
                                                        as assignments_30d,
       max(asg.created_at)                              as last_assignment_at
  from public.groups g
  left join public.group_members gm on gm.group_id = g.id
  left join public.assignments asg  on asg.group_id = g.id
 group by g.teacher_id;
```

**6.7 `v_org_usage_month`** (D10) — the one source for Billing + the sidebar.
```sql
create view public.v_org_usage_month with (security_invoker = true) as
select o.id as organization_id,
       date_trunc('month', now() at time zone 'utc') as period,
       (select count(*) from public.gradings gr
         where gr.organization_id = o.id and gr.graded_by is null
           and gr.created_at >= date_trunc('month', now() at time zone 'utc')) as gradings_used,
       (select count(*) from public.ai_usage au
         where au.organization_id = o.id and au.task = 'practice' and au.ok
           and au.created_at >= date_trunc('month', now() at time zone 'utc')) as generations_used,
       o.billing_enforced, o.plan
  from public.organizations o;
```
`lib/quota.ts` must read this view rather than re-implementing the counts, so the
number a user sees and the number that blocks them are the same number.

---

## 7. Contradictions between the spec and the shipped build

**7.1 Teacher visibility is org-wide for writing and reading.** *(highest risk)*
The matrix says a teacher sees only their own groups' results, and
`can_view_student()` enforces exactly that for listening and speaking. But the
older `essays` / `reading_attempts` staff policies still return the whole org, so
teacher A can read teacher B's students' essays via PostgREST.
**Resolution:** re-issue both staff-select policies on `can_view_student(student_id)`.
Blast radius to check first: `/console/review`, `/console/cohort`,
`/console/grading/[id]`, `lib/console/load.ts` — all written assuming org-wide
reads for staff. A center_admin keeps org-wide access through the function's
first branch, so only teacher-facing pages change.

**7.2 "Have practised" counts work that was never graded.**
`lib/console/people.ts` counts every `essays`, `reading_attempts`,
`listening_attempts` and `speaking_sessions` row regardless of status — an
abandoned draft counts as practice. This is the concrete cause of "statistics
seem inaccurate". **Resolution:** D13 + view 6.2.

**7.3 "Pending invites" counts expired invites.**
`app/(app)/console/page.tsx:41` filters on `accepted_at is null` only, while
`lib/console/groups.ts:110` also requires `expires_at > now()`. Two screens, two
numbers. **Resolution:** query 6.4 everywhere; invites list gets Resend/Revoke.

**7.4 The console dashboard's "Students" is org-wide even for a teacher.**
`app/(app)/console/page.tsx:38` reads all org profiles for both roles, so a
teacher's dashboard shows the center's total while their Students page shows only
their groups'. **Resolution:** query 6.3 for teachers.

**7.5 There is no practice preview — generate and assign are one atomic action.**
Spec §3.4 wants draft → preview → publish → attach. `createAssignment` generates
a prompt, auto-approves it and inserts the assignment in one submit, so a teacher
cannot see the prompt before the class does, and a bad generation is already
homework. **Resolution:** split into `generatePracticeDraft` (leaves the prompt
`pending`, visible to staff only — RLS already does this) and `assignPractice`
(approve + insert). The teacher's library is then `writing_prompts` where
`status = 'pending'` (Drafts) / `'approved'` (Published), no new table (D5/D6).

**7.6 Suspension exists in the enum and nowhere else.**
`org_status` has `suspended` and `requireOrgUser` honours it, but `/admin` can
only approve or reject. **Resolution:** add suspend/reactivate to
`reviewOrganization` (same service-role action, two more decisions), plus a
reason field — spec §3.1 asks for rejection reasons and there is no column for
one (`organizations.review_note text`).

**7.7 Spec 03's routes contradict the shipped routing.**
Spec 03 Phase 1 wants `center_admin → /console`, `teacher → /teach`,
`student → /learn`. Shipped: admin **and** teacher share `/console` (role-branched),
students use `/dashboard` + `/assignments`, and all four skill runners live at
`/write`, `/read`, `/listen`, `/speak`. **Resolution: keep the shipped routes.**
A `/teach` split duplicates six pages that already role-branch cleanly, and
`/learn` would fork the student surface away from the B2C learner — which the
product explicitly does not want ("a center student is an ordinary learner").
Spec 02's teacher/student page *inventories* are still valid; they land inside
`/console` and `/dashboard` respectively.

**7.8 Spec 01 omits Listening and Speaking.**
`practices.module` is `writing | reading | listening`, and `assignment_kind` ships
as `writing | reading`. Both are behind the product: all four skills are live, and
teachers can already *see* listening/speaking practice they cannot *assign*.
**Resolution:** treat listening + speaking assignments as a named phase (enum
values + a content picker each), not an omission. Speaking assignments should
wait for the grading unfreeze — homework graded by a frozen, upward-biased grader
is worse than no homework.

**7.9 Over-quota drops the attempt.**
`/api/essays/[id]/grade` returns 429 and leaves the essay ungraded — spec §3.5
says never silently drop. **Resolution:** enqueue with `run_after = resetAt`
(§3.6). Dormant for centers today (D11), live for personal orgs now.

**7.10 Individual-learner isolation is a rule, not a table.**
Spec §1 says the personal and org identities never merge; nothing in the schema
prevents a future "join a center" action from moving `profiles.organization_id`.
**Resolution:** state the rule as a constraint — a profile's `organization_id`
never changes after creation; joining a center means a new account. Worth a
trigger, since the damage (a learner's private practice becoming visible to a
center) is silent and irreversible.

---

## 8. Open questions for the owner (they change what gets built)

1. **§7.1 tightening** — narrow teacher reads on essays/reading now (correct, but
   touches the review queue and cohort dashboard), or leave org-wide until the
   teacher surface is finished?
2. **Notifications channel order** — in-app first (needed by everything), or
   Telegram first (higher perceived value for Uzbek centers, but useless without
   the events table underneath)? Recommendation: in-app first, same events table.
3. **Bulk student add** (spec §3.3, paste names → generated logins → credentials
   CSV) is the single biggest time-saver for a center and is not built. Confirm
   it belongs in the next slice.
4. **Listening/speaking assignments** — build listening now and hold speaking
   until expert labels exist (§7.8)?
