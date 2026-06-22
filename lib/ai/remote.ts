import "server-only";

import type { AIProvider, CompletionRequest, CompletionResult } from "./provider";

/** URL + shared secret for the remote IELTS AI engine (the Contabo backend). */
export interface AiEngineConfig {
  url: string;
  key: string;
}

/**
 * Calls the self-hosted IELTS AI engine instead of talking to Vertex in-process.
 *
 * Why: on Vercel, keyless Vertex (Workload Identity Federation) proved fragile
 * and serverless functions cap long (~1-2 min) generations. The engine runs on
 * a normal VPS where Vertex auth is a plain service-account key (ADC) and there's
 * no function time limit. It's a dumb proxy — this provider sends
 * {model, system, prompt, temperature, json, files} and gets back {text, usage};
 * all IELTS prompt/rubric/validation logic stays here in the app.
 *
 * Auth is a single shared secret in the X-Internal-Key header (server-to-server;
 * the browser never calls the engine). Selected in `./index` whenever
 * `serverEnv.aiEngine` is configured.
 */
export class RemoteAIProvider implements AIProvider {
  readonly name = "ielts-ai-engine";
  private readonly model: string;
  private readonly endpoint: string;
  private readonly key: string;

  constructor(model: string, config: AiEngineConfig) {
    this.model = model;
    this.endpoint = `${config.url.replace(/\/+$/, "")}/generate`;
    this.key = config.key;
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const body = {
      model: this.model,
      prompt: request.prompt,
      ...(request.system ? { system: request.system } : {}),
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      ...(request.responseFormat === "json" ? { json: true } : {}),
      ...(request.files?.length
        ? { files: request.files.map((f) => ({ mime_type: f.mimeType, data: f.data })) }
        : {}),
    };

    const resp = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Key": this.key },
      body: JSON.stringify(body),
      // Forwards the service's timeout/abort so retries+timeouts still apply.
      signal: request.signal,
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      throw new Error(`AI engine ${resp.status}: ${detail.slice(0, 400)}`);
    }

    const data = (await resp.json()) as {
      text?: string;
      model?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = data.text ?? "";
    if (!text) {
      // Mirrors GeminiProvider: an empty body (safety block / truncation) must
      // fail loudly so the service retries rather than storing a silent blank.
      throw new Error("AI engine returned no text.");
    }

    return {
      text,
      model: data.model ?? this.model,
      usage: {
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      },
    };
  }
}
