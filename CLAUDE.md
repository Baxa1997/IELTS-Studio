# CLAUDE.md

Durable context for this repo — the **rulebook**: what the product is, and the
principles that must hold.

For the **map** — where the two repositories are, what runs where, how to reach
the database, and what is currently broken — read **`PROJECT-CONTEXT.md`**
first. When the two disagree, this file wins on policy and that one wins on
facts on the ground.

Full background: `IELTS_Writing_Reading_SaaS_Project_Plan.md` (on Desktop).

## At a glance

- **Two repos.** This one is the **Next.js app** (learner + teacher + admin UI,
  auth, billing, grading prompts). `~/Desktop/saas/ielts-ai-engine` is the
  **Python engine** that generates and renders practice content — see below.
- **Four IELTS skills + a CEFR/Multilevel track**, all generated on demand. No
  human approval gate stands between a learner and a practice task.
- **Two kinds of customer**: individuals (each gets a personal organisation) and
  education centres (org + teachers + groups + assignments), one tenant model
  for both, isolated by RLS.
- **The moat is the grader**, not the feature list. Calibrated, conservative,
  and specified in one place — the `ielts-examiner` skill.

## Product

AI platform for IELTS. **All four skills ship**: Writing and Reading (the original core), plus **Listening** and **Speaking**, which are live and no longer carry a BETA badge (2026-08-02 — the earlier "coming soon / do not build them yet" instruction is retired). There is also a **CEFR / Multilevel** track for the Uzbekistan DTM exam: its Reading and Writing papers are live; Listening and Speaking are not built yet.

Writing and Reading remain where the quality bar is highest — the grader and the revision loop are the moat — but a decision that helps one skill should no longer be taken at the expense of the other three.

The whole game is **grading accuracy**. Every competitor already has "AI gives a band + feedback" — that's the price of entry, not the moat. We win on two things:

1. A **calibrated, slightly-conservative grader** (their 6.5 is a real 6.5 on exam day).
2. A **revision loop** that coaches a single essay across drafts instead of score-and-move-on.

## Business model

**B2C self-serve + organizations (B2B phase 1).** Individuals sign up and practice IELTS solo with the AI; each learner gets a **personal organization** (kind `personal`, always `active`), so the multi-tenant model (and RLS isolation) holds — one person per org. **Centers can now apply** from the sign-up page's "Organization" tab: that creates an org with kind `center`, status `pending`, and a `center_admin` profile that stays locked on `/awaiting-approval` until the platform **super_admin approves it in `/admin`** (approval sends a confirmation email via SMTP — `lib/email/send.ts`). Org `status`/`plan` are **not client-writable** (column-level grants); they change only through service-role code. An approved center then runs on **phases 2–4**: the center_admin invites **teachers**; **teachers create their own groups** and **add students by creating their accounts outright** (name + **login** + password, email optional — give an address and the credentials are emailed to the student, leave it blank and the teacher hands them over in class/Telegram); staff **assign practice** to a group — four kinds (`AssignmentKind` in `lib/console/assignments.ts`): a generated Task 2 prompt, a cloned library reading test, a listening practice, or a Practice-AI lesson, each pinned by id so the whole group sits identical content, students see it at `/assignments` (with an unfinished-homework count badge on the nav item), and the teacher gets a **results report** per assignment (bands, completion, capping criterion / most-missed question types) plus a **per-student report** at `/console/groups/[id]/students/[studentId]` covering all four skills — bands, recurring weaknesses, and a dated table of every practice (homework or self-directed) with a **Report** button per row that opens the learner's own full feedback page (`/activities/essay/…`, `/activities/reading/…`, `/listen/results/…`, `/speak/mock/…` — those four pages gate on RLS, not role, so staff and student share one view). Student **photos are optional** (`profiles.avatar_path` → private `avatars` bucket, uploaded and signed server-side only; never a public URL). A **center student practises only what their teacher attaches to their group.** `isHomeworkOnlyStudent()` in `lib/auth.ts` (`role === "student"` **and** `org.kind === "center"`) sends them from all five skill hubs — and from settings — to `/assignments`; the browsable libraries are for solo learners and staff. Their whole surface is their homework, and their teacher sees all of it. ⚠️ This is the reverse of what this file said until 2026-09-20, and the reverse of the "never make an individual learner depend on a teacher" rule that closes this paragraph — both are deliberate: a center student has a teacher choosing their content, a solo learner has nobody, which is who "never make a learner depend on a teacher" was written for. Practice visibility for listening/speaking is scoped by `can_view_student` (a teacher sees only students in groups they own; center_admin sees the org) — note the older essays/reading policies are still org-wide for any teacher. Assignments deliberately carry **no id on essays or attempts** — the report joins group member × content id, so the runners stay untouched. **Centers run unmetered on purpose**: `organizations.billing_enforced` is `false` for centers (`true` for personal orgs, whose plan limits are unchanged), so quota and seat checks are skipped — `lib/quota.ts` `loadOrg`/`effectiveLimit` is the single choke point, so flipping the column starts enforcement everywhere at once (see migration `20260807150000`). Still **NOT built**: center pricing/checkout, **speaking** assignments (the speak hub renders an empty assigned list for a center student on purpose — there is no kind to fill it), and emailed report digests (the report is in-console only). Never make an individual learner depend on a teacher to practice — individual practice content stays **AI-generated on demand and auto-served** (no human approval gate).

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind**
- **Supabase** — Postgres, Auth, **RLS**, Storage. (**pgvector is not in use.** No migration declares a vector column; the calibrated anchors are static markdown read off disk by `lib/ai/anchors.ts`. An embedded exemplar corpus is a plan, not a fact — do not write code that assumes one exists.)
- **Langfuse** — AI observability: traces, cost, prompt-version, and grading-quality evals. (Reality check: the app has a small Langfuse client; the engine currently records spend in the `ai_usage` table rather than Langfuse.)
- AI providers: **Gemini**, routed **per task, not globally**. Which model serves which task — in both this app and the engine — is inventoried in the engine's `docs/model-inventory.md`; the October 2026 shutdown of the 2.5 line and how to migrate safely is `docs/model-migration-2026-10.md`. Never hardcode a model id outside those env-driven constants.

## The engine repo (`ielts-ai-engine`)

The backend that makes practice content. A **separate git repository** at
`~/Desktop/saas/ielts-ai-engine`, Python + FastAPI (`main.py`), self-hosted on a
Contabo box that this app calls over HTTP. It is not deployed by Vercel and
does not ship with this repo.

- **What lives there:** `reading/`, `listening/`, `speaking/`, `multilevel/`
  (the CEFR track) and `lessons/` — each holding the prompts, the layout rules,
  the schemas and the validators for that skill. `listening/` also owns
  multi-voice TTS. `scripts/` holds the seeders and `scripts/qa/` the QA tools.
- **What does NOT live there: grading.** The `ielts-examiner` skill in *this*
  repo is the single source of truth for how work is scored; the engine proxies
  the call. Do not re-implement rubric, anchors or strictness there.
- **`docs/` is the real documentation** and is worth reading before touching
  anything: `model-inventory.md` (which model serves which task, in both repos),
  `model-migration-2026-10.md`, `calibration-log.md` (**read before changing any
  grading arithmetic, anchor or strictness knob** — speaking grading is frozen),
  the `listening-part{1,2,3,4}-spec.md` set, and `cefr-listening-spec.md`.
- **Deploy order is engine first, app second.** The app expects endpoints the
  engine may not have yet; shipping them the other way round breaks production.
- **Tests need the venv recipe** — the system Python is PEP-668 locked and
  `requirements.txt` alone does not collect.
- **Never hardcode a model id** in either repo. Models are env-driven constants,
  routed per task rather than globally.

## Non-negotiable principles

1. **Multi-tenant from day one.** Center A must never see Center B's data. Enforce with Supabase **RLS** — not application code alone.
2. **The grader is CALIBRATED and CONSERVATIVE — never inflate bands.** When between two bands, **round down** and state exactly what's missing for the higher band. A false 7.0 destroys trust the moment the real exam result comes back; being told "more work needed" is forgiven.
3. **AI is model-agnostic behind an interface.** Gemini for v1, swappable to Claude Sonnet per-task without touching the app.
4. **Grading logic lives in the `ielts-examiner` skill** at `.claude/skills/ielts-examiner`. Its rubric (official band descriptors), error taxonomy, anchors (calibrated exemplars), grading procedure, and output schema are the **source of truth** — don't re-implement grading rules elsewhere.

## Auth & roles

- **Roles:** `super_admin` (platform, lives in `auth` `app_metadata` — no org/profile, console at `/admin`), plus the org roles in `profiles.role`: `student` (individual learners and center students), `center_admin` (created by the Organization signup tab, pending until approved; owns the center — prices, payroll, the ledger, the plan, the settings), `administrator` (the front desk: classes, rosters, attendance, money **in** only — it split off `center_admin` in migration `20260813140000`), `teacher` (invited by a center_admin, owns groups). Source of truth for org roles is the `profiles` table; super_admin is the JWT `app_metadata.role`.
- **⚠️ Never compare to a role string for a center capability.** Use `isOrgOwner()` / `canManagePeople()` in `lib/auth.ts`, which mirror the SQL functions of the same names. `role === "center_admin"` silently excludes an administrator and `role !== "teacher"` silently includes them — both are how a role leaks somewhere nobody meant it to go.
- **Onboarding (two live paths):** (1) **individual self-signup** — email/password (name+phone) or Google OAuth → `handle_new_user` trigger provisions a **personal org + student profile**; (2) **organization application** — the sign-up page's "Organization" tab (official name + org email + password, email/password only) → the same trigger provisions a **pending center org + center_admin profile**, gated on `/awaiting-approval` until super_admin approval. (3) **center invite** — a center_admin (or a teacher, for their own group) issues a tokenized `invites` link carrying role + optional `group_id`; accepting provisions the profile in that org/role and joins the group. super_admin is created by a script in `scripts/`.
- **Login names:** `profiles.username` (lowercase, globally unique) lets center accounts sign in **without an email** — the sign-in field takes either, and anything without an `@` is resolved to its account server-side in `signIn` (service-role; identical error either way, so the form can't be used to enumerate logins). Students created without a real address get an undeliverable one at `students.engprogress.com` and therefore have **no email password reset** — their teacher resets it. super_admin has no profile row, so it signs in by email.
- **Routing:** `roleHome()` in `lib/auth.ts` — super_admin→`/admin`, student→`/dashboard`, every center role (center_admin/administrator/teacher)→`/console`. `ROLE_AREAS` in the same file then gates which areas a `?next=` may reach, because a valid local path says nothing about **who** is going there — a learner signing in on a bounced `?next=/console` used to land in the center console. Middleware (`proxy.ts`) gates authentication; server components gate role (`requireOrgUser`, `requireSuperAdmin`) and org approval (`requireOrgUser` sends any non-`active` org to `/awaiting-approval`); RLS gates data. Three layers.
- Auth guards/helpers live in `lib/auth.ts`; never re-derive role from the client.

## Conventions

- API via **server actions / route handlers**. The API layer owns auth, rate limits, usage quotas, billing hooks.
- **Never call AI models from the client** (cost + abuse).
- **All AI calls go through a single server-side service** with usage logging.
- **Separate the generator from the grader** — different calls; the model that writes prompts/passages must not grade its own output leniently.

## How to work in this repo

These are about the mechanics of working here, and they are the rules broken
most often. All of them exist because breaking one cost real time.

- **⛔ DO NOT RUN `npm run build` FOR A UI CHANGE.** A dev server is usually
  running, and `next build` and `next dev` share `.next/static` — a build while
  dev is live leaves the browser serving stale CSS that looks exactly like a
  bug you just introduced. The owner tests UI visually. Edit, commit, report.
- **⛔ DO NOT PROBE THE RUNNING APP.** No browser harnesses, no screenshots, no
  curling the dev server to "verify" a visual change. If a change cannot be
  checked by reading the code, say so and hand it over.
- **CHECK, DO NOT SWEEP.** `npx tsc --noEmit` plus the one test file that
  covers what you touched is the normal verification. Run the whole suite once
  before a commit that spans several areas, not after every edit — and never
  run `prettier --write` while `vitest` is reading the same files, which
  produces failures that vanish on a re-run.
- **NEVER PUSH OR DEPLOY WITHOUT BEING ASKED.** Make the change, test it,
  commit locally, then stop. Shipping is the owner's call, every time. This
  includes anything that writes to the production database — the seed scripts
  in `scripts/` among them.
- **LONG JOBS GO TO A LOG, NOT THROUGH THE CONVERSATION.** Content generation
  and seeding produce thousands of lines. Run them detached, then check a count
  or a tail. Never read generated passages back to verify them.

## Writing code here

The codebase has a house style, and it is not about formatting — Prettier
handles that. It is about what a file is expected to explain.

- **COMMENT THE WHY AND THE TRAP, NEVER THE WHAT.** `// set the locale` is
  noise. The comment worth writing is the one that stops the next person
  undoing something load-bearing: what was tried, what broke, and why the
  obvious-looking simplification is wrong. Mark those `⚠️`.
- **A NON-OBVIOUS DECISION GETS A TEST THAT PINS IT.** Not for coverage — so
  that reverting it turns something red with the reason attached. Then
  **mutation-test the guard**: break the thing deliberately and confirm the test
  actually fails. A guard that passes against the bug it was written for is
  worse than none, and this has happened here.
- **DERIVE, DO NOT SPELL OUT.** A list that must track a constant should be
  computed from it. Hardcoded parallel lists go stale silently.
- **NO COLOUR LITERALS.** Use the tokens in `lib/theme/tokens.ts`; every fill
  carries its own ink (`GREEN_FILL` + `ON_GREEN`), because a literal fill with
  a token ink inverts in dark mode and becomes unreadable. **Dark mode is
  live** and its accent is orange, not the burgundy of light — so a surface is
  never finished until both themes have been looked at.
- **NO USER-FACING COPY AS STRING LITERALS** in the app shell or marketing
  surfaces — keys in `lib/i18n/messages/en.ts`, which the other locales (`uz`,
  `ru`) are typed against. Exam content and grader output stay English on
  purpose. ⚠️ **`en` is the SOURCE locale but `uz` is the DEFAULT** — `/` is
  Uzbek and English lives at `/en` (`DEFAULT_LOCALE` in `lib/i18n/locales.ts`).
  The two are different decisions and the fallback follows `SOURCE_LOCALE`;
  conflating them broke four things silently.
- **RESPECT THE CLIENT BOUNDARY.** A `"use client"` module may export a
  component to a server module, never a value: strings, arrays and config
  arrive as client references and produce junk without an error.
- **MATCH THE FILE YOU ARE IN.** Comment density, naming and idiom should look
  like the surrounding code, not like a different codebase.

## Folder structure

Adopted 2026-09-26 across the whole of `app/`. Every route folder follows it;
a helper sitting loose beside a `page.tsx` is a regression, not a style.

```
app/<route>/            page.tsx, layout.tsx, loading.tsx, actions.ts — Next's files stay at the root
  _components/          components only this route (and its child routes) use
  _hooks/  _types/      hooks / types shared by several files of this route
  _lib/                 plain helpers and constants for this route
shared/components/      used by two or more areas, grouped by domain (ui/, app-shell/, speaking/ …)
lib/<domain>/           server logic, data access, and server actions more than one area calls
```

- **THE UNDERSCORE IS LOAD-BEARING.** `_x` is Next's private folder: never a
  route, whatever is put inside it later. `components/` without it becomes a
  URL the day someone drops a `page.tsx` in it.
- **A SUBFOLDER EXISTS ONLY WHEN IT HAS SOMETHING IN IT.** No empty `_hooks/`.
  A type or hook used by one file stays in that file.
- **PLACEMENT FOLLOWS USE, NOT TOPIC.** A file lives in the deepest route folder
  that covers every file importing it: a panel only the homework tab uses sits
  in `groups/[id]/(tabs)/homework/_components/`, one three console sections
  share sits in `console/_components/`. Used by two AREAS → `shared/`.
  - `(app)`, `(shell)` and `(studio)` are frames, not areas — a file the writing
    hub and the writing studio both run is shared (`shared/components/writing/`).
    `(auth)`, `(marketing)` and `(legal)` ARE areas.
  - `app/[locale]/x` is the same page as `app/x`, so it does not make `x`'s
    components shared.
  - An `import type` does not place a file. `writing-studio.tsx` stays with the
    studio although the hub imports a type from it.
  - Two exceptions, both deliberate: `app/_landing/` is the public site's own
    module (the landing page, marketing, legal and the docs all draw on it), and
    `shared/components/ui/` is the shadcn kit — `components.json` points the CLI
    there, so a primitive stays in it even while one area uses it.
- **IMPORTS FLOW ONE WAY: `app/` → `shared/` → `lib/`, AND ESLINT ENFORCES IT**
  (`no-restricted-imports` in eslint.config.mjs). A server action a route calls
  for itself stays in its `actions.ts`; one that another area or a shared
  component calls goes in `lib/<domain>/` (`lib/auth-actions.ts`,
  `lib/console/practice-actions.ts`, `lib/estimates/actions.ts` …).
- **⚠️ A TEST THAT SCANS SOURCE FILES USES `sourceFiles()`** from
  `test/source-files.ts`, never `git ls-files` directly. The index is not the
  disk: moved-but-unstaged files vanish from it, so five guards would have gone
  on passing while scanning none of `shared/`.
- **⚠️ A TEST THAT MATCHES AN IMPORT BY ITS TEXT BREAKS SILENTLY ON A MOVE.**
  `svg-vars.test.ts` finds palette imports with a regex over the specifier; the
  move changed `./design` into `../_lib/design` and it would have stopped seeing
  30 of 237 without failing. When you move a file, grep the tests for its name.
- **⚠️ MOVING A SERVER ACTION CHANGES ITS ID.** A tab opened before the deploy
  can fail its next submit until it reloads. Harmless, but do not mistake it for
  a bug in the action.

## How grading must work (the anti-inflation playbook)

The `ielts-examiner` skill encodes this; honor it on every grading call:

- **Ground in the official public band descriptors** (RAG), not the model's gut.
- **Few-shot anchor** with our own calibrated exemplars near the likely band (biggest anti-inflation lever).
- **Force criterion-by-criterion reasoning with evidence** before emitting a number.
- **Conservative tie-breaking** (round down + name the gap).
- **Low temperature** for consistency — same essay → same band.
- Output per criterion (TR/TA, CC, LR, GRA): `{ band, evidence, what_caps_it, fix }`, plus overall band and a "band with fixes" target.
- **Calibration loop:** measure grader error and upward bias against a held-out set of expert-judged essays; track in Langfuse; tune to within ±0.5 of human and **not biased upward**. Expert-labeled corrections feed back into the anchor set. (No in-product teacher override in the B2C build; the dormant override path stays for a future B2B return.)

> **Speaking grading is FROZEN until expert labels exist.** The measured +0.409
> upward bias is against anchors we wrote ourselves, so it is not a real error
> bar, and the double-flooring that partly offsets it is **load-bearing** —
> removing it was A/B'd and made the bias *worse*. Read the engine's
> `docs/calibration-log.md` before changing any grading arithmetic, anchor, or
> strictness knob. Hiring a marker is the only unblock.

## IP / content boundaries (legal landmine — read §2 + §9 of the plan)

- **Never ingest or emit** Cambridge/Oxford/Macmillan test books, official past papers, or any competitor's essay corpus (copyrighted).
- **Do** ground in the **public official band descriptors** + **CEFR descriptors** + our **own generated/expert-verified content** and **own student-essay corpus** (with consent + PII stripped).
- Generate **original** passages/prompts in IELTS format; adapt only public-domain / open-licensed source text.
- Always show the "not affiliated with / not endorsed by IELTS®" disclaimer.

## Modules (scope reference)

- **Writing** (core): **AI-generated-on-demand** Task 1/Task 2 prompts (auto-served, no approval gate), writing studio (timer/autosave), deep per-criterion evaluation, the revision loop (resubmit + re-grade same essay), Band 8 sample comparison.
- **Reading**: dynamic original passages, all real question types (auto-gradeable), per-answer "why the trap worked" explanations, question-type analytics, timed full-section mode.
- **Listening**: original multi-voice audio generated and rendered by the engine, Cambridge-style question groups, full 4-part tests and quick practices, transcripts and per-answer explanations.
- **Speaking**: Part-2 push-to-talk practice, the full **3-part live mock** with an AI examiner (plan-gated — a trial gets exactly one a month), and a **tutor** lesson that reacts and teaches while you talk. Grading is deliberately **frozen** pending expert labels — see the engine's `docs/calibration-log.md` before touching any grading arithmetic, anchor or strictness knob.
- **CEFR / Multilevel** (Uzbekistan DTM): Reading (5 parts / 35 Qs) and Writing (3 tasks) are live and generated on demand. Listening and Speaking are **not built**; the Listening format research and its open questions live in the engine's `docs/cefr-listening-spec.md`.
- **Level ID**: entry diagnostic + continuous, conservative re-estimation ("current band → target band").
- **Activities**: the learner's own history — past graded work, each reopenable to its stored feedback and band.
- **Dashboard**: student only (current vs. target, weakest area).
- **Practice AI** (`/learn`, `/console/practice-ai`): a teacher types a brief, the engine returns a lesson page — explanation plus auto-graded practice — which is assignable to a group or shareable by link.
- **Vocabulary**, **Referrals**, **Notifications**, **Certificates**, **Diagnostic/placement**: smaller learner-side surfaces, each with its own route group.

### The center console (`/console`) — the largest surface in the repo

⚠️ This was filed here as "dormant/parked, not in the shipping product" until
2026-09-20. It is neither: **21 sections, 36 pages**, and most of the schema.
Do not plan around it being absent.

- **People & teaching**: groups, students, teachers, attendance, marking, grading, review, reports, cohort, announcements.
- **Money**: kassa, ledger, invoices, payments, payroll with dynamic salary rules, branches (which own both rooms and cash desks), billing — plus hand-rolled XLSX and PDF builders in `lib/finance/`.
- **Timetable**: calendar, rooms, per-lesson proration.
- **Telegram + the staff assistant**: one brain, two surfaces (console chat and `@engprogress_bot`). The model never touches the database — it reads a prose snapshot and returns at most one proposal, which a human confirms; the server then re-derives the caller, re-checks role and re-resolves every name through RLS.
- **`/admin`** is the separate platform console, super_admin only.
