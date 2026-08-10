import "server-only";

import { type createClient } from "@/lib/supabase/server";

/**
 * Looking up the name behind an id.
 *
 * WHY THIS EXISTS, and why no query in this module uses PostgREST's embedded
 * resources (`teacher:teacher_id ( full_name )`):
 *
 * Every table in this schema points at people, groups and rooms through the
 * COMPOSITE foreign key `(x_id, organization_id)` — the trick that makes a
 * cross-tenant row impossible at the database level. PostgREST cannot resolve
 * an embed through a composite FK; it answers
 *
 *     Could not find a relationship between 'lesson_slots' and 'room_id'
 *
 * and, because supabase-js reports that as an error rather than throwing, the
 * caller quietly receives `null` and renders an empty page. That failure mode
 * is invisible in a build and obvious only in production, which is exactly how
 * it got shipped once.
 *
 * So: fetch the rows, fetch the names, join in memory. Two round trips instead
 * of one, on tables that hold hundreds of rows per center. This is also the
 * pattern `lib/console/groups.ts` has always used.
 */

type Client = Awaited<ReturnType<typeof createClient>>;

const unique = (ids: (string | null | undefined)[]): string[] => [
  ...new Set(ids.filter((id): id is string => Boolean(id))),
];

/** id → value, for a table with an `id` column. Empty input means no query. */
export async function nameMap(
  supabase: Client,
  table: string,
  ids: (string | null | undefined)[],
  field = "name",
): Promise<Map<string, string>> {
  const wanted = unique(ids);
  if (wanted.length === 0) return new Map();

  const { data } = await supabase.from(table).select(`id, ${field}`).in("id", wanted);
  return new Map(
    ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => [
      row.id as string,
      (row[field] as string | null) ?? "—",
    ]),
  );
}

/** The people behind a set of ids — profiles keep their label in `full_name`. */
export function peopleMap(
  supabase: Client,
  ids: (string | null | undefined)[],
): Promise<Map<string, string>> {
  return nameMap(supabase, "profiles", ids, "full_name");
}
