-- ============================================================================
-- 20260812140000_class_capacity.sql
-- How many seats a class has.
--
-- A SOFT LIMIT, DELIBERATELY. The app warns when a class is full and keeps
-- letting you add — because a center that has agreed to squeeze a nineteenth
-- student into an eighteen-seat room will do it whatever the software says, and
-- a hard block just means they stop recording the truth. A number nobody can
-- exceed becomes a number nobody maintains.
--
-- Nullable: a class with no stated capacity is not "capacity zero", it is a
-- class nobody has bothered to size. Those two must not look the same.
-- ============================================================================

alter table public.groups
  add column if not exists capacity int
    check (capacity is null or capacity between 1 and 500);

comment on column public.groups.capacity is
  'Seats in this class. Null = unsized. Advisory only — adding past it warns, never blocks.';
