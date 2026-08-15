import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Speaking mocks where the candidate abused or refused the examiner.
 *
 * Written by the grader (the engine's `speaking/service.py` `_conduct`), read
 * only here. REPORTED, NEVER ENFORCED: nothing on this list changes a band, a
 * quota or an account. It exists so the owner can tell one bad afternoon from a
 * pattern — which is the only question this data can honestly answer — and
 * deliberately sits nowhere near the learner's own account view.
 */

export interface ConductFlag {
  id: string;
  org: string;
  orgId: string;
  student: string;
  when: string;
  /** 'abuse' | 'refusal' | … whatever the grader reported. */
  kind: string;
  quote: string;
}

export async function loadConductFlags(limit = 50): Promise<ConductFlag[]> {
  const admin = createAdminClient();

  const { data: flagged } = await admin
    .from("speaking_sessions")
    .select("id, organization_id, student_id, started_at, result")
    .eq("mode", "full")
    .not("result->conduct", "is", null)
    .order("started_at", { ascending: false })
    .limit(limit);

  const rows = (flagged ?? []) as {
    id: string;
    organization_id: string;
    student_id: string | null;
    started_at: string;
    result: { conduct?: { kind?: string; quote?: string } | null } | null;
  }[];
  if (rows.length === 0) return [];

  // Two lookups for the whole page rather than one per flag.
  const [{ data: orgs }, { data: people }] = await Promise.all([
    admin.from("organizations").select("id, name"),
    admin
      .from("profiles")
      .select("id, full_name")
      .in("id", rows.map((r) => r.student_id).filter((id): id is string => Boolean(id))),
  ]);
  const orgName = new Map((orgs ?? []).map((o) => [o.id as string, o.name as string]));
  const personName = new Map(
    (people ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? "Unnamed"]),
  );

  return rows
    .map((s) => ({
      id: s.id,
      orgId: s.organization_id,
      org: orgName.get(s.organization_id) ?? "—",
      student: s.student_id ? (personName.get(s.student_id) ?? "Unnamed") : "Unnamed",
      when: s.started_at,
      kind: s.result?.conduct?.kind ?? "",
      quote: s.result?.conduct?.quote ?? "",
    }))
    // A conduct object with no quote is a grader artefact, not a finding — there
    // is nothing for a human to judge, so it is not shown as if there were.
    .filter((c) => c.quote);
}
