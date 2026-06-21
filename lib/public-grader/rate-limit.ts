import "server-only";

import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env";

/**
 * DB-backed rate limiter for the public, no-login grader. Serverless-safe (the
 * counter lives in Postgres, not process memory, so it holds across instances).
 *
 * Two ceilings, both over a rolling window:
 *   - per-IP   → stops one visitor from farming free gradings.
 *   - global   → a hard cost cap so the free tier can't run up an unbounded bill.
 *
 * The visitor's IP is salted + hashed before it touches the DB — we store an opaque
 * fingerprint, never the address itself.
 */

export interface RateDecision {
  allowed: boolean;
  reason?: "ip" | "global";
  /** Suggested Retry-After (seconds) when blocked. */
  retryAfterSeconds: number;
}

/** Best-effort client IP from proxy headers (Vercel/most hosts set these). */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "0.0.0.0";
}

/** Opaque, salted fingerprint of an IP — what we actually store. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`${serverEnv.publicGrader.salt}:${ip}`).digest("hex");
}

/**
 * Check both ceilings and, if allowed, record the attempt (so it counts toward
 * future checks). Count-then-insert can let a burst of truly-simultaneous requests
 * slip a few over the line — acceptable for a teaser, and the global cap still
 * bounds total spend.
 */
export async function checkAndRecord(admin: SupabaseClient, ipHash: string): Promise<RateDecision> {
  const { perIp, global, windowHours } = serverEnv.publicGrader;
  const windowStart = new Date(Date.now() - windowHours * 3_600_000).toISOString();

  // Per-IP ceiling.
  const ip = await admin
    .from("public_grade_events")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", windowStart);
  if ((ip.count ?? 0) >= perIp) {
    return { allowed: false, reason: "ip", retryAfterSeconds: windowHours * 3600 };
  }

  // Global cost ceiling.
  const total = await admin
    .from("public_grade_events")
    .select("id", { count: "exact", head: true })
    .gte("created_at", windowStart);
  if ((total.count ?? 0) >= global) {
    return { allowed: false, reason: "global", retryAfterSeconds: 600 };
  }

  // Record the attempt up front so concurrent requests count it.
  await admin.from("public_grade_events").insert({ ip_hash: ipHash });

  // Occasionally prune expired rows so the ledger can't grow without bound.
  if (Math.random() < 0.05) {
    await admin.from("public_grade_events").delete().lt("created_at", windowStart);
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
