/*
 * THE DAILY CHALLENGE'S BOARD — one row per visitor per day: their FIRST score
 * on the Reading passage everybody gets that day.
 *
 * The free daily practice stores nothing (a signed cookie is its whole record —
 * lib/free-practice/visitor.ts), because nobody else needs to see it. A board
 * is the opposite: its point is other people's scores, so it needs a table.
 *
 * WHAT IS IN A ROW, AND WHAT IS NOT. No account, no name, no IP. `visitor_hash`
 * is a salted hash of the anonymous visitor cookie (never the cookie itself —
 * that would let a leaked row be replayed as somebody's identity), and
 * `nickname` is derived from that hash by lib/challenge/board.ts, so the public
 * board shows "Quick Falcon 42", not a person.
 *
 * ⚠️ `unique (day, visitor_hash)` IS THE "FIRST ATTEMPT ONLY" RULE. The marking
 * route returns the answer keys in its review, like every reading route; the
 * insert ignores a conflict, so sitting the passage again with the keys in hand
 * changes nothing on the board. (Clearing cookies buys a second identity — the
 * same accepted leak as the free practice itself.)
 *
 * SERVICE ROLE ONLY. RLS is on with no policy and the client roles hold no
 * grant: the board is read and written by /api/public/practice/challenge on
 * the service-role client, which shows the top rows and never a hash.
 *
 * ⚠️ SAFE TO APPLY AFTER THE APP DEPLOYS. Without this table the challenge
 * still opens and marks; the score is simply not kept and the landing page
 * shows the challenge without a board (lib/challenge/daily.ts swallows the
 * missing-table error on both the write and the read).
 */
create table if not exists public.daily_challenge_scores (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  visitor_hash text not null,
  nickname text not null,
  practice_key text not null,
  score integer not null check (score >= 0),
  total integer not null check (total > 0 and score <= total),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default now(),
  unique (day, visitor_hash)
);

-- The board's own order: best score first, and among equals whoever finished
-- first — see `rankBoard` in lib/challenge/board.ts.
create index if not exists daily_challenge_scores_board
  on public.daily_challenge_scores (day, score desc, created_at asc);

alter table public.daily_challenge_scores enable row level security;
revoke all on table public.daily_challenge_scores from anon, authenticated;
