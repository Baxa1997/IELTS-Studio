/**
 * The rules for changing a password while signed in, kept apart from the server
 * action so they can be tested without a Supabase session.
 */

/** Eight matches every other password rule in the app (sign-up, invites, resets). */
export const MIN_PASSWORD_LENGTH = 8;
/** bcrypt ignores everything past 72 bytes — a longer password is not stronger, just misleading. */
export const MAX_PASSWORD_LENGTH = 72;

/**
 * Whether this account can sign in with a password at all.
 *
 * A Google-only learner has no password, so there is nothing to confirm before
 * setting one — asking for "your current password" would be a question they
 * cannot answer. Every center account is created with an email identity (a
 * synthetic address plus a password), so they always answer yes.
 */
export function hasPasswordLogin(
  user: { identities?: { provider?: string | null }[] | null } | null | undefined,
): boolean {
  return (user?.identities ?? []).some((i) => i.provider === "email");
}

/**
 * Why a password change must be refused, or null when it may go ahead.
 *
 * `current` is null when the account has no password to confirm (see
 * `hasPasswordLogin`). Checking it against the real password is the action's
 * job; this only checks what can be known from the form.
 */
export function passwordChangeProblem(input: {
  current: string | null;
  next: string;
  confirmation: string;
}): string | null {
  if (input.current !== null && input.current.length === 0) {
    return "Enter your current password.";
  }
  if (input.next.length < MIN_PASSWORD_LENGTH) {
    return `Your new password needs at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (new TextEncoder().encode(input.next).length > MAX_PASSWORD_LENGTH) {
    return `Your new password can be at most ${MAX_PASSWORD_LENGTH} characters.`;
  }
  if (input.next !== input.confirmation) {
    return "The two new passwords don't match.";
  }
  if (input.current !== null && input.next === input.current) {
    return "Your new password is the same as the current one.";
  }
  return null;
}
