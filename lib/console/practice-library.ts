import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * The practice library (§9): what the centre has kept, and how often it is used.
 *
 * The shelf holds pointers, not content — see migration 20260816190000. This
 * module resolves those pointers into something a teacher can scan.
 */

export type LibraryKind = "writing_prompt" | "reading_test";

export interface LibraryItem {
  id: string;
  kind: LibraryKind;
  refId: string;
  title: string;
  skill: string;
  taskType: string | null;
  level: string | null;
  notes: string | null;
  savedAt: string;
  savedByName: string | null;
  /**
   * How many times it has actually been set. The number that decides whether
   * the library is working at all: a shelf nobody assigns from is a shelf that
   * has not saved anybody a single generation.
   */
  timesAssigned: number;
  lastAssignedAt: string | null;
  /** The first line of the prompt, so a teacher recognises it without opening. */
  preview: string | null;
}

export interface LibraryFilters {
  skill?: string;
  taskType?: string;
  level?: string;
  /** Free text over title and notes. */
  q?: string;
}

/**
 * The shelf, newest first, with the tags a teacher filters by.
 *
 * Archived items are excluded rather than deleted (R5): a prompt a class has
 * already sat cannot vanish, because its assignments would lose their context.
 */
export async function loadLibrary(filters: LibraryFilters = {}): Promise<LibraryItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("practice_library")
    .select("id, kind, ref_id, title, skill, task_type, level, notes, saved_at, saved_by")
    .is("archived_at", null)
    .order("saved_at", { ascending: false })
    .limit(200);

  if (filters.skill) query = query.eq("skill", filters.skill);
  if (filters.taskType) query = query.eq("task_type", filters.taskType);
  if (filters.level) query = query.eq("level", filters.level);

  const { data } = await query;
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id as string);
  const savers = [...new Set(rows.map((r) => r.saved_by as string | null).filter(Boolean))];
  const promptIds = rows
    .filter((r) => r.kind === "writing_prompt")
    .map((r) => r.ref_id as string);

  const [usageRes, peopleRes, promptsRes] = await Promise.all([
    supabase.from("assignments").select("library_id, created_at").in("library_id", ids),
    savers.length
      ? supabase.from("profiles").select("id, full_name").in("id", savers as string[])
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    promptIds.length
      ? supabase.from("writing_prompts").select("id, prompt_text").in("id", promptIds)
      : Promise.resolve({ data: [] as { id: string; prompt_text: string }[] }),
  ]);

  const usage = new Map<string, { count: number; last: string | null }>();
  for (const a of (usageRes.data ?? []) as { library_id: string; created_at: string }[]) {
    const row = usage.get(a.library_id) ?? { count: 0, last: null };
    row.count += 1;
    if (!row.last || a.created_at > row.last) row.last = a.created_at;
    usage.set(a.library_id, row);
  }

  const nameById = new Map(
    ((peopleRes.data ?? []) as { id: string; full_name: string | null }[]).map((p) => [
      p.id,
      p.full_name,
    ]),
  );
  const textById = new Map(
    ((promptsRes.data ?? []) as { id: string; prompt_text: string }[]).map((p) => [
      p.id,
      p.prompt_text,
    ]),
  );

  const items = rows.map((r) => {
    const used = usage.get(r.id as string);
    return {
      id: r.id as string,
      kind: r.kind as LibraryKind,
      refId: r.ref_id as string,
      title: r.title as string,
      skill: r.skill as string,
      taskType: (r.task_type as string | null) ?? null,
      level: (r.level as string | null) ?? null,
      notes: (r.notes as string | null) ?? null,
      savedAt: r.saved_at as string,
      savedByName: nameById.get(r.saved_by as string) ?? null,
      timesAssigned: used?.count ?? 0,
      lastAssignedAt: used?.last ?? null,
      preview: firstLine(textById.get(r.ref_id as string) ?? null),
    };
  });

  // Free-text search happens here rather than in SQL: the corpus is one
  // centre's shelf (capped at 200), and `ilike` across two nullable columns
  // through PostgREST's `or` filter is a string-building exercise that breaks
  // the moment a teacher types a comma.
  const q = filters.q?.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    [item.title, item.notes, item.taskType, item.level, item.preview]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(q)),
  );
}

/** The tag values actually in use, so the filters offer real choices only. */
export function libraryFacets(items: LibraryItem[]): {
  skills: string[];
  taskTypes: string[];
  levels: string[];
} {
  const uniq = (values: (string | null)[]) =>
    [...new Set(values.filter((v): v is string => Boolean(v)))].sort();
  return {
    skills: uniq(items.map((i) => i.skill)),
    taskTypes: uniq(items.map((i) => i.taskType)),
    levels: uniq(items.map((i) => i.level)),
  };
}

const firstLine = (text: string | null): string | null => {
  if (!text) return null;
  const line = text.trim().split("\n")[0].trim();
  return line.length > 150 ? `${line.slice(0, 150)}…` : line;
};
