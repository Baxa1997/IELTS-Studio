# Engine changes for the teacher practice flow — 2026-08-09

Two changes are needed in the **engine repo** (the self-hosted Vertex proxy on
Contabo). The browser calls it directly for reading and listening, bypassing the
Next app entirely, so neither can be done from the app side.

Both are additive. Nothing below changes an existing response shape; the app
tolerates the old shapes until the engine ships.

---

## 1. Listening — scope the library by organization

### Why

`assignments.listening_library_id` references `listening_library`. Until
migration `20260809140000` that table had no owner: it was one shared catalogue.
A teacher-generated item lives in `listening_items` (per org, per student), so
it could never be attached to a class — and copying it into the shared library
would have published one center's content to every other center.

The migration adds `listening_library.organization_id`, backfilling the existing
45 QA'd rows with a reserved id:

```
LISTENING_LIBRARY_ORG_ID = 00000000-0000-4000-8000-00000000111c
```

This mirrors reading, where the shared set already lives under
`READING_LIBRARY_ORG_ID = 00000000-0000-4000-8000-00000000111b`.

### ⚠️ The engine bypasses RLS

The engine reads `listening_library` with the **service-role key**, so row-level
security does not apply to it. Nothing in the database can stop cross-tenant
reads here — the filter has to be in the engine's own queries. **Until it ships,
every center would see every other center's cloned items.**

### What to change

Every query against `listening_library` gains the same predicate:

```sql
where organization_id in (
  '00000000-0000-4000-8000-00000000111c',   -- shared catalogue
  :caller_org                                -- the signed-in user's org
)
```

`:caller_org` is already available — the engine resolves the caller's profile
from the bearer token for quota and unlock checks.

Affected endpoints:

| Endpoint | Change |
| --- | --- |
| `POST /listening/library` | Filter the catalogue as above. A center's own clones should appear alongside the shared ones (they are legitimately theirs). |
| `POST /listening/library/render` | Reject a `library_id` whose `organization_id` is neither the shared id nor the caller's org. Return 404, not 403 — a center should not learn that another center's item exists. |

### New endpoint: promote a generated item

The app needs to turn a generated `listening_items` row into an assignable
`listening_library` row owned by the center.

```
POST /listening/promote
Authorization: Bearer <supabase access token>
Body:    { "item_id": "<listening_items.id>" }
Returns: { "library_id": "<listening_library.id>" }
```

Rules:

- Reject unless the caller's profile role is `teacher` — assigning practice is a
  teaching decision, which is the same rule `assignPractice` enforces app-side.
- Reject unless the item belongs to the caller's organization.
- Copy `part`, `topic`, `difficulty` and `content` into `listening_library`
  with `organization_id = caller_org`, `active = true`, and
  `source_item_id = item_id`.
- **Audio must keep working.** The item's manifest points at storage paths under
  the per-student prefix, not `listening-audio/library/<id>/…`. Either copy the
  objects to the library prefix and rewrite the manifest, or leave the paths as
  they are and make sure `library/render` signs whatever path the manifest
  carries. The second is less work and less storage; pick one deliberately, and
  say which in the response docstring, because a stale assumption here produces
  an item that renders with silent audio.
- Idempotent on `source_item_id`: promoting twice returns the first library row
  rather than creating a duplicate.

---

## 2. Reading — accept a level and a topic, and return enough for a card

### Why

`POST /reading/next` currently takes **no body**. The target band is derived from
the caller's own `skill_estimates`. That is right for a learner and meaningless
for a teacher: they have a class, not a band, so today every teacher-generated
passage is pitched at the same fallback.

It also returns only `{ id }`, so the app cannot show the result as a card — it
has nothing to render — which is why reading still throws the teacher straight
into the runner.

### What to change

```
POST /reading/next
Body (all optional, unchanged behaviour when absent):
  {
    "target_band": 4 | 5 | 6 | 7 | 8 | 9,
    "topic": "urban transport"        // free text, ≤ 50 chars
  }
Returns:
  {
    "id": "<reading_tests.id | reading_passages.id, as today>",
    "title": "…",                     // NEW
    "excerpt": "…",                   // NEW — first ~240 chars of the passage
    "target_band": 7,                 // NEW — what it was actually pitched at
    "question_count": 13              // NEW
  }
```

- `target_band` overrides the estimate-derived pitch. Absent → today's behaviour
  exactly, so the learner path is untouched.
- `topic` steers the passage subject. This is the same idea as writing's
  `topicFamily`, which the composer already accepts as free text — worth keeping
  the two consistent rather than inventing a second vocabulary.
- The four new response fields let the app render a card with Start and Attach
  instead of navigating. They are additive; the app reads them defensively and
  falls back to a generic card if they are missing.

Apply the same body to `POST /reading/test` if a teacher should be able to pitch
a full 3-passage test — same field names.

---

## Order to ship

1. Apply `20260809140000_listening_library_org.sql`.
2. Ship the engine's listening filter **in the same window** — between the two,
   clones would be cross-visible. (There are no clones yet, so the window is
   safe today; it stops being safe the moment `/listening/promote` exists.)
3. Then `/listening/promote`, then the reading body.

The app side of each is gated behind whether the endpoint answers, so shipping
the engine first is always safe.
