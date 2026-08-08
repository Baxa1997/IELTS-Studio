# Prompt 2 applied — Organization Mode: page-by-page UI spec

Output of `02-UI-SPEC-PROMPT.md` run against the repo on `feature/organizations`
(2026-08-08), and continuous with `01-PRODUCT-LOGIC-DECISIONS.md` — where the two
specs disagree with the shipped product, 01's decisions win and are restated here.

The spec's instruction is right: **keep the existing system, extend it**. The
inventory below is what the system actually is, which differs from the spec's
description in several details (§1.1). Every page section names the components
that already exist, so "build this" never means "invent a look".

---

## 1. The design system as built

**Tokens** — `components/console/page-ui.tsx`, mirrored inline in the learner pages:

| Token | Value | Use |
|---|---|---|
| `SANS` | Hanken Grotesk | all body, labels, numbers |
| `SERIF` | **Newsreader** | page titles, panel headings |
| `INDIGO` | `#3B43B5` | primary action, links, stat numbers |
| `INK` | `#1A2138` | body text |
| `MUTED` / `FAINT` | `#5A6076` / `#8A8FA0` | secondary / tertiary text |
| `LINE` | `#ECEAF2` | hairline borders, row dividers |
| `TINT` | `#F4F4FE` | indigo-tinted surfaces |
| Canvas | `#F1F1F6` | page background |
| Rail | `linear-gradient(180deg,#1E2242,#181B36,#12142A)` | sidebar |
| Rail accent | `#5BDD9B` mint | role chip, on-rail highlights |
| Card | `#fff`, 16px radius, 1px `LINE` | every panel |

**Primitives already available** (use these, don't restyle):
`PageHead` (with `back`), `Panel`, `StatRow` + `StatTile`, `List`/`Row`/`RowText`/`EmptyRow`,
`Pill` (neutral/good/warn/bad/indigo), `RowLink`, `PrimaryLink`, `StudentPhoto`,
`components/admin/table.tsx` (`ScrollTable`, `THead`, `TH`, `TR`, `TD`, `FilterBar`,
`SearchField`, `SelectField`, `EmptyTableRow`), `components/admin/charts.tsx`
(`TrendChart`, `BarList`, `DeltaStat`), `components/app-shell/page-skeleton.tsx`
(`PageSkeleton`, `ListSkeleton`, `CardsSkeleton`), `quota-bar.tsx`, `plan-card.tsx`.

**The UI kit is deliberately small**: `components/ui` has only Button, Card, Input,
Label. There is **no toast, no modal, no drawer, no tabs** primitive. See §5.

### 1.1 Where the spec's description of the design system is wrong

| Spec 02 says | Reality | Resolution |
|---|---|---|
| Sidebar navy `#151b2e` | indigo gradient rail `#1E2242 → #12142A` | keep the rail |
| "Playfair-style" serif | Newsreader | keep Newsreader |
| Green = create/confirm | **indigo** is the only primary; mint `#5BDD9B` is a rail accent, never a button | keep indigo; do not introduce a green button |
| Role badge pill next to logo | exists as `roleLabel` on the rail | add the four variants (§2.1) |
| Collapse toggle, account card pinned bottom | both exist (`shell.tsx`, `ProfileMenu`) | nothing to do |

---

## 2. Rules to enforce on every page

1. **Every number is a view.** `v_center_student_stats`, `v_pending_invites`,
   `v_practice_activity`, `v_org_usage_month` (01 §6). No page re-derives a stat.
2. **Every stat card is a filter.** A `StatTile` that can filter the list below it
   must be a link to the same page with a query param, and the active one gets an
   indigo ring. This is the single biggest fix for "the stats feel fake" — the
   teacher can check the number by clicking it. *(Not built anywhere yet.)*
3. **Every table gets** search + filters + an explicit empty state naming the next
   action. `FilterBar` + `EmptyTableRow` already do this on `/console/students`;
   copy that page.
4. **Every async action** shows a pending label on its own button ("Creating…"),
   an inline error under the form, and an inline success block. **No toasts** —
   there is no toast system and adding one is not worth it for a console this
   size (§5).
5. **Loading** = a skeleton matching the card layout, from `page-skeleton.tsx`, in
   a `loading.tsx` beside the page.
6. **Down to 360px.** The rail already collapses. Tables scroll inside
   `ScrollTable`; the page body must never scroll sideways.
7. **Copy rules**: sentence case, no exclamation marks, name the next action in
   empty states, never round a band up in prose, and say what a number means
   rather than labelling it (the honest-microcopy voice the product already has).
8. **i18n-ready**: no text baked into images; keep strings inline for now — a
   dictionary refactor is a separate task, and premature extraction across ~30
   pages will cost more than it saves today.

### 2.1 Role chip variants

`roleLabel` on the rail becomes a coloured chip: **Center admin** mint `#5BDD9B`
(current), **Teacher** amber `#B9791A`, **Student** indigo `#3B43B5`, **Super
admin** red `#F0857A` (already the sign-out colour on the rail). One line in
`shell.tsx`; it is the cheapest way for a user to know which account they are in
when a center owner also has a personal learner account.

---

## 3. Pages by role

Routes follow 01 §7.7: **no `/teach`, no `/learn`.** Staff share `/console`
role-branched; center students are ordinary learners on `/dashboard`.

### A. Center admin — `/console`

**A1. Dashboard `/console`** *(exists — extend)*
Now: four `StatTile`s (Groups, Students, Teachers, Pending invites) + "Where to go" + pending-invite list with Revoke / New link.
Add, in order:
- **Setup checklist** (only while incomplete): Add a teacher → Create a group → Add students → Set the first practice, each a `Row` with a tick or a `PrimaryLink`. Copy: *"Four steps and your center is running."* Disappears for good once all four are done.
- **Usage widget** — `quota-bar.tsx` against `v_org_usage_month`. For an unmetered center (`billing_enforced = false`) show the count with no bar and the line *"Unlimited while your center is in early access."* Never show a fake limit.
- **Recent activity** — last 10 events (teacher added, group created, practice assigned, N attempts graded), each `RowText` with a relative time. Until the notifications table exists (01 §3.7) this is a union query over `created_at` columns; it is a read-only feed, so that is honest.
- Make the four tiles filter: Students → `/console/students`, Pending invites → scroll to the panel.

**A2. Teachers `/console/teachers`** *(exists — extend)*
Add per-row actions: **Reset password** (generates one, shows it once — same block as bulk add), **Disable** (blocks sign-in, keeps history; needs `profiles.disabled_at`), **Reassign groups** (a select per group). Row expands to show their groups, student count, and last assignment date.
Empty state: *"No teachers yet. Add one — they'll create their own classes."*

**A3. Groups `/console/groups`** *(exists)* — no change beyond §2.

**A4. Group detail `/console/groups/[id]`** *(exists — the strongest page in the build)*
Roster with photos, add-student, **add a whole class**, assign practice, assignments with completion, invites, settings. Add only: completion % as a `Pill` per assignment, and a "Move to another group" action per student.

**A5. Students `/console/students`** *(exists — extend)*
Make the four cards filter the roster: `?filter=practised|never|nogroup`. Add a **student drawer** — but there is no drawer primitive, so it is a page: `/console/students/[id]` reusing the existing per-student report, plus reset password and move group.

**A6. Reports `/console/reports`** *(NEW)*
Center-wide, and the thing a center owner pays for:
- Group comparison table (group, teacher, students, completion %, average band, trend arrow).
- Band distribution — `BarList` over half-band buckets.
- Weakest criteria ranking — *"62% of your students are capped by Grammatical Range & Accuracy."*
- Export CSV (client-side Blob, same as the credentials sheet).
Empty state: *"No graded practice yet. Assign something to a group and this fills in."*

**A7. Billing `/console/billing`** *(exists — rewire)*
Point the numbers at `v_org_usage_month`; add invoice history and Payme/Click states. Still plain Tailwind — restyle to `page-ui` in the same pass.

**A8. Settings `/console/settings`** *(NEW — there is no settings route anywhere in the app)*
Center name, contact email, default language (placeholder until i18n), and the account block every role needs: change password, sign out everywhere.

### B. Teacher — the same `/console`, branched

Rail today: Dashboard · Groups · Students. Add **Practices** and **Reports**.

**B1. Dashboard `/console`** — a "Today" panel above the tiles: assignments due in the next 7 days with `completed/total`, and anything needing attention (a failed grading, an assignment nobody has started). Copy: *"Due this week"* / *"Nothing due — set some practice."*

**B2. My groups** — the existing Groups page already filters to their own.

**B3. Practices `/console/practices`** *(NEW — and it needs 01 §7.5 first)*
The library only becomes possible once generate and assign are split. Tabs Drafts / Published / Archived over `writing_prompts.status` (`pending` / `approved` / `archived`) plus the org's reading tests. Row: skill icon, first line of the prompt, target band, "Assigned to: 9A, 9B" chips, `X/Y` completed, average band. Actions: **Preview**, **Assign to group…**, Duplicate, Archive.
Empty state: *"Nothing here yet. Generate a Task 2 prompt or pick a reading test."*

**B4. Practice builder** — "Generate with AI" (category + topic + target band → draft → editable preview → Publish) and "Create manually" (paste your own prompt). **Publish is a separate button from Save draft**, which is exactly the gap 01 §7.5 names.

**B5. Reports `/console/reports`** — same route as A6, scoped by RLS to their groups. Group selector → per-assignment completion → per-student table → drill-down to the existing student report.

**B6. Settings** — as A8.

### C. Student — `/dashboard` and friends *(mostly exists)*

The spec calls this surface "missing"; it is the most finished part of the
product. What exists: `/dashboard` (bands ×4, weakest area, streak, weekly goal,
recommendation, coach), `/plan`, `/activities` (history, reopenable), `/assignments`
(with the unfinished-homework badge on the rail), and the four runners.

Genuinely missing:
- **C1. Notification bell + panel** — depends on the notifications table (01 §3.7). Header bell with unread count, dropdown of the last 10, full page at `/notifications`, mark-read on open, deep link to the item. Copy: *"New homework from Aziza Karimova — Task 2, due Friday."*
- **C2. Assignment context in the runner** — a slim bar above the writing/reading runner when the content id belongs to an assignment: group name, due date, and *"This is homework for 9A."* Cheap, and it is what makes homework feel assigned rather than coincidental.
- **C3. Settings `/settings`** — password, language, and (later) Connect Telegram.

Everything else in spec 02 §C already exists under a different name: "My results" = `/activities`, "Progress" = `/dashboard`.

### D. Super admin — `/admin` *(exists — extend)*

Applications queue, centers list with charts, users, and speaking conduct flags are built. Add:
- **Reject with a reason** — needs `organizations.review_note` (01 §7.6); the reason goes in the rejection email.
- **Suspend / reactivate** — the enum has `suspended` and `requireOrgUser` honours it; only the action is missing.
- **Impersonate a center** — a signed, time-boxed, read-only session with a permanent banner: *"Viewing Center X as support. Read-only."* Log every use. Do not build it before the banner and the log exist.

---

## 4. States, page by page

| State | Pattern | Built? |
|---|---|---|
| Empty | `EmptyRow` / `EmptyTableRow` naming the next action as a link | ✅ on most console pages |
| Loading | `loading.tsx` + the matching skeleton | ⚠️ skeletons exist; few routes use them |
| Error | inline red line under the form; a page-level `error.tsx` with Retry | ⚠️ inline exists, no `error.tsx` |
| Quota blocked | admin: usage widget turns amber + "Upgrade"; student/teacher: *"Grading is queued — it will finish when your center's next cycle starts."* | ❌ (dormant for centers — 01 D11) |
| Mobile ≤360px | rail collapses, tables scroll in `ScrollTable` | ⚠️ untested on the newest pages |

---

## 5. Decisions on missing primitives

- **No toast library.** Every mutation here is a server action that re-renders the page; an inline success block is more accurate than a toast that outlives the state it describes. Rule 4 stands in for it.
- **No drawer.** The spec asks for student and teacher drawers; a route (`/console/students/[id]`) is linkable, back-button correct, and free. Build pages, not drawers.
- **Tabs** (Drafts/Published/Archived) = query params, not a component: `?tab=drafts` keeps the state shareable.
- **Charts**: `components/admin/charts.tsx` already covers trend/bar/delta. Do not add a charting dependency.

---

## 6. Build order

1. **Stat cards become filters** + `/console/students/[id]` — small, and it fixes the credibility problem the owner reported.
2. **Setup checklist + usage widget** on the admin dashboard — cures the empty-center first impression.
3. **01 §7.5 (draft → preview → assign)**, then **B3 Practices library** — the teacher's missing half, and the library is impossible before the split.
4. **A6/B5 Reports** — the paid-for artefact.
5. **Notifications table → bell → assignment context bar** (C1/C2), then Telegram.
6. **Settings** (A8/C3), **teacher row actions** (A2), **super-admin suspend/reason/impersonate** (D).

Items 1–2 are a day. Item 3 is the one that changes what teachers can do.
