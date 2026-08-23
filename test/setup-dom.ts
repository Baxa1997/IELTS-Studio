/**
 * DOM matchers for component tests (`toHaveTextContent`, `toHaveAttribute`, …).
 *
 * Loaded via `setupFiles` in vitest.config.mts for every suite, but it only has
 * an effect where a DOM exists — the node-environment suites in `lib/` import
 * nothing from it and pay nothing for it.
 */
import "@testing-library/jest-dom/vitest";
