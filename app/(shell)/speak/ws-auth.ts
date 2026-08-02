/**
 * How this browser tab hands its Supabase token to the speaking engine.
 *
 * The token belongs in the WebSocket handshake's subprotocol, not the URL: a URL
 * lands in the engine host's nginx access log, which would leave live bearer
 * tokens on disk for their full ~1h lifetime. The engine reads both carries
 * (speaking/ws_auth.py).
 *
 * The catch is deploy order. Against an engine that predates that file the
 * handshake does not degrade gracefully — it FAILS, because a browser aborts the
 * connection when it offered subprotocols and the server selected none. That
 * surfaced as "Connection to the examiner dropped." with no way for the learner
 * to act on it.
 *
 * So the first socket probes, and a handshake that dies before opening downgrades
 * the tab and retries on the legacy carry. Shared module scope, so one probe
 * teaches every speaking surface in the tab and later sessions skip it.
 */

type Carry = "subprotocol" | "query";

let carry: Carry = "subprotocol";

/** True while we should still try the header carry. */
export function prefersSubprotocol(): boolean {
  return carry === "subprotocol";
}

/** Called when a handshake failed before opening while probing. */
export function downgradeToQueryCarry(): void {
  carry = "query";
}

/** `["bearer", <jwt>]` — the engine selects "bearer" back and reads the token. */
export function bearerProtocols(token: string): string[] {
  return ["bearer", token];
}
