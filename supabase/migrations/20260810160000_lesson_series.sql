-- ============================================================================
-- 20260810160000_lesson_series.sql
-- The timetable's data model was lying, and this fixes it.
--
-- THE BUG. A slot stored BOTH a `weekday` and a `pattern` ('weekly' | 'odd' |
-- 'even'), which encodes the same fact twice and lets the two contradict:
--
--   weekday = Wednesday, pattern = 'even'   ← Wednesday is an ODD day
--   weekday = Tuesday,   pattern = 'odd'    ← Tuesday is an EVEN day
--
-- Both of those exist in live data. Worse, a row meaning "Mon/Wed/Fri" was
-- drawn on ONE day of the grid, so a class set to toq kunlar was invisible on
-- two of the three days it actually meets. Staff then re-added the missing
-- days by hand, which is where the duplicate rows and the phantom
-- "double-booked" warnings came from.
--
-- THE FIX. One row per day the class actually meets — what you see on the grid
-- is what is in the table — with a shared `series_id` so "Mon/Wed/Fri 15:30" is
-- still ONE thing to edit, move or delete. The app writes three rows and treats
-- them as one lesson; the grid needs no pattern arithmetic and clash detection
-- becomes a plain overlap test on a single weekday.
--
-- WHAT HAPPENS TO EXISTING ROWS. They keep their stored weekday and become
-- single-day lessons. An 'odd' row is NOT expanded into Mon/Wed/Fri: half the
-- live rows contradict their own weekday, so expanding would invent lessons
-- that were never taught. Any class that really meets three times a week gets
-- its days re-picked once, in the new form, which takes a few seconds and
-- leaves the table honest.
-- ============================================================================

-- ---------- 1. Collapse the pattern into the weekday -------------------------

update public.lesson_slots set pattern = 'weekly' where pattern <> 'weekly';

-- ---------- 2. Drop the duplicates the old model produced --------------------
-- Same class, same day, same hour, same room, twice. Keep the oldest; it is the
-- one the rest of the center has been reading off the wall.

delete from public.lesson_slots a
 using public.lesson_slots b
 where a.organization_id = b.organization_id
   and a.group_id  = b.group_id
   and a.weekday   = b.weekday
   and a.starts_at = b.starts_at
   and a.ends_at   = b.ends_at
   and a.room_id is not distinct from b.room_id
   and (a.created_at, a.id) > (b.created_at, b.id);

-- ---------- 3. A lesson that meets several days is ONE series ----------------

alter table public.lesson_slots
  add column if not exists series_id uuid;

update public.lesson_slots set series_id = id where series_id is null;

alter table public.lesson_slots
  alter column series_id set default gen_random_uuid(),
  alter column series_id set not null;

create index if not exists lesson_slots_series_idx
  on public.lesson_slots (organization_id, series_id);

comment on column public.lesson_slots.series_id is
  'Ties the days of one weekly lesson together: Mon/Wed/Fri 15:30 is three rows '
  'sharing a series_id, edited and deleted as one.';

-- ---------- 4. Make the duplicate impossible, not just unlikely --------------
-- Two partial indexes rather than one constraint, because NULL room_id would
-- otherwise be treated as distinct from itself and let unroomed duplicates
-- through — the same reason rooms needed two in 20260810140000.

create unique index if not exists lesson_slots_unique_in_room_idx
  on public.lesson_slots (organization_id, group_id, weekday, starts_at, ends_at, room_id)
  where room_id is not null;

create unique index if not exists lesson_slots_unique_no_room_idx
  on public.lesson_slots (organization_id, group_id, weekday, starts_at, ends_at)
  where room_id is null;

-- ---------- 5. Retire the pattern -------------------------------------------
-- Every row now names its own day. A column that can disagree with the row it
-- sits on is worse than no column, so it goes rather than lingering as a trap.

alter table public.lesson_slots drop column if exists pattern;
drop type if exists public.slot_pattern;
