import { afterEach, describe, expect, it, vi } from "vitest";

import { logEngineFailure } from "./engine";

/**
 * A free page whose engine call failed says "not right now" either way; what
 * differs is how loudly the server logs it. On a machine with no engine
 * configured — most local ones — it is expected, and a console.error there is
 * a red Issue in Next's dev overlay for a page that works as designed.
 */
describe("logging a failed engine call", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function logs() {
    return {
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
    };
  }

  it("warns, in development, when the engine is simply not configured", () => {
    vi.stubEnv("AI_ENGINE_URL", "");
    vi.stubEnv("AI_ENGINE_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    const { warn, error } = logs();
    logEngineFailure("cefr/free", new Error("AI engine is not configured"));
    expect(warn).toHaveBeenCalledOnce();
    expect(error).not.toHaveBeenCalled();
  });

  it("is an error in production even then — a deploy that lost its key is a fault", () => {
    vi.stubEnv("AI_ENGINE_URL", "");
    vi.stubEnv("AI_ENGINE_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    const { warn, error } = logs();
    logEngineFailure("cefr/free", new Error("AI engine is not configured"));
    expect(error).toHaveBeenCalledOnce();
    expect(warn).not.toHaveBeenCalled();
  });

  it("is an error whenever the engine IS configured and still failed", () => {
    vi.stubEnv("AI_ENGINE_URL", "https://engine.example");
    vi.stubEnv("AI_ENGINE_KEY", "key");
    vi.stubEnv("NODE_ENV", "development");
    const { warn, error } = logs();
    logEngineFailure("listen/free", new Error("engine answered 502"));
    expect(error).toHaveBeenCalledOnce();
    expect(warn).not.toHaveBeenCalled();
  });
});
