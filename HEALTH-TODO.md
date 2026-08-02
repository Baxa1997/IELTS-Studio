# Platform Health — Work Order (handoff spec)

Written 2026-08-02 from a full audit of both repos. This is the implementation
list for the findings; work through it top-down. A reviewer will check each
task against its **Done when / Verify** lines afterward, so keep one task per
commit (or a small series) and put the task ID (e.g. `M2`) in the commit message.

Repos:
- **App** (this repo): `~/Desktop/saas/IELTS agnetic` — Next.js 16, deploys to Vercel (engprogress.com)
- **Engine**: `~/Desktop/saas/ielts-ai-engine` — FastAPI on a Contabo box behind nginx; deploys via CI on push to main

---

## HARD CONSTRAINTS — read before touching anything

1. **Never touch grading arithmetic, anchors, STRICTNESS, or the speaking
   flooring.** Grading is deliberately frozen until expert labels exist. See
   engine `docs/calibration-log.md`. This includes "obvious fixes" — a
   previous A/B showed removing the flooring makes bias worse.
2. **The `ielts-examiner` skill (`.claude/skills/ielts-examiner`) is the single
   source of truth for writing grading.** Never re-implement rules elsewhere.
3. **Fast-turn stays OFF** (`SPEAKING_FAST_TURN` empty). Do not remove the
   TEMP_QA log lines in engine `speaking/live.py` — they're awaiting owner mic
   sign-off.
4. **No speaking marketing copy anywhere** (landing, demo, SEO pages). On hold
   by owner decision.
5. **When a change spans both repos, the engine deploys BEFORE the app.**
   Design the transition so old-app + new-engine works.
6. Never call AI models from the client; all AI goes through server-side
   services with usage logging. RLS stays load-bearing; don't weaken it.
7. Don't build/surface B2B (center_admin/teacher) paths; one person per org.
8. Mobile work must not materially change desktop visuals — the listening and
   speaking surfaces are deliberately crafted. Restyle *responsively*, don't
   redesign.
9. Grader principle everywhere: calibrated and conservative; when between two
   bands, round down and name the gap.

Working rules: after every app task run `pnpm typecheck && pnpm lint && pnpm build`.
Engine tasks: create a venv, `pip install -r requirements.txt`, run
`python -m pytest tests/ -q` (tests are hermetic; they don't need GCP creds).
Don't push or deploy unless the owner says so — leave commits on a branch per
priority tier (e.g. `health/p0-mobile`, `health/p1-ops`).

---

## P0 — Model migration prep (both repos) — deadline-driven

Google has announced shutdown of **gemini-2.5-flash and gemini-2.5-pro on
2026-10-16** (Gemini API dates; Vertex usually tracks them). 2.5-flash is the
default nearly everywhere. Preview models in the critical path also have named
successors: live exam → `gemini-3.1-flash-live-preview`, TTS →
`gemini-3.1-flash-tts-preview`, replacement general line → `gemini-3.6-flash`.

### M1 — Make every model reference env-overridable and inventoried
- **Repos:** both.
- **What:** grep both repos for hardcoded `gemini-` strings outside env
  defaults (`grep -rn "gemini-" --include="*.py" --include="*.ts" | grep -v environ | grep -v env(`).
  Any hardcoded model in a runtime path becomes an env-driven constant with the
  current value as default. Known spots to check: engine `speaking/voice.py`
  (LIVE_STT / TTS voice models), `listening/tts.py`, `speaking/live.py` +
  `router.py` (LIVE_MODEL defaults), app `lib/env.ts` (already env-driven — verify
  nothing bypasses it).
- **Done when:** a single doc section (add `docs/model-inventory.md` in the
  engine) lists every model env var, its default, where it's used, and its
  announced successor.
- **Verify:** the grep above returns only env-default lines and comments/tests.

### M2 — Migration runbook + benchmark harness (no swap yet)
- **Repo:** engine.
- **What:** add `docs/model-migration-2026-10.md`: for each model var, the
  successor, the QA gate that must pass before flipping it in prod, and the
  exact command. Wire (don't run in CI) three offline gates that already exist
  or are small extensions of existing QA scripts in `scripts/qa/`:
  1. tutor brain latency battery (2.5-flash was chosen over 3.5-flash for
     2.97s vs 4.07s median — the successor must be re-measured the same way);
  2. the speaking offline battery + canary scripts pointed at the candidate
     model via env;
  3. listening/reading generation: N=10 generations through the validators,
     report reject rate vs current model.
- **Done when:** runbook exists; each gate runnable with
  `MODEL_ENV=... python scripts/qa/<script>.py`; nothing in prod changed.
- **Verify:** dry-run each script with the CURRENT models (needs ADC — if no
  GCP creds locally, verify argument parsing + document that the owner runs
  them on the box).
- **Owner decision (do not decide for them):** when to flip each env on the box
  and on Vercel.

---

## P0 — Mobile responsiveness of core practice screens (app)

Root cause: the runners are styled with inline `style={{}}` objects and fixed
pixel widths (e.g. `width: 900px` in the listening client, `width: 1024px` +
fixed 316/356px panels in the writing studio, fixed 340-380px panels in
read/cefr, inline `gridTemplateColumns` two-pane layouts). Inline styles can't
respond to breakpoints, so phones get a shrunken desktop layout.

**Approach for all four tasks (keep it mechanical, low-risk):**
- Do NOT rewrite components or move logic. Convert layout-critical inline
  styles to scoped CSS classes with media queries (each screen may get its own
  `<style>` block or CSS module — the multilevel client and listening client
  already use a scoped `<style>` for exactly this reason, follow that pattern).
- Fixed px containers → `min(100%, Npx)` / `maxWidth` + `width: 100%`.
- Two-pane `gridTemplateColumns: "1fr Npx"` → single column stacked (or tabbed
  where a pane is a tool panel) under 768px.
- Fixed side panels → bottom sheets or collapsible sections under 768px.
- Font sizes/paddings may shrink slightly on mobile but keep desktop pixel-identical.
- Touch targets ≥ 40px on mobile for answer options, tab bars, submit buttons.
- **Acceptance for every screen:** at 375×667 and 390×844 — no horizontal page
  scroll, every control reachable and tappable, timer always visible, text
  inputs usable with the keyboard open; at ≥1280px — visually unchanged
  (compare screenshots before/after).
- **Verify with real screenshots** (e.g. `pnpm dev` + Playwright or a browser
  MCP at those viewports), not by reading code. Save before/after screenshots
  to a `._mobile-audit/` folder (gitignored) so the reviewer can compare.

### R1 — Writing surfaces
Files: `app/(studio)/write/writing-studio.tsx` (849 lines, 113 inline styles),
`app/(shell)/write/library.tsx`, `components/writing/essay-feedback.tsx`,
`app/(studio)/activities/essay/[id]` views, `app/grade/grader.tsx`.
Writing studio notes: the editor is the product core — on mobile the notes/plan
side panel (fixed 316/356px) must collapse; autosave/timer bar stays pinned.

### R2 — Reading surfaces
Files: `app/(studio)/read/test/[id]/test-runner.tsx`,
`app/(studio)/read/[id]/reading-runner.tsx`,
`app/(studio)/read/_shared/question-groups.tsx` (590 lines — shared by both
runners, biggest leverage), `_shared/coach-panel.tsx`, `_shared/word-lookup.tsx`,
`app/(shell)/read/read-hub.tsx`.
Reading runner note: passage | questions two-pane must become the standard
mobile exam pattern — passage and questions as switchable tabs (or stacked with
a sticky part/question nav). Question navigation palette must not overflow.

### R3 — Listening surface
Files: `app/(shell)/listen/listening-client.tsx` (5,181 lines, 209 inline
styles, has 2 @media already — extend that pattern), results views under
`app/(shell)/listen/results/`.
Notes: audio player controls + question sheet stacked; the `width: 900px` /
`760px` containers become fluid; number-pad/word inputs sized for touch.

### R4 — Speaking + CEFR surfaces
Files: `app/(shell)/speak/speaking-client.tsx`, `live-mock.tsx` (948),
`tutor-room.tsx` (1,267, 150 inline styles, maxWidth 1180 shell),
`app/(shell)/speak/report.tsx`, `listen-back.tsx`,
`app/(shell)/cefr/multilevel-client.tsx` (1,949 — reading paper two-pane +
writing editor), `app/start/start-wizard.tsx`, `app/(app)/vocabulary/vocabulary-list.tsx`.
Speaking note: mic/permission UI and the live transcript panel must work
one-handed portrait; test on iOS Safari if possible (getUserMedia differs) —
if no device available, note that the owner must do the final phone pass.

---

## P1 — Quick wins and hardening

### F1 — Font consolidation (app)
Current: 8 families / 45 woff2 / 908 kB. Measured usage: Hanken Grotesk in 59
files and Newsreader in 45 (true global pair); Geist + Geist Mono loaded
globally from `app/layout.tsx` but used in only 1-2 files; DM Sans (5 files,
listening), Bricolage/Jakarta (4 each) + JetBrains `--font-mono-data` (3)
(speaking) are surface-scoped but loaded for EVERY shell page via
`app/(shell)/layout.tsx`.
- **What:**
  1. Root layout loads Hanken + Newsreader as the global pair; delete Geist /
     Geist Mono entirely (repoint the 1-2 `--font-geist-*` usages, incl.
     `globals.css`, to the Hanken/mono vars).
  2. Move DM Sans out of the shell layout into the listening route segment
     only; move Bricolage + Jakarta + JetBrains into the speak segment only
     (pattern: load `next/font` inside the segment's own layout or the client's
     wrapper — `app/(shell)/cefr/multilevel-client.tsx` already demonstrates
     scoped loading).
  3. Trim weights nobody uses: for each family, grep rendered
     `fontWeight`/classes and drop unloaded weights (esp. 800s and Newsreader
     italic weights) — keep what's actually rendered.
  4. Landing (`app/page.tsx`, `app/demo/page.tsx`) keeps its own set — already
     route-scoped, just trim weights the same way.
- **Do NOT change which family renders on any surface** — this task changes
  loading, not look.
- **Done when:** a shell page (e.g. /dashboard) requests ≤ ~16 font files /
  ≤ ~400 kB (check the Network tab or `.next/static/media` mapping); /listen
  additionally loads DM Sans; /speak additionally loads its three.
- **Verify:** screenshot diff on dashboard, /listen, /speak/tutor, landing —
  identical rendering; build passes.

### F2 — Middleware: local JWT verification (app)
`lib/supabase/middleware.ts` calls `supabase.auth.getUser()` — a network hop to
Supabase Auth on EVERY matched request incl. prefetches; every page is dynamic
SSR, so this is a per-click TTFB tax.
- **What:** switch to `supabase.auth.getClaims()` (verifies the JWT locally
  against Supabase's published JWKS when the project uses asymmetric signing
  keys; falls back to a network call otherwise). Update `@supabase/ssr` +
  `@supabase/supabase-js` to latest minor first. Keep the redirect/cookie
  logic identical.
- **Owner action (document, don't attempt):** enable asymmetric JWT signing
  keys in the Supabase dashboard (Project Settings → JWT keys → migrate). The
  code path must work BOTH before and after that flip.
- **Done when:** middleware does zero network calls for a request with a valid
  asymmetric-signed JWT; auth behavior unchanged (expired token → refresh path
  still works; sign-out still kills access).
- **Verify:** unit-style check of isPublicPath unchanged; manual: sign in, load
  /dashboard, navigate 5 pages, confirm no /auth/v1/user calls in the network
  log (after owner flips keys); sign-out + back-button shows sign-in.

### S1 — WebSocket auth token out of the query string (engine + app)
Supabase JWTs currently ride in `?token=` on `/speaking/live` and
`/speaking/tutor/live` (engine `speaking/router.py`) — nginx access logs on the
box record full query strings, so live bearer tokens are being written to disk.
- **What (transition-safe, engine first):**
  1. Engine: accept the token ALSO via `Sec-WebSocket-Protocol` (browser WS
    supports subprotocols: send `["bearer", <jwt>]`, engine echoes `bearer`
    back as the accepted subprotocol). Keep `?token=` working (old app).
  2. App: switch its WS clients (`live-mock.tsx`, `tutor-room.tsx`,
    `speaking-client.tsx` — wherever `new WebSocket` builds the URL) to the
    subprotocol carry; stop putting the token in the URL.
  3. Add a note in the runbook: after both are deployed, `?token=` support can
    be removed in a later engine release.
- **Done when:** new app builds carry no token in any WS URL; engine handles
  both forms; `python -m pytest tests/` green.
- **Verify:** engine unit test for both auth carries; manual WS connect via
  wscat/browser with subprotocol works; nginx access log line for a new
  connection shows no token.

### S2 — Cap concurrent live sessions (engine)
One uvicorn worker; each live exam/tutor session does in-process audio work and
spends real money. There is currently no ceiling.
- **What:** module-level counter + env `MAX_CONCURRENT_LIVE` (default ~12,
  tune later). At WS accept in `/speaking/live` and `/tutor/live`: if at
  capacity, send `{"type":"error","error":"busy","message":"All live seats are
  taken right now — try again in a minute."}` and close with a distinct code
  (e.g. 4429) BEFORE claiming quota/burning a mock. Decrement in the `finally`.
  Expose current count in `/health`.
- **Done when:** N+1th concurrent connection gets the friendly busy close;
  count never leaks (finally-safe); tests cover accept/reject/decrement.
- **Verify:** new pytest with fake sessions; `/health` shows `live_sessions`.

### S3 — Engine ops hardening (engine)
1. **Pin dependencies:** `requirements.txt` is all `>=`. Generate a pinned
   lock (`pip freeze` inside the built image → `requirements.lock.txt`, and
   Dockerfile installs from the lock). Keep the loose file as the "intent" list.
2. **Compose healthcheck:** `curl -f http://localhost:8100/health` interval 30s,
   retries 3; `restart: unless-stopped` already present.
3. **Log rotation:** docker-compose `logging: driver: json-file, max-size:
   "50m", max-file: "5"` — the box currently grows logs unbounded.
4. **/health version:** include the git SHA (bake `GIT_SHA` build-arg in the
   Dockerfile/CI) so "is the box on latest main?" is a curl, not an ssh.
5. **Error visibility:** add optional Sentry (env-gated `SENTRY_DSN`, no-op
   when unset) wired to FastAPI + the session `logger.exception` paths. If a
   DSN secret isn't available, land the code env-gated and note it for the owner.
- **Done when:** image builds from the lock; compose has healthcheck+logging;
  /health returns `{sha, live_sessions, ...}`; Sentry optional.
- **Verify:** `docker compose config` valid; local `docker build` succeeds;
  pytest green.

---

## P2 — CEFR completion (engine + app)

Researched exam format (Uzbekistan Multilevel): **Listening 6 parts / 35
questions, audio played twice (~45 min) → Reading 5 parts / 35 q (60 min) →
Writing 2 tasks (60 min) → Speaking 3 parts (~15 min)**. Score → level:
C1 65–75, B2 51–64, B1 38–50, below-B1 0–37. Today only Reading + Writing
exist (engine `multilevel/`, app `app/(shell)/cefr/`). The app-repo spec
`CEFR_MULTILEVEL_GENERATION_SPEC.md` is the authority for formats — read it
first; where this file and that spec disagree, the spec wins.

### C1 — CEFR Listening (the big one — start it as its own branch)
- **Engine:** new part specs under `docs/` (mirror the IELTS listening spec
  style), 6 part generators + deterministic validators in `multilevel/`
  (reuse `listening/` layout/validator/TTS machinery — the formats differ from
  IELTS: e.g. choose-the-correct-reply items — encode per the spec), TTS
  rendering with the existing cache, `/multilevel/listening/*` endpoints
  matching the reading ones (generate quota-gated, grade/list/render not).
  Key-soundness rule stays: grading is pure code against a stored key that a
  SEPARATE validation pass confirmed.
- **App:** third tab in the CEFR hub ("Listening paper · 6 parts · 35
  questions"), player with "played twice" behavior, grading + results view,
  attempts recorded like reading (`cefr_attempts`).
- **Done when:** a learner can generate/take/submit a full 6-part listening
  paper and see per-part results; validator reject-rate on 10 sampled
  generations documented.

### C2 — CEFR Speaking (recorded, not live — reuse Part-2 pipeline)
The real exam records answers; no interactive examiner needed. Reuse the
engine's part2 push-to-talk flow (record → transcribe → grade): 3 parts per the
spec, per-part prompts, one combined conservative grade per the multilevel
rubric (0–5 criteria like writing, NOT IELTS bands). New endpoints under
`/multilevel/speaking/`; app tab + recorder UI (reuse speak components).
- **Done when:** full 3-part recorded speaking attempt grades end-to-end.
- **Constraint:** do not touch the IELTS speaking grading path while doing this.

### C3 — Combined CEFR score + full timed mode + migration check
- Map section scores → the 0–75 composite → level (C1/B2/B1/below) per the
  official table above; show "You are B2 (57/75)" on a CEFR results surface.
- Full-exam timed mode runs L→R→W(→S) in exam order with section timers.
- Verify `cefr_attempts` (20260622 migration) is applied in prod before
  building on it; if not, flag to owner with the `supabase db push` / SQL to run.
- **Done when:** composite scoring matches the table; a full mock produces one
  CEFR level; results persist and reopen from activities.

---

## P3 — Performance completion (app)

### D1 — Code-split the monoliths
Add `next/dynamic` for below-the-fold / conditional surfaces: results + report
views inside `listening-client.tsx`, `tutor-room` report, coach panels,
`essay-feedback`, modals. Split `listening-client.tsx` (5,181 lines) into
sibling modules (player / question sheet / results / review) — mechanical
extraction, no behavior change. Same for `multilevel-client.tsx` while touching
it in R4/C-tasks.
- **Verify:** route JS for /listen drops measurably (compare
  `.next/static/chunks` before/after); all flows still work.

### D2 — First-paint data from the server
For screens that skeleton-then-fetch on mount (dashboard coach, vocabulary
list, write library, read hub): fetch the first screenful in the server
component and pass as props; keep client fetches for interactions only.
- **Verify:** loading these pages shows content on first paint without the
  intermediate skeleton→refetch flash (throttled network check).

### D3 — Asset hygiene
- Delete repo-root strays: `mit3d.png` (1.7 MB, referenced nowhere),
  `columb.png`, `harvard.png`, `mit34.png`, `stanford.png` (root copies only —
  the `public/` copies ARE used by `app/page.tsx:779`; keep those).
- Recompress `public/link-preview.png` (744 kB) to < 150 kB (1200×630 JPEG/WebP
  — check OG scrapers accept WebP; JPEG is safest).
- Landing logos: serve via `next/image` (currently the only raw `<img>` area)
  or at least explicit width/height + lazy.

### D4 — Dependency batch (low risk)
`pnpm update` within semver: next 16.2.12, react 19.2.8, tailwind 4.3.3,
supabase minors, etc. Then `@google/genai` 2.8→2.15 and `@base-ui/react`
1.5→1.6 individually (read changelogs; base-ui had breaking-ish minors before).
- **Verify:** typecheck + lint + build + click-through of write/read/listen.

---

## V — Verification / owner-action checklist (no code, but must be confirmed)

- **V1:** Prod DB has `20260721120000_skill_listening_speaking.sql` applied
  (dashboard L/S band cards depend on it) and `20260622120000_cefr_attempts.sql`.
  Check via Supabase dashboard/SQL; report back which are missing.
- **V2:** Contabo box runs latest engine main (after S3.4 this is
  `curl /health` → sha vs `git rev-parse origin/main`).
- **V3:** Vercel env: what is `GEMINI_GRADE_MODEL` actually set to? (Code
  default is gemini-2.5-flash; comments imply Gemini 3 Pro intended.) Also
  confirm `GEMINI_GENERATE_MODEL`/`GEMINI_FAST_MODEL` values so the M1
  inventory reflects prod reality, not defaults.
- **V4 (owner-only, standing):** rotate the Supabase service_role key and the
  Contabo root password (both were exposed in a chat once). Deploys use the
  SSH key, so rotation is safe.
- **V5:** Confirm Vertex-side deprecation dates for gemini-2.5-flash /
  2.5-pro / the live + TTS previews (Google Cloud release notes) — the
  2026-10-16 date is from the Gemini API page.

---

## Review protocol (for the follow-up check)

Per task: reviewer will (a) read the diff for scope creep against the HARD
CONSTRAINTS, (b) re-run the audit measurements — responsive-prefix/media-query
greps and 375px screenshots for R-tasks, font file count/bytes for F1, network
log for F2/S1, pytest + compose config for S-tasks, bundle sizes for D1 —
and (c) run `pnpm typecheck && pnpm build` / `python -m pytest`. Leave branches
unmerged; the reviewer merges after pass.
