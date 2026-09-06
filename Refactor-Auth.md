# Authentication and Authorization Refactoring Plan

Date: 2026-09-06

## Scope

This document covers authentication, session resolution, protected route layouts, organization membership, role checks, RLS boundaries, redirects, and authenticated performance.

The goal is to keep user data isolated, avoid repeated authentication work, make authorization rules explicit, and prevent authentication from slowing every protected page.

## Executive summary

The current authentication foundation is generally structured around a request-scoped cached session, but it is spread across several layouts and route groups.

The main risks are:

- Authorization correctness depends on both application filters and RLS.
- Some dashboard queries are missing explicit student scoping.
- Protected layouts load a large amount of user-specific data before rendering.
- Role logic is duplicated between navigation, layouts, and pages.
- Several routes are forced dynamic, limiting caching and making every navigation more dependent on server latency.
- Public and authenticated concerns need a clearer separation.

## Critical security fixes

### P0 — Enforce user scoping in every dashboard query

File: `lib/dashboard/load.ts`

The speaking history query does not include `student_id` filtering.

Application-level filters and RLS should both protect the data. The query must explicitly include:

```ts
.eq("student_id", studentId)
```

Required tests:

- Student A sees only Student A's speaking sessions.
- Student B sees only Student B's speaking sessions.
- A student cannot access another student's dashboard by changing a URL or request payload.
- RLS denies direct access to another student's records.

### P0 — Audit RLS policies against application assumptions

Review policies for:

- `speaking_sessions`
- `essays`
- `gradings`
- `reading_attempts`
- `listening_attempts`
- `speaking_attempts`
- `skill_estimates`
- `assignments`
- `notifications`
- `group_members`
- `profiles`

For each table, document:

1. Who can select rows.
2. Who can insert rows.
3. Who can update rows.
4. Who can delete rows.
5. Whether organization scope is enforced.
6. Whether teacher scope is restricted to assigned groups.

No page should rely on a missing application filter as its only protection.

## Session and identity handling

### P1 — Keep one canonical session resolver

File: `lib/auth.ts`

`getSession()` is request-scoped through React `cache()`, which is good and should remain the canonical identity resolver.

Required rules:

- Use `getSession()` for identity resolution.
- Use `requireOrgUser()` for protected organization routes.
- Use `requireSuperAdmin()` for platform admin routes.
- Do not call Supabase Auth directly inside individual pages.
- Do not duplicate profile and organization queries in page components.

The session object should be the single source of truth for:

- User ID.
- Organization ID.
- Role.
- Organization kind.
- Organization status.
- Display name and contact label.

### P1 — Separate authentication from authorization

Authentication answers:

```text
Who is this user?
```

Authorization answers:

```text
What may this user do in this organization and route?
```

Create explicit capability helpers such as:

```ts
canViewStudents(profile)
canManagePeople(profile)
canManageBilling(profile)
canManageFinance(profile)
canMarkAttendance(profile)
canReviewMarking(profile)
```

Avoid scattered checks such as:

```ts
profile.role === "center_admin"
profile.role !== "teacher"
```

Capability helpers prevent new roles from being accidentally included or excluded.

### P1 — Treat organization status as a route guard

The current session resolver checks organization approval status and redirects inactive organizations.

Keep this behavior centralized and test:

- Pending organization.
- Rejected organization.
- Suspended organization.
- Active organization.
- Personal organization.
- Center organization.

Ensure inactive organizations cannot access data routes through direct URLs, server actions, or API routes.

## Protected layout architecture

### P1 — Create a shared protected layout

Current authenticated layouts are split across `(app)`, `(shell)`, and nested console layouts.

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
  (studio)/
    ...full-screen runners...
```

The protected layout should own:

- Session guard.
- Organization guard.
- Stable application shell.
- Basic profile data.
- Common navigation.

Feature routes should own their feature-specific data.

### P1 — Do not block the shell on secondary authenticated data

The protected layout should not wait for:

- Quotas.
- Notification lists.
- Assignment history.
- Console modal datasets.
- Large navigation counts.

Recommended render order:

1. Resolve the session.
2. Verify organization status.
3. Render the stable shell.
4. Load secondary user data behind Suspense or client requests.

### P1 — Avoid duplicate authorization work in nested layouts

Nested layouts may call the same session helper, which is request-cached, but the architecture still makes authorization responsibilities unclear.

Recommended rule:

- Perform the main guard in the protected layout.
- Use feature capability checks for specific routes.
- Keep nested layouts focused on feature composition.

If a nested route requires a stronger permission, use a dedicated guard such as `requireCapability()`.

## Middleware and public routes

### P1 — Keep public pages separate from authenticated work

The public homepage should not perform unnecessary authenticated profile work.

Recommended behavior:

- Middleware should perform only the minimum cookie/session work needed for protected routes.
- Public marketing pages should remain static or ISR-cached.
- Authenticated redirects should happen through a separate authenticated entry path or a minimal edge check.
- Do not query profile and organization data for anonymous public visitors.

### P1 — Review middleware matcher scope

Confirm that middleware does not execute expensive Supabase calls for:

- Static assets.
- Public marketing pages.
- Public legal pages.
- Images.
- Fonts.
- Public API endpoints that do not require a user session.

The matcher should be intentionally narrow and documented.

## Role and organization boundaries

### P1 — Formalize role capabilities

Document the permissions for:

| Capability | Center admin | Administrator | Teacher | Student | Super admin |
|---|---:|---:|---:|---:|---:|
| View organization dashboard | Yes | Yes | Scoped | No | No |
| Manage teachers | Yes | Configured | No | No | No |
| Manage groups | Yes | Yes | Scoped | No | No |
| View students | Yes | Yes | Scoped | Self | No |
| Manage finance | Yes | No | No | No | No |
| View own learning data | No | No | No | Yes | No |
| Manage platform centers | No | No | No | No | Yes |

The exact matrix should be confirmed against the product rules and encoded in capability helpers and tests.

### P1 — Enforce teacher scope consistently

Teachers must be scoped to their own groups for:

- Students.
- Assignments.
- Attendance.
- Reports.
- Marking queues.
- Notifications.

Review every teacher-facing loader for accidental organization-wide reads.

### P1 — Keep organization scope in server queries

Even when RLS is present, include organization scope in server-owned queries when the table supports it.

This improves:

- Defense in depth.
- Query planning.
- Auditability.
- Protection against future policy changes.

## Server actions and API routes

### P1 — Apply the same guards to mutations

Every server action and API route must independently validate:

1. Authenticated session.
2. Organization status.
3. Required capability.
4. Target organization or resource scope.
5. Input schema.

Do not rely on the page that calls an action to provide authorization.

### P1 — Validate IDs and ownership before mutation

For actions involving:

- Groups.
- Students.
- Assignments.
- Essays.
- Speaking sessions.
- Billing.
- Finance records.

Confirm that the target record belongs to the authorized organization or group before changing it.

### P2 — Standardize unauthorized responses

Use consistent behavior:

- Redirect unauthenticated browser requests to sign-in.
- Return `401` for unauthenticated API requests.
- Return `403` for authenticated users without permission.
- Return `404` when resource existence should not be disclosed.

Avoid silently returning empty data for authorization failures.

## Redirect and session safety

### P1 — Keep redirect validation centralized

File: `lib/auth.ts`

Continue using a safe in-app path validator for `next` redirects.

Required tests:

- Reject external URLs.
- Reject protocol-relative URLs.
- Reject auth-loop destinations.
- Allow valid internal paths.
- Fall back safely when the value is invalid.

### P2 — Avoid synthetic contact information in the UI

The contact label helper correctly avoids showing synthetic authentication email addresses for center-created accounts.

Keep this rule centralized and test:

- Real contact email is displayed when available.
- Username is shown when no real email exists.
- Synthetic auth addresses are never displayed as contact addresses.

## Authentication performance

### P1 — Measure authentication separately from page data

Track these timings independently:

- Middleware time.
- `auth.getUser()` time.
- Profile and organization query time.
- Protected layout time.
- Feature page query time.
- Time until shell appears.

This identifies whether a slow route is caused by authentication, layout data, or the page itself.

### P1 — Avoid unnecessary dynamic rendering

Many authenticated routes are marked `force-dynamic`. Authentication naturally makes protected pages dynamic, but not every nested component needs to force a fresh server render.

Recommended approach:

- Keep authentication checks dynamic where required.
- Cache safe organization metadata briefly.
- Cache non-sensitive navigation summaries briefly.
- Use targeted invalidation after mutations.
- Do not cache user-specific data without a user-scoped cache key.

### P2 — Use request-scoped memoization for shared loaders

Where multiple components need the same request data, use request-scoped caching for:

- Session.
- Organization metadata.
- Capability resolution.
- Shared navigation state.

Do not use a global cache for user-specific objects unless the cache key includes the authenticated user and organization.

## Testing plan

### Identity isolation tests

- Student A cannot read Student B's dashboard data.
- Student A cannot access Student B's speaking sessions.
- Student A cannot modify another student's estimates.
- A teacher cannot access an unrelated group's roster.
- A teacher cannot access organization-wide finance data.

### Role tests

- Center admin permissions.
- Administrator permissions.
- Teacher permissions.
- Student permissions.
- Super admin permissions.

### Organization status tests

- Pending center.
- Rejected center.
- Suspended center.
- Active center.
- Personal organization.

### Redirect tests

- Valid internal `next` path.
- External URL.
- Protocol-relative URL.
- Auth route loop.
- Missing `next` parameter.

### Mutation tests

- Unauthorized server action.
- Cross-organization target ID.
- Cross-group teacher target ID.
- Invalid input.
- Expired or invalid session.

## Implementation order

### Phase 0 — Security

1. Add the missing speaking student filter.
2. Audit speaking-session RLS.
3. Audit all dashboard queries for explicit ownership scope.
4. Add identity isolation tests.

### Phase 1 — Auth architecture

1. Define the protected layout boundary.
2. Keep one canonical session resolver.
3. Formalize capability helpers.
4. Move feature authorization to centralized guards.
5. Review middleware matcher scope.

### Phase 2 — Authenticated performance

1. Render the shell before secondary user data.
2. Cache safe organization metadata briefly.
3. Replace large layout queries with deferred loaders.
4. Measure middleware, session, layout, and page timings separately.

### Phase 3 — Mutation hardening

1. Apply guards to every API route and server action.
2. Validate organization and resource ownership.
3. Standardize `401`, `403`, and `404` behavior.
4. Add cross-organization mutation tests.

## Acceptance criteria

- Every protected route has a clear authentication and authorization path.
- Every user-specific query has explicit ownership scope and suitable RLS.
- Student dashboards cannot expose another student's data.
- Teachers cannot escape their assigned group scope.
- Organization status blocks all protected data routes consistently.
- Public pages do not perform unnecessary profile queries.
- Authenticated shell appears before secondary navigation data.
- Server actions and API routes cannot be authorized only by the calling page.
- Redirect validation rejects external and unsafe destinations.
