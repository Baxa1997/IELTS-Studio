import { randomBytes } from "node:crypto";

/**
 * A readable throwaway password.
 *
 * Avoids look-alike characters (no l/1, no o/0) because these get written on a
 * whiteboard, read down a phone line and typed by children. The student can
 * change it once they are in.
 *
 * LIVES HERE RATHER THAN IN THE ACTION FILE that first needed it. A `"use
 * server"` module may only export async functions, so a helper defined there is
 * private to it — and the Telegram webhook now needs the same one to complete a
 * self-service bind. Two implementations of "make a password" is how one of
 * them quietly ends up weaker than the other.
 */
export function generatePassword(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
