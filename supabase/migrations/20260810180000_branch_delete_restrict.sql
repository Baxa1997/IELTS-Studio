-- ============================================================================
-- 20260810180000_branch_delete_restrict.sql
-- A branch cannot be deleted while anything still stands at it.
--
-- `rooms.branch_id` and `finance_accounts.branch_id` were created ON DELETE SET
-- NULL, back when a room or a desk was allowed to belong to no site. Since
-- 20260810170000 both columns are NOT NULL, so that rule is now a contradiction:
-- deleting a branch would try to write NULL into a NOT NULL column and fail with
-- "null value violates not-null constraint" — a message about a column the user
-- never touched, on an action they will not understand having taken.
--
-- RESTRICT says the true thing instead: move the rooms and desks first. It also
-- matches `groups.branch_id`, which has been RESTRICT from the start, so all
-- three children of a branch now behave the same way.
-- ============================================================================

alter table public.rooms drop constraint if exists rooms_branch_fk;
alter table public.rooms
  add constraint rooms_branch_fk
  foreign key (branch_id, organization_id)
    references public.branches (id, organization_id) on delete restrict;

alter table public.finance_accounts drop constraint if exists finance_accounts_branch_fk;
alter table public.finance_accounts
  add constraint finance_accounts_branch_fk
  foreign key (branch_id, organization_id)
    references public.branches (id, organization_id) on delete restrict;
