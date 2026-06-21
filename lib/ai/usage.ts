import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { recordTrace } from "./langfuse";
import { estimateCostUsd } from "./pricing";
import type { AiTask } from "./provider";

/**
 * Per-call observability — the one centralized cross-cutting concern in the AI
 * layer. Every model call (success or failure) writes exactly one `ai_usage` row
 * (tenant + user attributed, with cost, latency, prompt version and a result
 * summary) AND emits a Langfuse-compatible trace.
 *
 * The ai_usage write goes through the service-role client (service_role-write,
 * center_admin-read). Both the DB write and the trace are best-effort: logging
 * must never break a grading, so failures are swallowed (surfaced in dev).
 */
export interface AiUsageRecord {
  organizationId: string;
  /** `null` for anonymous/public calls (the no-login grader). */
  userId: string | null;
  task: AiTask;
  provider: string;
  model: string;
  /** Sub-kind for context, e.g. "task2" or "writing_prompt". */
  requestKind?: string;
  essayId?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  ok: boolean;
  error?: string;

  // ── Observability extras ──
  /** Which prompt build produced this call (lib/ai/version.ts). */
  promptVersion?: string;
  /** Short, storable result note, e.g. "band 6.5" / "reading_set". */
  resultSummary?: string;
  /** Full prompt/output for the trace only (NOT persisted to ai_usage). */
  input?: unknown;
  output?: unknown;
}

export async function logUsage(record: AiUsageRecord): Promise<void> {
  const costUsd = estimateCostUsd(record.model, record.inputTokens, record.outputTokens);
  const traceId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // 1) Persist the usage row (lean — full I/O lives in the trace).
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("ai_usage").insert({
      organization_id: record.organizationId,
      user_id: record.userId,
      task: record.task,
      provider: record.provider,
      model: record.model,
      request_kind: record.requestKind ?? null,
      essay_id: record.essayId ?? null,
      input_tokens: record.inputTokens ?? null,
      output_tokens: record.outputTokens ?? null,
      latency_ms: record.latencyMs,
      ok: record.ok,
      error: record.error ?? null,
      cost_usd: costUsd,
      prompt_version: record.promptVersion ?? null,
      trace_id: traceId,
      result_summary: record.resultSummary ?? null,
    });
    if (error) throw error;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[ai.usage] failed to record usage:", err, record);
    }
  }

  // 2) Emit the trace (its own try/catch inside; no-op when Langfuse is off).
  await recordTrace({
    traceId,
    name: record.requestKind ? `${record.task}:${record.requestKind}` : record.task,
    model: record.model,
    input: record.input ?? null,
    output: record.output ?? record.resultSummary ?? null,
    promptVersion: record.promptVersion,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    costUsd,
    latencyMs: record.latencyMs,
    ok: record.ok,
    error: record.error,
    organizationId: record.organizationId,
    userId: record.userId ?? undefined,
    metadata: { requestKind: record.requestKind, essayId: record.essayId, provider: record.provider },
  });
}
