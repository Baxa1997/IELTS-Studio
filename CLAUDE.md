# CLAUDE.md

Durable context for this repo. Full background: `IELTS_Writing_Reading_SaaS_Project_Plan.md` (on Desktop).

## Product

AI platform for IELTS, **Writing + Reading first**. Speaking and Listening are on the roadmap (shown in-product as "coming soon") and will be added after the Writing + Reading experience is solid — do not build them yet; every v1 decision optimizes the two shipping skills.

The whole game is **grading accuracy**. Every competitor already has "AI gives a band + feedback" — that's the price of entry, not the moat. We win on two things:

1. A **calibrated, slightly-conservative grader** (their 6.5 is a real 6.5 on exam day).
2. A **revision loop** that coaches a single essay across drafts instead of score-and-move-on.

## Business model

**B2C self-serve — individuals only.** Anyone signs up and practices IELTS solo with the AI; there are no education centers, teachers, or invites in the shipping product. Each learner still gets a **personal organization**, so the multi-tenant model (and RLS isolation) holds unchanged — one person per org. The B2B center model (center_admin/teacher roles, invites, content-review gate, cohort analytics) is **dormant in the codebase, kept for a possible future** — do not route to it, surface it, or require it; never make a learner depend on a teacher to practice. Because there's no teacher to curate content, **all practice content is AI-generated on demand and auto-served** (no human approval gate).

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind**
- **Supabase** — Postgres, Auth, **RLS**, Storage, **pgvector** (exemplar/rubric corpus)
- **Langfuse** — AI observability: traces, cost, prompt-version, and grading-quality evals
- AI providers: **Gemini** for v1, **Claude Sonnet** for the evaluation engine later (route by task, not globally)

## Non-negotiable principles

1. **Multi-tenant from day one.** Center A must never see Center B's data. Enforce with Supabase **RLS** — not application code alone.
2. **The grader is CALIBRATED and CONSERVATIVE — never inflate bands.** When between two bands, **round down** and state exactly what's missing for the higher band. A false 7.0 destroys trust the moment the real exam result comes back; being told "more work needed" is forgiven.
3. **AI is model-agnostic behind an interface.** Gemini for v1, swappable to Claude Sonnet per-task without touching the app.
4. **Grading logic lives in the `ielts-examiner` skill** at `.claude/skills/ielts-examiner`. Its rubric (official band descriptors), error taxonomy, anchors (calibrated exemplars), grading procedure, and output schema are the **source of truth** — don't re-implement grading rules elsewhere.

## Auth & roles

- **Roles:** `super_admin` (platform, lives in `auth` `app_metadata` — no org/profile, console at `/admin`), `student` (the only shipping org role, in `profiles.role`). `center_admin`/`teacher` still exist in the enum/schema but are **dormant** — no signup path creates them. Source of truth for org roles is the `profiles` table; super_admin is the JWT `app_metadata.role`.
- **Onboarding (the only live path):** **self-signup** — email/password (name+phone) or Google OAuth → `handle_new_user` trigger provisions a **personal org + student profile**. super_admin is created by a script in `scripts/`. (The B2B `invites` flow and script-provisioned `center_admin` remain in the codebase but are dormant.)
- **Routing:** `roleHome()` in `lib/auth.ts` — super_admin→`/admin`, student→`/dashboard` (the dormant center_admin/teacher→`/console` mapping stays for the parked B2B path). Middleware (`proxy.ts`) gates authentication; server components gate role (`requireOrgUser`, `requireSuperAdmin`); RLS gates data. Three layers.
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

## IP / content boundaries (legal landmine — read §2 + §9 of the plan)

- **Never ingest or emit** Cambridge/Oxford/Macmillan test books, official past papers, or any competitor's essay corpus (copyrighted).
- **Do** ground in the **public official band descriptors** + **CEFR descriptors** + our **own generated/expert-verified content** and **own student-essay corpus** (with consent + PII stripped).
- Generate **original** passages/prompts in IELTS format; adapt only public-domain / open-licensed source text.
- Always show the "not affiliated with / not endorsed by IELTS®" disclaimer.

## Modules (scope reference)

- **Writing** (core): **AI-generated-on-demand** Task 1/Task 2 prompts (auto-served, no approval gate), writing studio (timer/autosave), deep per-criterion evaluation, the revision loop (resubmit + re-grade same essay), Band 8 sample comparison.
- **Reading**: dynamic original passages, all real question types (auto-gradeable), per-answer "why the trap worked" explanations, question-type analytics, timed full-section mode.
- **Level ID**: entry diagnostic + continuous, conservative re-estimation ("current band → target band").
- **Activities**: the learner's own history — past graded writing and reading, each reopenable to its stored feedback and band.
- **Dashboard**: student only (current vs. target, weakest area). _(Dormant/parked: Admin/Teacher console — content review gate, human band override, review queue — and the center/B2B cohort dashboard. Not in the shipping B2C product.)_
