-- ============================================================================
-- 20260617120600_grading_ops.sql
-- Operational support for POST /api/essays/[id]/grade:
--   1. Per-org monthly AI-grading quota (nullable override; plan defaults live
--      in app code, lib/quota.ts). The route blocks with 429 when exceeded.
--   2. A 'queued' essay status — the graceful fallback when the model keeps
--      failing after retries, so the essay can be picked up by a background
--      re-grade later instead of hard-failing the request.
-- ============================================================================

alter table public.organizations
  add column if not exists grading_monthly_limit int
    check (grading_monthly_limit is null or grading_monthly_limit >= 0);

comment on column public.organizations.grading_monthly_limit is
  'Per-org override for the monthly AI grading limit. NULL = use the plan default in lib/quota.ts.';

-- New status for the model-failure fallback. ALTER TYPE ... ADD VALUE commits on
-- its own; do not reference 'queued' elsewhere in this migration.
alter type public.essay_status add value if not exists 'queued';
