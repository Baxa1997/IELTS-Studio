/**
 * Talking to the AI engine from the browser.
 *
 * The browser calls the engine DIRECTLY, with the learner's Supabase access
 * token, rather than proxying through a Vercel function — generating a full
 * listening test or a CEFR paper takes minutes and would hit the serverless
 * timeout. `lib/env.ts` documents that decision on `clientEnv.aiBackendUrl`.
 *
 * This module exists because that call was written three times — in the
 * listening client, the CEFR client and the Practice AI composer — plus six
 * more places that reached for `clientEnv.aiBackendUrl` and hand-rolled a
 * `fetch`. They differed only in the path prefix, and they had drifted in the
 * ways copies always do: only one of the three caught a network failure and
 * turned it into something a learner could read. The others surfaced a raw
 * `TypeError: Failed to fetch` when the engine was restarting.
 *
 * One implementation, with the best behaviour of the three.
 */

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

/** The engine's top-level route namespaces. */
export type EngineNamespace = "listening" | "multilevel" | "lessons" | "reading" | "speaking";

/** Shape of the engine's error responses — FastAPI's `detail`, or a `message`. */
type EngineError = Record<string, unknown> & {
  detail?: string | { message?: string };
  message?: string;
};

/**
 * POST to `<engine>/<namespace>/<path>` with the caller's Supabase token.
 *
 * Throws an `Error` whose message is safe to show a learner: the engine's own
 * `detail` when it sent one, and a plain-language line when the request never
 * landed at all.
 */
export async function callEngine<T>(
  namespace: EngineNamespace,
  path: string,
  body: unknown,
  init?: { signal?: AbortSignal },
): Promise<T> {
  const backend = clientEnv.aiBackendUrl;
  if (!backend) {
    throw new Error(
      "AI backend isn’t configured. Set NEXT_PUBLIC_AI_BACKEND_URL to the engine URL.",
    );
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Your session expired — please sign in again.");

  let res: Response;
  try {
    res = await fetch(`${backend}/${namespace}/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: init?.signal,
    });
  } catch (err) {
    // An abort is the caller's own doing — let it through untouched so
    // `err.name === "AbortError"` still works upstream.
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    // Everything else here is "the request never landed": DNS, TLS, CORS, or
    // the engine box mid-restart. Two of the three copies of this function let
    // the raw `TypeError: Failed to fetch` reach the screen.
    throw new Error("Couldn’t reach the AI engine. It may be restarting — try again shortly.");
  }

  const json = (await res.json().catch(() => ({}))) as EngineError;
  if (!res.ok) {
    const detail = typeof json.detail === "string" ? json.detail : json.detail?.message;
    throw new Error(detail ?? json.message ?? `Request failed (${res.status}).`);
  }
  return json as T;
}

/** `callEngine` bound to one namespace, for a module that only talks to one. */
export function engineClient(namespace: EngineNamespace) {
  return <T>(path: string, body: unknown, init?: { signal?: AbortSignal }) =>
    callEngine<T>(namespace, path, body, init);
}
