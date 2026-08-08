# PROMPT 3 — Claude Code Implementation Prompt

> Paste this into Claude Code at the repo root. Put `01-PRODUCT-LOGIC-PROMPT.md` and `02-UI-SPEC-PROMPT.md` in the repo (e.g. `/docs/specs/`) first — this prompt tells Claude Code to read them. Run phases one at a time; don't ask for everything in one shot.

---

You are completing the **Organization Mode** of EngProgress, an IELTS/CEFR practice platform. Stack: Next.js (App Router) + TypeScript + Supabase (Postgres, Auth, RLS, Edge Functions) + Tailwind. AI: Gemini for practice generation, Claude Sonnet for grading (both already integrated for individual mode — reuse those services, do not reimplement).

## Before writing any code

1. Read `/docs/specs/01-PRODUCT-LOGIC-PROMPT.md` (domain logic — source of truth for entities, state machines, permissions) and `/docs/specs/02-UI-SPEC-PROMPT.md` (UI — source of truth for pages and states).
2. Explore the existing codebase: current schema/migrations, auth flow, the individual-mode practice player and grading service, the center-admin pages (Dashboard, Teachers, Groups, Students, Billing). Produce a short written map of what exists vs. what the specs require. **Show me this map and your migration plan before executing Phase 1.**
3. Never break individual (B2C) mode. All org features live behind role-scoped routes.

## Non-negotiable engineering rules

- **RLS is the permission system.** Every table gets row-level security matching the permission matrix in spec 01. UI checks are convenience only. Write RLS tests (a teacher must NOT be able to select another teacher's students even via direct PostgREST calls).
- **Every dashboard number is a defined query/view.** Create SQL views (e.g. `v_center_student_stats`, `v_group_completion`) so "Never practised", "In no group", "Have practised" are exact. No client-side approximations.
- **All AI calls are server-side** (Edge Functions / route handlers). Grading is async: submit → job row → process → update attempt → notify. Include retry (3x, backoff) and `failed_grading` status with a re-run action for teachers.
- **Quota enforcement:** check `usage_counters` before grading; over quota → `awaiting_quota` + notifications; resume on upgrade/rollover (cron).
- **Migrations only** — no manual schema edits. Seed script creates: 1 approved center, 1 admin, 2 teachers, 2 groups, 8 students, 3 practices (1 draft, 2 published+assigned), a few graded attempts — so every page renders with real data in dev.
- TypeScript strict; zod-validate all inputs; no `any` in new code.

## Phases (implement in order, each ends with a working state)

### Phase 1 — Schema & auth foundation
Migrations for: `organizations`, `memberships`, `groups`, `group_members`, `invites`, `practices`, `assignments`, `attempts`, `gradings`, `notifications`, `telegram_links`, `usage_counters` + all RLS policies + stat views. Role-based post-login routing: center_admin → `/console`, teacher → `/teach`, student → `/learn`, super admin → `/admin`. Center-scoped login (login-or-email) working for all roles.
**Done when:** seed data loads; each seeded role signs in and lands on a (stub) home; RLS tests pass.

### Phase 2 — Fix & complete center admin
Wire every existing stat card to views; make cards filter the lists below. Implement invites end-to-end (create, email, accept, expire, resend, revoke, counter). Add: group detail page, student drawer (per UI spec), bulk student add (paste names → generated logins/passwords → downloadable credentials CSV), setup checklist + activity feed on dashboard, usage widget wired to `usage_counters`.
**Done when:** an admin can go from empty center → teachers → groups → 30 students in under 5 minutes, and every number on screen is verifiably correct.

### Phase 3 — Teacher surface
Build `/teach`: dashboard, my groups (+ group detail), practice library with tabs and per-practice stats, practice builder (AI generate via existing Gemini service + manual), **Assign to group modal** (multi-group, optional due date, attempts allowed) creating `assignments`, reports (group → student drill-down with criteria breakdown and error taxonomy), settings.
**Done when:** the full loop works — teacher generates a practice, publishes, assigns to a group, and later sees who completed it and their weaknesses.

### Phase 4 — Student surface
Build `/learn`: home with assigned-practice cards, practice player reusing the individual-mode player with assignment context + autosave, async grading flow with "Grading…" state, result page with annotated feedback, my results, progress charts, notification bell + panel (poll or Supabase Realtime), settings.
**Done when:** a seeded student completes an assigned practice, gets graded, sees the result, and the teacher's report reflects it.

### Phase 5 — Notifications & Telegram
In-app notification fan-out on: assignment published, graded, due in 24h (cron), quota 80/100% (admins), weekly teacher digest. Telegram bot (grammY or telegraf) as an Edge Function webhook: `/start <one-time-token>` deep-link flow from Settings → store chat_id → send the same events. Message templates in EN with a structure ready for UZ/RU. Handle blocked-bot → deactivate link, fall back to in-app.
**Done when:** publishing an assignment makes a seeded student's bell badge increment and (if linked) a Telegram message arrive.

### Phase 6 — Super admin + polish
`/admin`: applications queue (approve/reject with email), centers list (suspend, impersonate), platform stats. Then a full pass: empty/loading/error states everywhere per UI spec, mobile layouts, quota-blocked states, and a smoke-test checklist you run and report on.

## Working style

- Before each phase: restate the plan for that phase in ≤10 bullets and wait for my go-ahead.
- After each phase: list files changed, migrations added, and exactly how I can manually verify (URLs + seeded credentials).
- If the codebase contradicts the specs, tell me and propose the smaller safe change — don't silently refactor individual mode.
- Ask me before adding any new third-party dependency.
