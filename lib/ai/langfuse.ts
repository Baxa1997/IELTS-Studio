import "server-only";

import { serverEnv } from "@/lib/env";

/**
 * Minimal Langfuse-compatible tracing. We POST a trace + a nested generation to
 * Langfuse's public ingestion API directly (no SDK), so every model call is
 * traceable with its input/output, model, token usage, cost and latency.
 *
 * Best-effort and NON-BLOCKING by contract: observability must never slow or fail
 * a grading. When Langfuse isn't configured this is a silent no-op, so the rest of
 * the AI service can always call it.
 *
 * Ingestion API: POST {host}/api/public/ingestion  (Basic auth: public:secret)
 *   body: { batch: [ {id, type, timestamp, body}, ... ] }
 */

export interface TraceParams {
  traceId: string;
  name: string; // e.g. "grade" | "generate:reading_set"
  model: string;
  input: unknown;
  output: unknown;
  promptVersion?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number | null;
  latencyMs: number;
  ok: boolean;
  error?: string;
  organizationId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export function isLangfuseEnabled(): boolean {
  return serverEnv.langfuse !== null;
}

/** Fire a trace to Langfuse. Resolves quietly on any failure. */
export async function recordTrace(params: TraceParams): Promise<void> {
  const cfg = serverEnv.langfuse;
  if (!cfg) return;

  const now = new Date().toISOString();
  const startedAt = new Date(Date.now() - params.latencyMs).toISOString();
  const usage = {
    input: params.inputTokens ?? undefined,
    output: params.outputTokens ?? undefined,
    total:
      params.inputTokens != null || params.outputTokens != null
        ? (params.inputTokens ?? 0) + (params.outputTokens ?? 0)
        : undefined,
    unit: "TOKENS" as const,
    inputCost: undefined,
    totalCost: params.costUsd ?? undefined,
  };

  const batch = [
    {
      id: `trace-${params.traceId}`,
      type: "trace-create",
      timestamp: now,
      body: {
        id: params.traceId,
        name: params.name,
        userId: params.userId,
        input: cap(params.input),
        output: cap(params.output),
        metadata: { organizationId: params.organizationId, ...params.metadata },
        tags: [params.ok ? "ok" : "error"],
      },
    },
    {
      id: `gen-${params.traceId}`,
      type: "generation-create",
      timestamp: now,
      body: {
        id: `gen-${params.traceId}`,
        traceId: params.traceId,
        name: params.name,
        startTime: startedAt,
        endTime: now,
        model: params.model,
        modelParameters: params.promptVersion ? { promptVersion: params.promptVersion } : undefined,
        input: cap(params.input),
        output: cap(params.output),
        usage,
        level: params.ok ? "DEFAULT" : "ERROR",
        statusMessage: params.error,
      },
    },
  ];

  try {
    const auth = Buffer.from(`${cfg.publicKey}:${cfg.secretKey}`).toString("base64");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    await fetch(`${cfg.host.replace(/\/$/, "")}/api/public/ingestion`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({ batch }),
      signal: controller.signal,
      keepalive: true,
    }).finally(() => clearTimeout(timer));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[langfuse] trace failed:", err);
    }
  }
}

/** Keep payloads sane — Langfuse accepts large bodies, but full essays/passages add
 *  little to a trace. Cap strings; pass objects through. */
function cap(value: unknown, max = 12_000): unknown {
  if (typeof value === "string" && value.length > max) {
    return `${value.slice(0, max)}… [truncated ${value.length - max} chars]`;
  }
  return value;
}
