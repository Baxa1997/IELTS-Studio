-- ============================================================================
-- rls_isolation_test.sql
-- Proves tenant isolation: Center A cannot read Center B's essays, and a
-- student cannot read a classmate's essay within the same org.
--
-- How to run (pick one):
--   • Supabase SQL Editor: paste this whole file and Run (executes as `postgres`).
--   • psql:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_isolation_test.sql
--
-- Everything runs inside BEGIN … ROLLBACK, so it leaves NO data behind.
-- A failed ASSERT aborts with an error (non-zero exit under ON_ERROR_STOP).
-- ============================================================================
begin;

-- ---- Seed (runs as table owner / postgres, so RLS is bypassed here) --------
insert into auth.users (instance_id, id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'admin.a@test.local'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'student.a@test.local'),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'student.a2@test.local'),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'admin.b@test.local'),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'student.b@test.local');

insert into public.organizations (id, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Center A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Center B');

insert into public.profiles (id, organization_id, role, full_name) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'center_admin', 'Admin A'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'student',      'Student A'),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'student',      'Student A2'),
  ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'center_admin', 'Admin B'),
  ('55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'student',      'Student B');

insert into public.essays (id, organization_id, student_id, task_type, content, word_count, status) values
  ('66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'task2', 'Essay by Student A', 4, 'submitted'),
  ('77777777-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'task2', 'Essay by Student B', 4, 'submitted');

-- Become a normal app user (RLS now applies). PostgREST sets these per request;
-- here we set them by hand to impersonate each user.
set local role authenticated;

-- ---- Case 1: Student A sees only their own essay, nothing from Center B -----
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
do $$
declare total int; from_b int; mine int;
begin
  select count(*) into total  from public.essays;
  select count(*) into from_b from public.essays where organization_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  select count(*) into mine   from public.essays where student_id = '22222222-2222-2222-2222-222222222222';
  assert from_b = 0, 'BREACH: Student A can read Center B essays';
  assert total = 1 and mine = 1, format('Student A should see only their own essay; total=%s mine=%s', total, mine);
  raise notice 'PASS 1: Student A sees only their own essay, none from Center B';
end $$;

-- ---- Case 2: a classmate (same org) cannot see Student A's essay -----------
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
do $$
declare visible int;
begin
  select count(*) into visible from public.essays;
  assert visible = 0, format('Student A2 must not see classmate essays; saw %s', visible);
  raise notice 'PASS 2: Student A2 cannot see classmate Student A''s essay';
end $$;

-- ---- Case 3: Center A admin sees org-A essays, still nothing from B ---------
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
do $$
declare a_rows int; b_rows int;
begin
  select count(*) into a_rows from public.essays where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  select count(*) into b_rows from public.essays where organization_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  assert a_rows = 1, format('Admin A should see Center A essays; saw %s', a_rows);
  assert b_rows = 0, 'BREACH: Admin A can read Center B essays';
  raise notice 'PASS 3: Admin A sees Center A essays only';
end $$;

rollback;  -- discards all seed data and resets role/claims
