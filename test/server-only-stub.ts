/**
 * A no-op stand-in for the `server-only` package, used by vitest alone.
 *
 * The real package throws the moment it is imported outside a React Server
 * Component. That is exactly right for a build — it is what stops server code
 * reaching a browser bundle — and exactly wrong for a unit test, which is
 * neither a build nor a browser. Without this, the pure logic inside any
 * server module could not be tested at all.
 *
 * Aliased in vitest.config.ts. Nothing in the app imports this file, so the
 * guard still does its real job everywhere it matters.
 */
export {};
