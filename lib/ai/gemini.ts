import "server-only";

import { GoogleGenAI, type GoogleGenAIOptions } from "@google/genai";

import { serverEnv } from "@/lib/env";

import type { AIProvider, CompletionRequest, CompletionResult } from "./provider";

/** v1 engine. One model for now; the service can route per-task later. Same
 *  model id works on both the Developer API and Vertex AI. */
const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Build the GenAI client for the configured backend:
 *   - "developer" — Gemini Developer API, authed with GEMINI_API_KEY.
 *   - "vertex"    — Vertex AI, authed with project/location + ADC (or an inline
 *                   service-account key via GOOGLE_VERTEX_CREDENTIALS).
 * Env is only read here, when a provider is actually instantiated — the health
 * route and skeleton stay runnable without any AI credentials.
 */
function buildClient(): GoogleGenAI {
  if (serverEnv.geminiBackend === "vertex") {
    const options: GoogleGenAIOptions = {
      vertexai: true,
      project: serverEnv.googleCloudProject,
      location: serverEnv.googleCloudLocation,
    };
    const credentials = serverEnv.googleVertexCredentials;
    if (credentials) {
      type Creds = NonNullable<GoogleGenAIOptions["googleAuthOptions"]>["credentials"];
      options.googleAuthOptions = { credentials: credentials as Creds };
    }
    return new GoogleGenAI(options);
  }
  return new GoogleGenAI({ apiKey: serverEnv.geminiApiKey });
}

/**
 * Gemini implementation of {@link AIProvider} (v1 engine).
 *
 * Deliberately thin: it maps our transport request onto the GenAI SDK and reads
 * back text + token usage. Prompt assembly, JSON validation, retries, timeouts
 * and temperature policy all live in the service (`./index`), not here. Works
 * unchanged against either the Developer API or Vertex AI — that's a `buildClient`
 * detail, invisible to the rest of the app.
 */
export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(model: string = DEFAULT_MODEL, client: GoogleGenAI = buildClient()) {
    this.client = client;
    this.model = model;
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    // Multimodal calls (e.g. transcribing a photo/PDF of a written answer) pass the
    // file parts first, then the text instruction, as a single user turn. Text-only
    // calls keep passing the plain string.
    const contents = request.files?.length
      ? [
          ...request.files.map((f) => ({ inlineData: { mimeType: f.mimeType, data: f.data } })),
          { text: request.prompt },
        ]
      : request.prompt;

    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        ...(request.system ? { systemInstruction: request.system } : {}),
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
        ...(request.responseFormat === "json"
          ? { responseMimeType: "application/json" }
          : {}),
        ...(request.signal ? { abortSignal: request.signal } : {}),
      },
    });

    const text = response.text ?? "";
    if (!text) {
      // Empty body usually means a safety block or an aborted/truncated call;
      // surface it so the service can retry or fail loudly rather than handing
      // back a silent empty grading.
      throw new Error(
        `Gemini returned no text (finishReason=${response.candidates?.[0]?.finishReason ?? "unknown"}).`,
      );
    }

    return {
      text,
      model: this.model,
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount,
        outputTokens: response.usageMetadata?.candidatesTokenCount,
      },
    };
  }
}
