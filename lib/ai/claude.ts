import "server-only";

import type { AIProvider, CompletionRequest, CompletionResult } from "./provider";

/**
 * Claude (Sonnet) provider — STUB.
 *
 * The evaluation engine is planned to move from Gemini to Claude Sonnet for
 * grading (route by task, not globally — see CLAUDE.md). When that happens:
 *   1. add `@anthropic-ai/sdk` + an `ANTHROPIC_API_KEY` to `lib/env.ts`,
 *   2. implement `complete()` below (map request → Messages API, read usage),
 *   3. flip `getProvider("grade")` in `./index` to return this provider.
 *
 * Feature code never changes — it depends on the `AIProvider` interface only.
 */
export class ClaudeProvider implements AIProvider {
  readonly name = "claude";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async complete(_request: CompletionRequest): Promise<CompletionResult> {
    throw new Error(
      "ClaudeProvider.complete is not implemented yet. v1 grades with Gemini; " +
        "wire up the Anthropic SDK before routing grading here.",
    );
  }
}
