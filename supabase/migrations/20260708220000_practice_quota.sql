-- 20260708220000_practice_quota.sql
--
-- "One practice = one count": the practice quota is now counted at the
-- user-request level, not per model call (a full reading test or a listening
-- part logs several `generate` rows — retries, validators, multiple passages —
-- which silently burned a free user's whole month on one test).
--
-- Every user-initiated practice now logs exactly ONE ai_usage row with
-- task='practice' (provider='internal', model='-'); lib/quota.ts and the
-- engine's quota.py count those. The per-call `generate` rows stay for
-- observability/cost only.

alter type public.ai_task add value if not exists 'practice';
