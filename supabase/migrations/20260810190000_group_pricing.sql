-- ============================================================================
-- 20260810190000_group_pricing.sql
-- A class carries BOTH of its prices, and a month is billed by the lesson.
--
-- WHY BOTH PRICES LIVE ON THE CLASS. The center's arrangement is per class and
-- per head: "a seat in IELTS-Evening costs 400 000 a month, and the teacher
-- gets 200 000 of it per student". Those are two facts about the same class, so
-- they belong on the same row. Keeping the teacher's side only in a salary rule
-- meant the owner had to price a class in two places and keep them in step.
--
-- The salary rules (20260810120000) are NOT replaced — they stay as the
-- override for centers paying a revenue share, a base salary or a tiered rate.
-- What changes is the DEFAULT: a class with a teacher rate and no rule now pays
-- that rate, instead of paying nothing and reporting the teacher "unruled".
--
-- WHY A LESSON IS THE UNIT. A student who joins on the 12th has not had half a
-- month, they have had five of twelve lessons — and how many lessons a month
-- holds is a property of the timetable (a Mon/Wed/Fri class has ~13 in a long
-- month, ~12 in a short one), not of the calendar. So proration counts the
-- lessons the class actually meets, from `lesson_slots`, and bills the ones
-- from the student's join date onwards. Both sides of the money use the same
-- count, so a student's share and their teacher's share can never disagree.
-- ============================================================================

-- ---------- What the class costs, and what it pays ---------------------------

alter table public.groups
  add column if not exists teacher_rate_minor bigint
    check (teacher_rate_minor is null or teacher_rate_minor >= 0);

comment on column public.groups.monthly_fee_minor is
  'What one seat in this class costs a student per month, in minor units. Null = the class has never been priced and will not invoice.';
comment on column public.groups.teacher_rate_minor is
  'What the teacher earns per enrolled student per month, in minor units. Null = pay this class by a salary rule instead.';

-- ---------- The fallback denominator -----------------------------------------
-- Only used when a class has no timetable at all. A center that books its
-- lessons gets the real count; one that has not yet gets a house number rather
-- than a division by zero, and the payslip says which of the two it used.

alter table public.finance_settings
  add column if not exists lessons_per_month int not null default 12
    check (lessons_per_month between 1 and 62);

comment on column public.finance_settings.lessons_per_month is
  'Lessons assumed in a month for a class with nothing on the timetable. Real bookings always win over this.';

-- ---------- What an invoice was worked out from -------------------------------
-- Stored, not recomputed. The timetable can change after a month is billed —
-- a lesson cancelled in September must not silently re-price August's invoice.

alter table public.student_invoices
  add column if not exists lessons_billed  int check (lessons_billed  is null or lessons_billed  >= 0),
  add column if not exists lessons_planned int check (lessons_planned is null or lessons_planned >= 0);

comment on column public.student_invoices.lessons_billed is
  'Lessons this student was charged for. Fewer than lessons_planned means they joined mid-month.';
comment on column public.student_invoices.lessons_planned is
  'Lessons the class held that month. The denominator the prorated amount came from.';
