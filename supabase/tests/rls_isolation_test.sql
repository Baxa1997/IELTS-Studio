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
--
-- Cases 13-15 need migrations 20260808130000 / 140000 / 150000; case 16 needs
-- 160000 and case 17 needs 170000. Without them you get a missing-relation or
-- invalid-enum error, not a failure.
-- ============================================================================
begin;

-- ---- Seed (runs as table owner / postgres, so RLS is bypassed here) --------
-- Organizations first: every seeded auth user names one in `raw_app_meta_data`.
insert into public.organizations (id, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Center A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Center B');

-- `organization_id` in raw_app_meta_data is REQUIRED here, and is what keeps
-- this file working. The `handle_new_user` trigger fires on every auth.users
-- INSERT and, for a user it doesn't recognise, provisions a personal org and a
-- student profile — which then collides with the profiles INSERT below
-- ("duplicate key value violates profiles_pkey"). The trigger's already-
-- provisioned branch skips exactly that, and it DOES fire for rows inserted
-- directly by SQL (unlike auth.admin.createUser, which writes app_metadata only
-- after the INSERT — see 20260807200000_restore_handle_new_user.sql).
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'admin.a@test.local',   '{"organization_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'student.a@test.local',  '{"organization_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'student.a2@test.local', '{"organization_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'admin.b@test.local',    '{"organization_id":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'student.b@test.local',  '{"organization_id":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}'::jsonb);

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

-- ---- Case 4: org approval state is NOT client-writable (column grants) ------
-- The organizations_b2b migration restricts authenticated UPDATE to cosmetic
-- columns (name/slug/branding). A center_admin must not be able to approve
-- their own pending center (status) or give themselves a plan upgrade (plan).
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
do $$
begin
  begin
    update public.organizations set status = 'suspended'
     where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    raise exception 'BREACH: center_admin updated organizations.status';
  exception when insufficient_privilege then
    raise notice 'PASS 4a: organizations.status is not client-writable';
  end;

  begin
    update public.organizations set plan = 'pro'
     where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    raise exception 'BREACH: center_admin updated organizations.plan';
  exception when insufficient_privilege then
    raise notice 'PASS 4b: organizations.plan is not client-writable';
  end;

  update public.organizations set name = 'Center A (renamed)'
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  raise notice 'PASS 4c: center_admin can still rename their own org';
end $$;

-- ---- Case 5: groups are org-scoped, and rosters are staff-only --------------
-- Seed (as owner): a group in Center A owned by a teacher, plus one in B.
set local role postgres;
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data) values
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888888', 'authenticated', 'authenticated', 'teacher.a@test.local', '{"organization_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}'::jsonb);
insert into public.profiles (id, organization_id, role, full_name) values
  ('88888888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'teacher', 'Teacher A');
insert into public.groups (id, organization_id, name, teacher_id) values
  ('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Group A', '88888888-8888-8888-8888-888888888888'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Group B', null);
insert into public.group_members (group_id, student_id, organization_id) values
  ('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
set local role authenticated;

-- Teacher A: sees Center A groups only, and the full roster of their own group.
set local request.jwt.claims = '{"sub":"88888888-8888-8888-8888-888888888888","role":"authenticated"}';
do $$
declare a_groups int; b_groups int; roster int;
begin
  select count(*) into a_groups from public.groups where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  select count(*) into b_groups from public.groups where organization_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  select count(*) into roster   from public.group_members where group_id = '99999999-9999-9999-9999-999999999999';
  assert a_groups = 1, format('Teacher A should see Center A groups; saw %s', a_groups);
  assert b_groups = 0, 'BREACH: Teacher A can read Center B groups';
  assert roster = 2, format('Teacher A should see their own roster; saw %s', roster);
  raise notice 'PASS 5: Teacher A sees only Center A groups, with their own roster';
end $$;

-- Student A: sees their own group, but NOT the classmate list.
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
do $$
declare visible_groups int; visible_members int;
begin
  select count(*) into visible_groups  from public.groups;
  select count(*) into visible_members from public.group_members;
  assert visible_groups = 1, format('Student A should see only their own group; saw %s', visible_groups);
  assert visible_members = 1, format('BREACH: Student A can see classmates; saw %s membership rows', visible_members);
  raise notice 'PASS 6: Student A sees their group but only their own membership row';
end $$;

-- Student B (other tenant): sees nothing of Center A's groups.
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
do $$
declare leaked int;
begin
  select count(*) into leaked from public.groups where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  assert leaked = 0, 'BREACH: Center B student can read Center A groups';
  raise notice 'PASS 7: Center B cannot see Center A groups';
end $$;

-- ---- Case 8: assignments reach the group, and nobody else ------------------
set local role postgres;
insert into public.writing_prompts (id, organization_id, task_type, prompt_text, status)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'task2', 'Assigned prompt', 'approved');
insert into public.assignments (id, organization_id, group_id, kind, title, prompt_id)
values ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '99999999-9999-9999-9999-999999999999', 'writing', 'Week 1 essay', 'bbbbbbbb-0000-0000-0000-000000000001');
set local role authenticated;

-- The group's student sees it.
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
do $$
declare seen int;
begin
  select count(*) into seen from public.assignments;
  assert seen = 1, format('Group member should see their assignment; saw %s', seen);
  raise notice 'PASS 8: a group member sees their assignment';
end $$;

-- A student in the SAME org but not in the group sees nothing. (Student B2 is
-- Student A2 — in Center A, not in Group A after we remove them.)
set local role postgres;
delete from public.group_members
 where group_id = '99999999-9999-9999-9999-999999999999'
   and student_id = '33333333-3333-3333-3333-333333333333';
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
do $$
declare seen int;
begin
  select count(*) into seen from public.assignments;
  assert seen = 0, format('BREACH: non-member in the same org saw %s assignment(s)', seen);
  raise notice 'PASS 9: a non-member in the same org sees no assignment';
end $$;

-- A student cannot create or edit assignments.
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
do $$
declare changed int;
begin
  begin
    insert into public.assignments (organization_id, group_id, kind, title, prompt_id)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999',
            'writing', 'Self-assigned', 'bbbbbbbb-0000-0000-0000-000000000001');
    raise exception 'BREACH: a student inserted an assignment';
  exception when insufficient_privilege then
    raise notice 'PASS 10a: students cannot create assignments';
  end;

  update public.assignments set title = 'Hacked' where id = 'cccccccc-0000-0000-0000-000000000001';
  get diagnostics changed = row_count;
  assert changed = 0, 'BREACH: a student updated an assignment';
  raise notice 'PASS 10b: students cannot edit assignments';
end $$;

-- ---- Case 11: a teacher owns the groups they create, and only those --------
-- Re-add Student A2 to Group A (case 8 removed them) so the roster is real.
set local role postgres;
insert into public.group_members (group_id, student_id, organization_id) values
  ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
-- A second teacher in Center A, with their own group and their own student.
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data) values
  ('00000000-0000-0000-0000-000000000000', 'dddddddd-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'teacher.a2@test.local', '{"organization_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}'::jsonb);
insert into public.profiles (id, organization_id, role, full_name) values
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'teacher', 'Teacher A2');
set local role authenticated;

set local request.jwt.claims = '{"sub":"dddddddd-0000-0000-0000-000000000001","role":"authenticated"}';
do $$
declare owned int;
begin
  -- Allowed: create a class they own.
  insert into public.groups (organization_id, name, teacher_id)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Teacher A2 class', 'dddddddd-0000-0000-0000-000000000001');
  select count(*) into owned from public.groups where teacher_id = 'dddddddd-0000-0000-0000-000000000001';
  assert owned = 1, format('Teacher A2 should own 1 group; saw %s', owned);
  raise notice 'PASS 11a: a teacher can create their own group';

  -- Refused: hand a group to someone else (an admin-only move).
  begin
    insert into public.groups (organization_id, name, teacher_id)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Not mine', '88888888-8888-8888-8888-888888888888');
    raise exception 'BREACH: teacher created a group owned by another teacher';
  exception when insufficient_privilege then
    raise notice 'PASS 11b: a teacher cannot create a group for someone else';
  end;
end $$;

-- ---- Case 12: practice visibility follows group membership -----------------
set local role postgres;
insert into public.listening_items (id, organization_id, student_id, scope, part, topic, content) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'part', 1, 'Library tour', '{}'::jsonb);
insert into public.listening_attempts (id, organization_id, student_id, item_id, score, max_score) values
  ('ffffffff-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-0000-0000-0000-000000000001', 7, 10);
set local role authenticated;

-- Teacher A teaches Student A -> can see the listening attempt.
set local request.jwt.claims = '{"sub":"88888888-8888-8888-8888-888888888888","role":"authenticated"}';
do $$
declare seen int;
begin
  select count(*) into seen from public.listening_attempts;
  assert seen = 1, format('Teacher A should see their student listening attempt; saw %s', seen);
  raise notice 'PASS 12a: a teacher sees their own student''s listening practice';
end $$;

-- Teacher A2 teaches nobody in that group -> sees nothing.
set local request.jwt.claims = '{"sub":"dddddddd-0000-0000-0000-000000000001","role":"authenticated"}';
do $$
declare seen int;
begin
  select count(*) into seen from public.listening_attempts;
  assert seen = 0, format('BREACH: an unrelated teacher saw %s listening attempt(s)', seen);
  raise notice 'PASS 12b: a teacher cannot see another teacher''s students';
end $$;

-- The center admin sees everyone in their org.
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
do $$
declare seen int;
begin
  select count(*) into seen from public.listening_attempts;
  assert seen = 1, format('Center admin should see org listening attempts; saw %s', seen);
  raise notice 'PASS 12c: the center admin sees their whole org';
end $$;

-- And a classmate still cannot.
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
do $$
declare seen int;
begin
  select count(*) into seen from public.listening_attempts;
  assert seen = 0, format('BREACH: a classmate saw %s listening attempt(s)', seen);
  raise notice 'PASS 12d: a classmate cannot see another student''s practice';
end $$;

-- ---- Case 13: writing + reading follow the same rule as listening ----------
-- Before 20260808130000 any teacher in the org could read (and grade) any
-- student's essay. Student A is taught by Teacher A and by nobody else.
set local role postgres;
insert into public.gradings (id, organization_id, essay_id, model, overall_band, criteria)
values ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '66666666-6666-6666-6666-666666666666', 'test-model', 6.5, '{}'::jsonb);
insert into public.reading_passages (id, organization_id, title)
values ('33333333-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test passage');
insert into public.reading_attempts (id, organization_id, student_id, passage_id, status, band)
values ('22222222-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '22222222-2222-2222-2222-222222222222', '33333333-0000-0000-0000-000000000001', 'graded', 7.0);
set local role authenticated;

-- Teacher A teaches Student A -> sees the essay, its grading, the attempt.
set local request.jwt.claims = '{"sub":"88888888-8888-8888-8888-888888888888","role":"authenticated"}';
do $$
declare essays int; gradings int; attempts int;
begin
  select count(*) into essays   from public.essays;
  select count(*) into gradings from public.gradings;
  select count(*) into attempts from public.reading_attempts;
  assert essays = 1,   format('Teacher A should see their student essay; saw %s', essays);
  assert gradings = 1, format('Teacher A should see their student grading; saw %s', gradings);
  assert attempts = 1, format('Teacher A should see their student reading attempt; saw %s', attempts);
  raise notice 'PASS 13a: a teacher sees their own student''s writing and reading';
end $$;

-- Teacher A2 teaches nobody in that group -> sees none of it.
set local request.jwt.claims = '{"sub":"dddddddd-0000-0000-0000-000000000001","role":"authenticated"}';
do $$
declare essays int; gradings int; attempts int; changed int;
begin
  select count(*) into essays   from public.essays;
  select count(*) into gradings from public.gradings;
  select count(*) into attempts from public.reading_attempts;
  assert essays = 0,   format('BREACH: unrelated teacher read %s essay(s)', essays);
  assert gradings = 0, format('BREACH: unrelated teacher read %s grading(s)', gradings);
  assert attempts = 0, format('BREACH: unrelated teacher read %s reading attempt(s)', attempts);

  -- ...and cannot override a band on work that isn't theirs.
  update public.gradings set overall_band = 9.0
   where id = '11111111-0000-0000-0000-000000000001';
  get diagnostics changed = row_count;
  assert changed = 0, 'BREACH: unrelated teacher overrode another teacher''s grading';
  raise notice 'PASS 13b: an unrelated teacher sees and grades none of it';
end $$;

-- The center admin still sees the whole org (cohort analytics depend on it).
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
do $$
declare essays int; gradings int; attempts int;
begin
  select count(*) into essays   from public.essays;
  select count(*) into gradings from public.gradings;
  select count(*) into attempts from public.reading_attempts;
  assert essays = 1,   format('Center admin should see org essays; saw %s', essays);
  assert gradings = 1, format('Center admin should see org gradings; saw %s', gradings);
  assert attempts = 1, format('Center admin should see org attempts; saw %s', attempts);
  raise notice 'PASS 13c: the center admin still sees their whole org';
end $$;

-- ---- Case 14: the stat views count graded work, and nothing else -----------
-- Student A now has: 1 graded reading attempt, 1 graded listening attempt, and
-- 1 essay still at 'submitted' (seeded at the top). The essay must NOT count —
-- that inflation is what made "Have practised" wrong.
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
do $$
declare practices int; never int; ungrouped int;
begin
  select practice_count into practices
    from public.v_center_student_stats where student_id = '22222222-2222-2222-2222-222222222222';
  assert practices = 2,
    format('Student A has 2 GRADED practices (reading + listening), not %s', practices);

  select count(*) into never
    from public.v_center_student_stats where practice_count = 0;
  assert never = 1, format('Student A2 has never practised; "never" count was %s', never);

  select count(*) into ungrouped
    from public.v_center_student_stats where group_count = 0;
  assert ungrouped = 0, format('Both Center A students are in a group; "in no group" was %s', ungrouped);
  raise notice 'PASS 14a: v_center_student_stats counts graded work only';
end $$;

-- The view is security_invoker: a student sees themselves and no classmate.
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
do $$
declare rows_seen int;
begin
  select count(*) into rows_seen from public.v_center_student_stats;
  assert rows_seen = 1, format('BREACH: a student saw %s roster row(s) through the view', rows_seen);
  raise notice 'PASS 14b: the stat view leaks nothing to a student';
end $$;

-- ---- Case 15: pending invites exclude expired ones -------------------------
set local role postgres;
insert into public.invites (organization_id, email, role, token, expires_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'fresh@test.local', 'student', 'tok-fresh', now() + interval '7 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'stale@test.local', 'student', 'tok-stale', now() - interval '1 day');
set local role authenticated;

set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
do $$
declare pending int; raw int;
begin
  select count(*) into pending from public.v_pending_invites;
  select count(*) into raw     from public.invites where accepted_at is null;
  assert raw = 2, format('seed check: expected 2 unaccepted invites, saw %s', raw);
  assert pending = 1, format('Only the unexpired invite is pending; saw %s', pending);
  raise notice 'PASS 15: an expired invite is not a pending invite';
end $$;

-- ---- Case 16: an assigned prompt is frozen, but can still change state ------
-- 01 D7: version-safe editing by never editing. The prompt seeded in case 8 is
-- assigned to Group A, so its wording must be immutable — while publish and
-- archive, which only touch `status`, must still work.
set local request.jwt.claims = '{"sub":"88888888-8888-8888-8888-888888888888","role":"authenticated"}';
do $$
declare changed int;
begin
  begin
    update public.writing_prompts set prompt_text = 'Rewritten under the class'
     where id = 'bbbbbbbb-0000-0000-0000-000000000001';
    raise exception 'BREACH: reworded a prompt students have already been set';
  exception when check_violation then
    raise notice 'PASS 16a: an assigned prompt cannot be reworded';
  end;

  -- Archiving is a state change, not an edit: it must still be allowed.
  update public.writing_prompts set status = 'archived'
   where id = 'bbbbbbbb-0000-0000-0000-000000000001';
  get diagnostics changed = row_count;
  assert changed = 1, 'An assigned prompt must still be archivable';
  raise notice 'PASS 16b: archiving an assigned prompt still works';
end $$;

-- A prompt nobody has been set is still freely editable — the freeze is about
-- protecting answered work, not about locking drafts.
set local role postgres;
insert into public.writing_prompts (id, organization_id, task_type, prompt_text, status, created_by)
values ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'task2', 'Unassigned draft', 'pending', '88888888-8888-8888-8888-888888888888');
set local role authenticated;
set local request.jwt.claims = '{"sub":"88888888-8888-8888-8888-888888888888","role":"authenticated"}';
do $$
declare changed int;
begin
  update public.writing_prompts set prompt_text = 'Reworded draft'
   where id = 'bbbbbbbb-0000-0000-0000-000000000002';
  get diagnostics changed = row_count;
  assert changed = 1, 'An unassigned draft must stay editable';
  raise notice 'PASS 16c: an unassigned draft is still editable';
end $$;

-- ---- Case 17: a listening practice can be set, and reaches only that class --
-- Listening assignments pin a listening_library id directly (no per-org clone,
-- unlike reading). Needs migration 20260808170000.
set local role postgres;
insert into public.listening_library (id, part, difficulty, topic, content)
values ('44444444-0000-0000-0000-000000000001', 1, 3, 'Museum booking', '{}'::jsonb);
insert into public.assignments (id, organization_id, group_id, kind, title, listening_library_id)
values ('55555555-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '99999999-9999-9999-9999-999999999999', 'listening', 'Listening part 1',
        '44444444-0000-0000-0000-000000000001');
set local role authenticated;

-- The group's student sees both assignments now (the writing one from case 8).
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
do $$
declare seen int;
begin
  select count(*) into seen from public.assignments;
  assert seen = 2, format('Group member should see 2 assignments; saw %s', seen);
  raise notice 'PASS 17a: a listening assignment reaches the class';
end $$;

-- A student in the org but not in that group still sees nothing.
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
do $$
declare seen int;
begin
  -- Student A2 was re-added to Group A in case 11, so scope by the listening row.
  select count(*) into seen from public.assignments
   where listening_library_id = '44444444-0000-0000-0000-000000000001'
     and group_id <> '99999999-9999-9999-9999-999999999999';
  assert seen = 0, format('BREACH: listening assignment leaked to %s other group(s)', seen);
  raise notice 'PASS 17b: it reaches no other class';
end $$;

-- Exactly one content column, still enforced.
set local role postgres;
do $$
begin
  begin
    insert into public.assignments (organization_id, group_id, kind, title, prompt_id, listening_library_id)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999',
            'listening', 'Two kinds at once', 'bbbbbbbb-0000-0000-0000-000000000001',
            '44444444-0000-0000-0000-000000000001');
    raise exception 'BREACH: an assignment carried two kinds of content';
  exception when check_violation then
    raise notice 'PASS 17c: an assignment still carries exactly one piece of content';
  end;
end $$;
set local role authenticated;

rollback;  -- discards all seed data and resets role/claims
