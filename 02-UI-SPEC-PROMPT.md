# PROMPT 2 — UI/UX Specification

> Use this prompt when you want Claude to design or complete the **interface** of EngProgress Organization Mode. It assumes the domain logic from Prompt 1. Goal: make the product feel finished — every role has a complete set of pages, every number has a source, every empty state teaches the next action.

---

You are the product designer for EngProgress. The existing UI has a strong foundation: indigo/cream marketing split on auth, dark navy sidebar + serif headings (Playfair-style) in the console, green accent buttons, stat cards, honest microcopy ("Never rounds up — we name exactly what's missing"). **Keep this system exactly** — extend it, don't redesign it.

## Design system rules (extracted from current screens — enforce everywhere)

- Sidebar: dark navy `#151b2e`-ish, white logo, role badge pill next to logo (`Center admin` green outline → add `Teacher` amber, `Student` indigo, `Super admin` red variants), collapse toggle, account card pinned bottom.
- Content area: warm off-white background, white cards with 16px radius and hairline borders, serif for page titles and card headings, sans for body.
- Stat cards: big indigo number + muted label; every card must be clickable and filter the list below it (e.g. clicking "Never practised" filters the roster). This alone fixes half of the "stats feel fake" problem.
- Buttons: indigo = primary action, green = create/confirm, ghost = secondary.
- Every table: search + filters + explicit empty state with the next action as a link ("No students yet. **Open a group** and add one." — keep this pattern).
- Every async action: loading state, success toast, inline error. No silent failures.
- All pages responsive down to 360px (teachers in Uzbekistan will use phones); sidebar becomes bottom nav or drawer on mobile.
- i18n-ready: English first, structure copy so Uzbek/Russian can be added (no text baked into images).

## Pages by role

### A. Center admin (extend what exists)
1. **Dashboard** — keep the "Where to go" card, but add: usage widget (gradings used / quota, progress bar), "Recent activity" feed (teacher added, practice published, N attempts graded), and a "Setup checklist" for new centers (Add a teacher → Create a group → Add students → First practice) with checkmarks — this cures the empty-dashboard feeling.
2. **Teachers** — keep add-teacher form; add per-row actions (reset password, disable, reassign groups), and a drawer with that teacher's groups + activity.
3. **Groups** — keep create form; group row expands or navigates to a **Group detail page**: members list, assigned practices with completion %, add/remove students, change teacher.
4. **Students** — keep roster; add student drawer/page: profile, groups, band trajectory sparkline, recent attempts, reset password, move group.
5. **Reports (NEW page in sidebar)** — center-wide: group comparison table, band distribution chart, weakest criteria ranking, exportable CSV.
6. **Billing** — keep as is; wire the usage numbers to `usage_counters`; add invoice history and Payme/Click flow states.
7. **Settings (NEW)** — center name, contact email, default language, Telegram bot status.

### B. Teacher (entire surface is missing — build it)
Sidebar: Dashboard · My groups · Practices · Reports · Settings.
1. **Dashboard** — "Today" view: assignments due soon with completion bars, ungraded/failed attempts needing attention, quick actions (New practice, New group).
2. **My groups** — cards per group (member count, last activity, avg band); group detail = members + assignments tabs.
3. **Practices (library)** — the page you described: ALL the teacher's practices in one place. Tabs: Drafts / Published / Archived. Each row: module icon, title, target band, "Assigned to: Group A, Group B" chips, completion X/Y, avg band. Primary actions: **Preview**, **Assign to group…** (modal: pick groups/students, due date, attempts allowed), Duplicate, Archive.
4. **Practice builder** — two entry points: "Generate with AI" (module, topic, target band → Gemini draft → editable preview) and "Create manually". Publish button is explicit and separate from Save draft.
5. **Reports** — group selector → per-assignment completion, per-student table (band, criteria breakdown, top errors), student drill-down with full attempt history and annotated essays. "Common weaknesses" panel with plain-language findings.
6. **Settings** — password, language, **Connect Telegram** card with deep-link button and connection status.

### C. Student (entire surface is missing — build it)
Sidebar (or top-nav on mobile): Home · Practice · My results · Progress · Settings. Plus a bell icon with unread badge in the header — this is the primary notification surface (no email dependency).
1. **Home** — "Assigned to you": cards for each pending assignment (module, due date, time estimate) sorted by due date; "Continue" card if an attempt is in progress; recent results strip.
2. **Practice player** — reuse the existing individual-mode player; add assignment context bar (group name, due date, attempts left). Autosave. Submit → "Grading…" state → result.
3. **Result page** — overall band + per-criterion bands, annotated essay with error highlights from your taxonomy, "what to fix next" (top 3), link back to remaining assignments.
4. **My results** — table of all graded attempts, filter by module.
5. **Progress** — band-over-time chart per module, criteria radar, streak/practice count. Honest framing consistent with the brand ("your real band").
6. **Notifications panel** — dropdown from bell + full page: new assignment / graded / due soon; mark read; deep-link to the item.
7. **Settings** — password, language, **Connect Telegram** (same pattern as teacher).

### D. Super admin (minimal but real)
1. **Applications queue** — pending centers table: name, contact email, login, submitted date; Approve / Reject with reason; approved triggers the confirmation email.
2. **Centers list** — plan, students, teachers, gradings used, status; suspend/reactivate; impersonate.
3. **Platform stats** — totals + monthly trend of gradings, generations, active students.

## States to design explicitly for every page
Empty (with next action) · Loading (skeletons matching card layout) · Error (retry) · Quota-blocked (upgrade CTA for admins, "grading queued" notice for students/teachers) · Mobile.

**Output format when using this prompt:** page-by-page component breakdowns and copy, consistent with the existing design language. Where a current screen conflicts with this spec, prefer this spec and note the change.
