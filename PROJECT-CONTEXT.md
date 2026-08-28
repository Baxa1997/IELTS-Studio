# Project context — read this first

Orientation for a session that has never seen this codebase. `CLAUDE.md` (same
folder) is the rulebook: product, business model, non-negotiable principles,
grading policy, IP boundaries. **This file is the map**: where things are, what
runs where, how to check state, and what is currently broken.

When they disagree, `CLAUDE.md` wins on _policy_ and this file wins on _facts on
the ground_ — it is the one that gets corrected when reality moves.

---

## 1. Two repositories, and the split between them

|            | Path                             | What it is                                                                                |
| ---------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| **App**    | `~/Desktop/saas/IELTS agnetic`   | Next.js (App Router) + TypeScript + Tailwind. Everything a user sees. Deployed on Vercel. |
| **Engine** | `~/Desktop/saas/ielts-ai-engine` | Python + FastAPI. Self-hosted on a Contabo box behind nginx.                              |

The folder name really does have a space and a typo in it. Quote it in shell
commands: `cd "~/Desktop/saas/IELTS agnetic"`.

**The engine is deliberately dumb.** Its own docstring (`main.py`) says so: it
forwards `{model, system, prompt, temperature, json}` to Vertex AI and returns
`{text, usage}`. Prompt assembly, JSON schemas, the band rubric, validation,
retries and temperature policy all live in the **app**. That split is what keeps
CLAUDE.md's "separate the generator from the grader" rule enforceable, and it is
why you can swap models per task without redeploying the box.

Two exceptions where the engine owns real logic, because the work is too slow or
too binary for a Vercel function: **listening** (script generation + multi-voice
TTS + audio upload, ~2 min per practice) and **speaking** (live audio sessions).
Those live in `listening/` and `speaking/` in the engine and the browser calls
them _directly_, bypassing the Next app.

**Deploy order is not optional: engine first, then app.** The app tolerates an
old engine; the engine cannot serve a request the app has not learned to make.

---

## 2. Where things are in the app

```
app/
  (marketing)  _landing/  p/     public pages, SEO, pricing copy
  (auth)                         sign-in, sign-up (individual + organisation tabs)
  (shell)                        the four skill hubs + CEFR — read/ write/ listen/ speak/ cefr/
  (app)                          signed-in learner + staff console
       console/                  the centre's back office (staff only)
       dashboard/ activities/    the learner's own progress and history
       assignments/ learn/       homework and Practice-AI lessons
  (studio)                       distraction-free runners (full screen, no shell)
  admin/                         platform super_admin only
  api/                           route handlers (billing, cron, exports, engine proxies)

lib/
  auth.ts          ⭐ roles, guards, roleHome, isHomeworkOnlyStudent
  quota.ts         ⭐ the single choke point for plan limits and billing_enforced
  provision.ts     org/profile creation, and the personal-workspace cleanup
  console/         staff console data layer (groups, attendance, assignments, assistant)
  finance/         kassa, ledger, invoices, payroll, reports, xlsx/pdf builders
  reading/ writing/ grading/ lessons/   the skills' server logic
  engine/client.ts how the app talks to the engine
  supabase/        server + admin (service-role) clients
  prompts/ ai/     prompt assembly and the model router

supabase/migrations/    every schema change, timestamp-named
scripts/                seeds, QA smoke tests, admin creation
.claude/skills/ielts-examiner/   ⭐ grading rubric — the source of truth
```

**Component/design conventions live in `components/`**: `app-shell/` is the rail
and frame every role shares; `console/` is the CRM-styled staff chrome;
`brand/` holds the wordmarks, including a centre's own.

---

## 3. Where things are in the engine

```
main.py         the dumb Vertex proxy (X-Internal-Key auth, 127.0.0.1 bind)
auth.py         Actor = {user_id, organization_id, role}, resolved from the bearer token
db.py           thin PostgREST wrapper — select/insert/update/delete
listening/      service.py, router.py, tts.py, prompts.py, validate.py, layouts.py
speaking/       live sessions, the exam, the tutor
reading/ lessons/ multilevel/   the other generators
scripts/        seed_listening_library.py, seed_*_planned.py, tts_listening.py
scripts/qa/     ⭐ audio QA: spell_qa, num_qa, block_qa_loop, wps_check
docs/           ⭐ the real specifications — see below
tests/          pytest
```

**The engine's `docs/` is where the thinking is written down.** Before changing
anything in speaking or listening, read the relevant plan:
`calibration-log.md` (⚠️ grading is frozen — read before touching any band
arithmetic), `speaking-excellence-plan.md` (the master roadmap),
`model-inventory.md` and `model-migration-2026-10.md` (which model serves which
task, and the October 2026 shutdown of the 2.5 line),
`listening-*-spec.md`, `cefr-listening-spec.md`.

---

## 4. Infrastructure

| Thing                   | Where                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| App                     | Vercel → **engprogress.com** (beware the near-twin typo domain `engprogess.com`)                       |
| Engine                  | Contabo VPS, nginx in front, reached at `NEXT_PUBLIC_AI_BACKEND_URL` (`lucid.shopsready.com/ielts`)    |
| Database, auth, storage | Supabase, project ref **`fgpcucnbbywasbwvwqpx`**, region ap-southeast-1                                |
| Models                  | Gemini via Vertex AI, routed **per task** — never hardcode a model id outside the env-driven constants |
| Payments                | Stripe (live)                                                                                          |
| Email                   | Brevo SMTP                                                                                             |
| Telegram                | `@engprogress_bot` — parent notifications and the staff assistant                                      |

Secrets live in `.env.local` (not committed). Names, not values:
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `GEMINI_API_KEY`,
`STRIPE_SECRET_KEY`, `SMTP_*`, `TELEGRAM_BOT_TOKEN`, `CRON_SECRET`.

⚠️ **`.env.local` points at PRODUCTION.** There is no separate dev database.
Anything you run locally — a script, a seed, a QA smoke test — writes to the
live project. This has already caused real damage; see §7.

---

## 5. Running things

```bash
# app
npm run dev            npm run build          npm run test      # vitest
npm run typecheck      npm run lint           npm run format
npm run seed:reading   # regenerates the shared reading library (real model calls)

# engine — system python is PEP-668 locked; use a venv
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest tests/ -q
```

Some engine tests need optional deps (`websockets`, cloud SDKs) and fail to
collect without them — that is pre-existing, not something you broke. Confirm by
stashing your change and re-running before you go hunting.

**Reading the database directly.** PostgREST with the service-role key is the
quickest way to check state:

```js
fetch(`${SUPABASE_URL}/rest/v1/listening_library?select=id`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "count=exact", Range: "0-0" },
});
// row count comes back in the content-range header
```

**Running SQL / DDL** needs the Management API, not PostgREST:
`POST https://api.supabase.com/v1/projects/<ref>/database/query` with
`{"query": "..."}` and `Authorization: Bearer $SUPABASE_ACCESS_TOKEN`.

---

## 6. The rules that bite

These are the ones that have actually cost time here.

1. **Never deploy or push without asking.** Build it, test it, commit to a local
   branch, then stop. The owner decides when anything ships.
2. **Multi-tenancy is enforced by RLS, not by application code** — except in the
   engine, which uses the service-role key and therefore _bypasses RLS
   entirely_. Every engine query against a shared table must carry its own
   organisation predicate. There is no safety net underneath it.
3. **No PostgREST embeds** on tables with composite foreign keys (most of the
   finance and timetable schema). They resolve to nothing and render a blank
   page with no error.
4. **Always `.select()` after an update or delete.** Without it an RLS-filtered
   write that changed zero rows reports success.
5. **Grading is frozen** until expert labels exist. The speaking double-flooring
   is load-bearing — removing it was A/B'd and made the bias worse.
6. **Never serve unverified listening audio.** TTS mangles spelled names and
   long numbers, which turns a correct answer into a wrong one. Seeds write
   items `active = false` on purpose; QA the audio, then activate.
7. **IP boundary:** never ingest or emit Cambridge/Oxford/Macmillan material or
   any competitor corpus. Original content in the IELTS _format_ only.

---

## 7. Current state — the thing that is broken right now

**Both shared content libraries were destroyed in August 2026.**

Someone deleted the two reserved "library" organisation rows. `ON DELETE
CASCADE` — which 55 tables carry — took everything they owned:

- `listening_library`: 45 practices (30 full tests + 15 quick singles) → **0**
- the shared reading library (`reading_tests where is_library = true`) → **0**
  (the 80 learner-owned reading tests survived)
- the learner attempt history for those practices went with them

The reserved ids are `…111b` (reading, exported as `READING_LIBRARY_ORG_ID` from
`lib/reading/service.ts`) and `…111c` (listening, in migration
`20260809140000` and the engine's `LIBRARY_ORG_ID`).

**Why nothing caught it.** Those orgs wear the column defaults —
`kind = 'personal'`, `status = 'active'`, zero profiles — so to every guard in
the codebase they look exactly like an abandoned personal workspace, which is
the thing those guards exist to clean up. The culprit was never identified:
no code path in either repo deletes them, Postgres does not log `DELETE`s by
default, and the cascade destroyed every row that could have dated it.

**Fixed since:**

- `20260828120000_protect_library_orgs.sql` — a `BEFORE DELETE` trigger that
  refuses to delete those two ids. **Applied to production and verified**
  (a rehearsed delete is blocked; ordinary orgs still delete normally).
  It protects the _org_ rows only — a direct `delete from listening_library` is
  still allowed, because the seed scripts delete single rows to roll back a
  failed item.
- Engine branch `fix/listening-library-org-scope` — `list_library` and
  `_load_library` had **no organisation filter at all**, so any learner could
  read any centre's library row by id. Committed, **not deployed**.

**Still open:**

- The listening library is empty. The audio survived
  (`listening-audio/library/`, 54 folders), so restored rows would play
  immediately; regenerated ones need fresh audio and a QA pass.
- **PITR is disabled.** Only 7 daily physical backups exist, and a dashboard
  restore is _in-place_ — it would roll production back and destroy everything
  newer. Recovery route is: ask Supabase support to restore a backup to a
  **separate** project, then extract the two tables.
- `docs/engine-changes-2026-08-09.md` specified four changes; only the migration
  and (now) the org filter are done. **`POST /listening/promote` does not exist
  in the engine**, so the app's call to it 404s and a teacher cannot assign a
  generated listening item to a class. The `POST /reading/next` body + card
  fields are also unbuilt.

---

## 8. Things that are already built (don't rebuild them)

Easy to mistake for missing, because the library being empty makes the whole
listening feature look unimplemented:

- **Free-plan gating with lock icons.** `listening-client.tsx` renders a `Lock`
  badge on gated items, a "Free: 3/5 used" counter, dims locked cards, and
  routes a click to Stripe checkout via `UpgradeNotice`.
- **Centre students see only their homework.** `isHomeworkOnlyStudent()` in
  `lib/auth.ts` (`role === "student" && org.kind === "center"`), applied at all
  five skill hubs. Solo learners and staff get the browsable library.
- **The staff assistant** — one brain, two surfaces (console chat + Telegram).
  The model never touches the database: it reads a prose snapshot and returns at
  most one proposal, which a human confirms; the server then re-derives the
  caller, re-checks role and re-resolves every name through RLS.
- **Finance**: kassa, ledger, invoices, payroll with dynamic salary rules,
  branches, timetable, hand-rolled XLSX and PDF.
