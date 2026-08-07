# CLAUDE.md

Durable context for this repo. Full background: `IELTS_Writing_Reading_SaaS_Project_Plan.md` (on Desktop).

## Product

AI platform for IELTS. **All four skills ship**: Writing and Reading (the original core), plus **Listening** and **Speaking**, which are live and no longer carry a BETA badge (2026-08-02 — the earlier "coming soon / do not build them yet" instruction is retired). There is also a **CEFR / Multilevel** track for the Uzbekistan DTM exam: its Reading and Writing papers are live; Listening and Speaking are not built yet.

Writing and Reading remain where the quality bar is highest — the grader and the revision loop are the moat — but a decision that helps one skill should no longer be taken at the expense of the other three.

The whole game is **grading accuracy**. Every competitor already has "AI gives a band + feedback" — that's the price of entry, not the moat. We win on two things:

1. A **calibrated, slightly-conservative grader** (their 6.5 is a real 6.5 on exam day).
2. A **revision loop** that coaches a single essay across drafts instead of score-and-move-on.

## Business model

**B2C self-serve + organizations (B2B phase 1).** Individuals sign up and practice IELTS solo with the AI; each learner gets a **personal organization** (kind `personal`, always `active`), so the multi-tenant model (and RLS isolation) holds — one person per org. **Centers can now apply** from the sign-up page's "Organization" tab: that creates an org with kind `center`, status `pending`, and a `center_admin` profile that stays locked on `/awaiting-approval` until the platform **super_admin approves it in `/admin`** (approval sends a confirmation email via SMTP — `lib/email/send.ts`). Org `status`/`plan` are **not client-writable** (column-level grants); they change only through service-role code. An approved center then runs on **phases 2–4**: the center_admin invites **teachers**; **teachers create their own groups** and **add students by creating their accounts outright** (name + **login** + password, email optional, handed over in class — no invite email); staff **assign practice** to a group (a generated Task 2 prompt or a cloned library reading test — pinned so the whole group sits identical content), students see it at `/assignments` (with an unfinished-homework count badge on the nav item), and the teacher gets a **results report** per assignment (bands, completion, capping criterion / most-missed question types) plus a **per-student report** at `/console/groups/[id]/students/[studentId]` covering all four skills — bands, recurring weaknesses, and a dated table of every practice (homework or self-directed) with a **Report** button per row that opens the learner's own full feedback page (`/activities/essay/…`, `/activities/reading/…`, `/listen/results/…`, `/speak/mock/…` — those four pages gate on RLS, not role, so staff and student share one view). Student **photos are optional** (`profiles.avatar_path` → private `avatars` bucket, uploaded and signed server-side only; never a public URL). A **center student is an ordinary learner**: they practise anything they like, and their teacher can see it. Practice visibility for listening/speaking is scoped by `can_view_student` (a teacher sees only students in groups they own; center_admin sees the org) — note the older essays/reading policies are still org-wide for any teacher. Assignments deliberately carry **no id on essays or attempts** — the report joins group member × content id, so the runners stay untouched. **Centers run unmetered on purpose**: `organizations.billing_enforced` is `false` for centers (`true` for personal orgs, whose plan limits are unchanged), so quota and seat checks are skipped — `lib/quota.ts` `loadOrg`/`effectiveLimit` is the single choke point, so flipping the column starts enforcement everywhere at once (see migration `20260807150000`). Still **NOT built**: center pricing/checkout, listening + speaking assignments, and emailed report digests (the report is in-console only). Never make an individual learner depend on a teacher to practice — individual practice content stays **AI-generated on demand and auto-served** (no human approval gate).

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind**
- **Supabase** — Postgres, Auth, **RLS**, Storage, **pgvector** (exemplar/rubric corpus)
- **Langfuse** — AI observability: traces, cost, prompt-version, and grading-quality evals. (Reality check: the app has a small Langfuse client; the engine currently records spend in the `ai_usage` table rather than Langfuse.)
- AI providers: **Gemini**, routed **per task, not globally**. Which model serves which task — in both this app and the engine — is inventoried in the engine's `docs/model-inventory.md`; the October 2026 shutdown of the 2.5 line and how to migrate safely is `docs/model-migration-2026-10.md`. Never hardcode a model id outside those env-driven constants.

## Non-negotiable principles

1. **Multi-tenant from day one.** Center A must never see Center B's data. Enforce with Supabase **RLS** — not application code alone.
2. **The grader is CALIBRATED and CONSERVATIVE — never inflate bands.** When between two bands, **round down** and state exactly what's missing for the higher band. A false 7.0 destroys trust the moment the real exam result comes back; being told "more work needed" is forgiven.
3. **AI is model-agnostic behind an interface.** Gemini for v1, swappable to Claude Sonnet per-task without touching the app.
4. **Grading logic lives in the `ielts-examiner` skill** at `.claude/skills/ielts-examiner`. Its rubric (official band descriptors), error taxonomy, anchors (calibrated exemplars), grading procedure, and output schema are the **source of truth** — don't re-implement grading rules elsewhere.

## Auth & roles

- **Roles:** `super_admin` (platform, lives in `auth` `app_metadata` — no org/profile, console at `/admin`), plus the org roles in `profiles.role`: `student` (individual learners and center students), `center_admin` (created by the Organization signup tab, pending until approved), `teacher` (invited by a center_admin, owns groups). Source of truth for org roles is the `profiles` table; super_admin is the JWT `app_metadata.role`.
- **Onboarding (two live paths):** (1) **individual self-signup** — email/password (name+phone) or Google OAuth → `handle_new_user` trigger provisions a **personal org + student profile**; (2) **organization application** — the sign-up page's "Organization" tab (official name + org email + password, email/password only) → the same trigger provisions a **pending center org + center_admin profile**, gated on `/awaiting-approval` until super_admin approval. (3) **center invite** — a center_admin (or a teacher, for their own group) issues a tokenized `invites` link carrying role + optional `group_id`; accepting provisions the profile in that org/role and joins the group. super_admin is created by a script in `scripts/`.
- **Login names:** `profiles.username` (lowercase, globally unique) lets center accounts sign in **without an email** — the sign-in field takes either, and anything without an `@` is resolved to its account server-side in `signIn` (service-role; identical error either way, so the form can't be used to enumerate logins). Students created without a real address get an undeliverable one at `students.engprogress.com` and therefore have **no email password reset** — their teacher resets it. super_admin has no profile row, so it signs in by email.
- **Routing:** `roleHome()` in `lib/auth.ts` — super_admin→`/admin`, student→`/dashboard`, center_admin/teacher→`/console`. Middleware (`proxy.ts`) gates authentication; server components gate role (`requireOrgUser`, `requireSuperAdmin`) and org approval (`requireOrgUser` sends any non-`active` org to `/awaiting-approval`); RLS gates data. Three layers.
- Auth guards/helpers live in `lib/auth.ts`; never re-derive role from the client.

## Conventions

- API via **server actions / route handlers**. The API layer owns auth, rate limits, usage quotas, billing hooks.
- **Never call AI models from the client** (cost + abuse).
- **All AI calls go through a single server-side service** with usage logging.
- **Separate the generator from the grader** — different calls; the model that writes prompts/passages must not grade its own output leniently.

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
- **Dashboard**: student only (current vs. target, weakest area). _(Dormant/parked: Admin/Teacher console — content review gate, human band override, review queue — and the center/B2B cohort dashboard. Not in the shipping B2C product.)_
