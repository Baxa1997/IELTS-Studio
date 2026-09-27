import "server-only";

import { createHash, createHmac } from "node:crypto";

import { cookies, headers } from "next/headers";

import { serverEnv } from "@/lib/env";

import type { FreeSkill } from "./rotation";

/**
 * The anonymous visitor, and what they have already done today.
 *
 * ⚠️ `VISITOR_COOKIE` IS DUPLICATED IN `lib/supabase/middleware.ts`, which sets
 * it — the proxy runs on the edge and cannot import this `server-only` module.
 * `free-practice.test.ts` fails if the two names drift apart, because a drift
 * is silent: the proxy would keep issuing a cookie nobody reads, and every
 * visitor would fall back to their IP.
 */
export const VISITOR_COOKIE = "ep_visitor";
export const DONE_COOKIE = "ep_free_done";

/**
 * Who this visitor is, for the rotation: the cookie the proxy issues on the
 * first free-practice request, or — for a client that refuses cookies — a
 * salted hash of their IP. The fallback is coarser (everyone behind one
 * carrier NAT shares a mix) but it is still stable across the day, which is
 * the property that matters: today's practice must not change on reload.
 */
export async function visitorId(): Promise<string> {
  const jar = await cookies();
  const id = jar.get(VISITOR_COOKIE)?.value;
  if (id && /^[0-9a-f-]{16,64}$/i.test(id)) return id;
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0";
  return "ip-" + createHash("sha256").update(`${serverEnv.publicGrader.salt}:${ip}`).digest("hex").slice(0, 24);
}

/* ── done today ──────────────────────────────────────────────────────────── *
 *
 * One practice per skill per day is a FUNNEL rule, not a cost control: Reading
 * and Listening are marked by code and cost nothing, and Writing — the one
 * that spends model money — is capped separately by the public grader's
 * per-IP limit in the database. So the record lives in a cookie, signed so it
 * cannot be edited into saying the opposite, with no table behind it. Clearing
 * cookies buys another practice; that is an acceptable leak for a free taste.
 */

function sign(payload: string): string {
  return createHmac("sha256", serverEnv.publicGrader.salt).update(payload).digest("hex").slice(0, 32);
}

/** Parse `day:skill+skill.sig` — anything unsigned, stale or malformed is "nothing done". */
export function readDone(raw: string | undefined, day: string): Set<FreeSkill> {
  if (!raw) return new Set();
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return new Set();
  const payload = raw.slice(0, dot);
  if (sign(payload) !== raw.slice(dot + 1)) return new Set();
  const [d, list] = payload.split(":");
  if (d !== day || !list) return new Set();
  return new Set(list.split("+").filter(Boolean) as FreeSkill[]);
}

/** The cookie value after adding `skill` to today's record. */
export function writeDone(current: Set<FreeSkill>, skill: FreeSkill, day: string): string {
  const next = [...new Set([...current, skill])].sort().join("+");
  const payload = `${day}:${next}`;
  return `${payload}.${sign(payload)}`;
}

/** What this visitor has finished today. */
export async function doneToday(day: string): Promise<Set<FreeSkill>> {
  return readDone((await cookies()).get(DONE_COOKIE)?.value, day);
}

/** Cookie options for the done record: it only has to outlive today. */
export const DONE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 36,
};
