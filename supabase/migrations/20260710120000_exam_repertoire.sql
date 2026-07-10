-- Close the two structural gaps found by the Cambridge 19–21 comparison
-- (structure only — no book content is ever ingested; CLAUDE.md §IP):
--
--   1. Writing Task 2: the real exam rotates SIX question shapes; we generated
--      four. Add the missing two to the prompt_category enum:
--        - advantages_disadvantages  ("Do the advantages outweigh the disadvantages?")
--        - positive_negative         ("Is this a positive or negative development?")
--
--   2. Reading: "matching features" (statements ↔ the people who said/found them,
--      a shared A–E list) appears in half of all recent Cambridge tests and we had
--      no such type. New reading_question_type value: matching_features.
--
-- ALTER TYPE ... ADD VALUE is safe inside a migration as long as the new value is
-- not used by DML in the same transaction — these are enum-only additions; rows
-- using them are only written later by the generators.

alter type public.prompt_category add value if not exists 'advantages_disadvantages';
alter type public.prompt_category add value if not exists 'positive_negative';

alter type public.reading_question_type add value if not exists 'matching_features';
