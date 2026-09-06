# Dashboard Refactoring Plan

Date: 2026-09-06

## Scope

This document covers the authenticated student dashboard, application shell, sidebar navigation, assignments, quotas, notifications, and center console navigation.

The goal is to make authenticated navigation feel immediate, reduce database work, prevent unbounded data loading, and keep dashboard results correct as user history grows.

## Executive summary

The dashboard is slow because the page request performs too much work before rendering:

- Dashboard reads trigger estimate recalculation and database writes.
- Historical records are loaded without practical limits.
- Sidebar links disable Next.js prefetching.
- The application shell waits for quotas, notifications, assignments, and navigation counts.
- Console layouts load global form data even when the current page does not need it.
- Navigation and shell state are duplicated across route groups.
- Several client components hydrate more UI than is immediately interactive.

## Critical fixes

### P0 — Isolate speaking history by student

File: `lib/dashboard/load.ts`

The speaking dashboard query filters by `mode` and `state`, but does not filter by `student_id`.

Required fix:

```ts
supabase
  .from("speaking_sessions")
  .select("result, started_at")
  .eq("student_id", studentId)
  .eq("mode", "full")
  .eq("state", "graded")
```

Required verification:

- Student A cannot receive Student B's speaking history.
- RLS policies are tested independently of application filters.
- Dashboard aggregates are scoped by both `student_id` and `organization_id` where appropriate.

### P0 — Do not mutate data during dashboard rendering

File: `lib/dashboard/load.ts`

`loadDashboard()` currently calls `refreshDerivedEstimates()` before reading dashboard data. This means a normal page view can perform historical calculations and writes.

Required change:

- Recalculate estimates when a submission is graded.
- Or use a background job or queue.
- Or refresh only when the estimate is stale.
- Keep dashboard rendering read-only.

The dashboard should never need service-role writes just to display a page.

## Navigation and shell performance

### P1 — Replace global `prefetch={false}`

File: `components/app-shell/sidebar-nav.tsx`

All sidebar links explicitly disable prefetching. This makes every menu click wait for a new server request.

Recommended policy:

- Prefetch common, lightweight routes.
- Do not prefetch expensive finance, reporting, or large admin pages automatically.
- Use hover or intent-based prefetching for selected routes.
- Keep the pending indicator, but make it supplemental rather than the only feedback.

Common routes that should normally feel instant:

- Dashboard
- Assignments
- Groups
- Students
- Reading
- Writing
- Listening
- Speaking

### P1 — Render the shell before secondary data

File: `app/(app)/layout.tsx`

The shell currently waits for several data sources:

- Study plan
- Navigation counts
- Group membership count
- Usage quotas
- Notifications
- Cookies
- Full assignment data for the pending badge

Required architecture:

1. Authenticate the user and render the basic shell.
2. Render the primary navigation immediately.
3. Load counts, quotas, notifications, and assignment badges independently.
4. Show small skeletons or placeholders for secondary data.

### P1 — Replace full assignment loading with a badge query

File: `lib/assignments/student.ts`

The shell only needs the number of unfinished assignments, but currently loads all assignments and related attempts.

Create a dedicated function:

```ts
countPendingAssignments(studentId: string): Promise<number>
```

Load the complete assignment list only on `/assignments`.

Additional fixes:

- Add pagination to assignment history.
- Query only the fields required for the current screen.
- Run lesson-attempt queries in parallel.
- Ensure completion is tracked by assignment identity when the same content can be assigned more than once.

### P1 — Keep one authenticated shell

The `(app)` and `(shell)` route groups can remount the application rail when users move between dashboard and learning hubs.

Recommended structure:

```text
app/
  (protected)/
    layout.tsx
    dashboard/
    console/
    read/
    write/
    listen/
    speak/
```

Full-screen exam runners can remain outside the shared shell.

## Dashboard data loading

### P1 — Replace unbounded history queries

File: `lib/dashboard/load.ts`

The dashboard currently loads all available records for:

- Essays
- Gradings
- Reading attempts
- Listening attempts
- Speaking sessions

It then performs aggregation in JavaScript.

Required change:

- Query only the data required for the dashboard.
- Use database-side aggregation or RPC functions.
- Return a small dashboard view model.
- Limit recent history to the records shown on screen.
- Calculate streaks and weak areas using bounded or precomputed data.

Suggested dashboard RPC response:

```text
current_estimates
weakest_writing_criterion
weakest_reading_type
streak_days
recent_history
recommendation
```

### P1 — Select the latest grading in SQL

The current implementation loads all gradings and keeps the latest grading per essay in a JavaScript `Map`.

Replace this with:

- A window-function query.
- A database view.
- Or an RPC that returns the latest grading per essay.

Recommended index:

```text
gradings(essay_id, created_at DESC)
```

### P1 — Consolidate weekly task counts

File: `lib/plan/service.ts`

`countTasksThisWeek()` performs multiple separate count queries and includes sequential work.

Replace it with one RPC or one aggregate view returning:

```text
writing
reading
listening
speaking_mock
speaking_practice
total
```

The week boundary must use the same timezone policy as the dashboard UI.

### P1 — Avoid repeated quota organization queries

File: `lib/quota.ts`

`getUsageSummary()` loads the organization and then each quota function loads the organization again.

Refactor the quota functions to share one loaded organization and one admin client.

Recommended behavior:

- Load organization configuration once.
- Run independent usage counts in parallel.
- Cache the summary briefly.
- Refresh after actions that change usage.

### P1 — Defer notifications

File: `lib/notifications/load.ts`

Notifications are loaded before the shell is rendered.

Recommended behavior:

- Render the shell first.
- Load the unread badge independently.
- Cache the badge briefly.
- Load the notification list when the menu opens or when the notifications page is visited.

## Console performance

### P1 — Remove global datasets from the console layout

File: `app/(app)/console/layout.tsx`

The console layout currently loads groups, teachers, branches, rooms, finance settings, subjects, and teacher-subject mappings even when the current route does not use them.

Required change:

- Keep the console layout responsible for chrome only.
- Load enrollment data when the enrollment panel opens.
- Load teacher data on teacher and group pages.
- Load finance settings only inside finance routes.
- Dynamically load large panels when opened.

### P1 — Replace navigation count calculations with one lightweight query

File: `lib/console/nav.ts`

Current navigation counts download or inspect more data than necessary, including organization profiles and up to 500 notifications.

Create an RPC or database view that returns all permitted counts:

```text
groups
teachers
students
marking
new_work
```

Recommended improvements:

- Use database counts instead of downloading rows.
- Count distinct students in SQL.
- Cache counts briefly.
- Load marking counts only for roles that can access marking.

## Client-side bundle and hydration

### P2 — Lazy-load the dashboard coach

File: `app/(app)/dashboard/dashboard-coach.tsx`

The coach is interactive but is not required to view dashboard results.

Recommended change:

- Render a lightweight launcher.
- Dynamically import the chat panel when opened.
- Avoid hydrating chat logic during the initial dashboard render.

### P2 — Reduce the application shell client boundary

Files:

- `components/app-shell/shell.tsx`
- `components/app-shell/sidebar-nav.tsx`
- `components/console/console-chrome.tsx`

Keep only interaction-heavy features client-side:

- Mobile drawer state.
- Collapse toggle.
- Profile menu.
- Notification dropdown.
- Console panel state.

Keep navigation structure and static markup server-rendered wherever possible.

### P2 — Move repeated dashboard styles into reusable CSS

File: `app/(app)/dashboard/page.tsx`

The dashboard contains many inline style objects and injects `DASH_CSS` during rendering.

Recommended change:

- Move shared dashboard styles into a route-owned stylesheet or CSS module.
- Use reusable card, typography, grid, and spacing classes.
- Keep dynamic values inline only when they are genuinely data-driven.

## Data safety and scaling

### P1 — Add and verify indexes

Verify indexes for:

```text
speaking_sessions(student_id, mode, state, started_at)
reading_attempts(student_id, status, created_at)
listening_attempts(student_id, created_at)
essays(student_id, created_at)
gradings(essay_id, created_at DESC)
assignments(group_id, created_at)
notifications(read_at, created_at)
```

Use `EXPLAIN ANALYZE` for the dashboard and console queries before and after adding indexes.

### P2 — Standardize time handling

Current dashboard features use different date calculations for:

- Streaks.
- Weekly goals.
- Week dots.
- Center schedules.

Create a shared date service that defines:

- Storage timezone: UTC.
- Display timezone: organization or user timezone.
- Week start.
- Exam-day calculation.
- Streak-day calculation.

## UX and professional quality

### P1 — Make loading states consistent

Every authenticated route should have:

- Immediate navigation feedback.
- Stable shell and sidebar.
- Page-specific skeleton.
- Clear retry state for failed data.
- No blank page while a query is pending.

### P1 — Do not display query failures as empty data

Loaders that convert errors into empty arrays make a broken page look like a valid empty state.

Use typed results:

```ts
type LoaderResult<T> =
  | { data: T; error: null }
  | { data: null; error: AppLoadError };
```

Show clear error messages and retry actions.

### P2 — Simplify the visual shell

The dashboard, console, Practice AI, assistant, and studio surfaces currently require several route-specific layout exceptions.

Create shared tokens and components for:

- Page headers.
- Cards.
- Buttons.
- Tables.
- Empty states.
- Loading states.
- Error states.
- Spacing and typography.

Special full-screen learning experiences should remain separate, but normal authenticated pages should feel like one product.

## Implementation order

### Phase 0 — Security and measurement

1. Add the missing speaking `student_id` filter.
2. Review speaking-session RLS policies.
3. Add dashboard isolation tests.
4. Capture baseline TTFB, RSC size, query count, hydration time, and route transition time.

### Phase 1 — Fast navigation

1. Create a shared protected shell.
2. Remove global `prefetch={false}`.
3. Render the shell before secondary data.
4. Replace full assignment loading with a pending-count query.
5. Add independent Suspense boundaries.

### Phase 2 — Dashboard data path

1. Remove writes from dashboard rendering.
2. Move estimate refresh to submission events or background work.
3. Replace unbounded history queries with bounded database aggregates.
4. Consolidate weekly counts.
5. Add and verify indexes.

### Phase 3 — Console

1. Remove global panel datasets from the console layout.
2. Load panel data on demand.
3. Replace navigation counts with one lightweight RPC.
4. Add pagination to large lists.

### Phase 4 — UI and hydration

1. Lazy-load the study coach.
2. Reduce client shell boundaries.
3. Standardize loading and error states.
4. Consolidate styles and design tokens.

## Acceptance criteria

- Common menu clicks show feedback immediately.
- Dashboard shell renders before secondary counts and quotas.
- Dashboard requests perform no database writes.
- Student dashboards contain only the current student's activity.
- Dashboard queries remain fast with large histories.
- Console routes do not load unused enrollment or finance data.
- Back and forward navigation reuse the application shell.
- Empty, loading, and error states are visually distinct.
- Dashboard and console use consistent spacing, controls, typography, and feedback.
