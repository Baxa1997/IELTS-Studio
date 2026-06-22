import "server-only";

import { GoogleGenAI, type GoogleGenAIOptions } from "@google/genai";
import { getVercelOidcToken } from "@vercel/functions/oidc";
import { ExternalAccountClient } from "google-auth-library";

import { serverEnv } from "@/lib/env";

import type { AIProvider, CompletionRequest, CompletionResult } from "./provider";

/** v1 engine. One model for now; the service can route per-task later. Same
 *  model id works on both the Developer API and Vertex AI. */
const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Build the GenAI client for the configured backend:
 *   - "developer" — Gemini Developer API, authed with GEMINI_API_KEY.
 *   - "vertex"    — Vertex AI, authed with project/location + one of:
 *                     • Workload Identity Federation (GEMINI_VERTEX_AUTH=wif) —
 *                       keyless; exchanges the platform OIDC token for GCP creds
 *                       (Vercel/serverless, where SA key files are policy-blocked),
 *                     • an inline service-account key (GOOGLE_VERTEX_CREDENTIALS),
 *                     • or ADC (gcloud login / attached SA) when neither is set.
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

    const wif = serverEnv.vertexWif;
    if (wif) {
      options.googleAuthOptions = { authClient: buildWifAuthClient(wif) };
      return new GoogleGenAI(options);
    }

    const credentials = serverEnv.googleVertexCredentials;
    if (credentials) {
      type Creds = NonNullable<GoogleGenAIOptions["googleAuthOptions"]>["credentials"];
      options.googleAuthOptions = { credentials: credentials as Creds };
    } else if (process.env.VERCEL) {
      // On Vercel there's no ADC to fall back on, so a Vertex client with no WIF and
      // no key would fail later with an opaque "Could not load the default
      // credentials." Fail fast with exactly what's missing instead.
      throw new Error(
        "Vertex on Vercel has no usable credentials. " +
          `GEMINI_VERTEX_AUTH=${JSON.stringify(process.env.GEMINI_VERTEX_AUTH ?? null)}; ` +
          `WIF vars present: ${JSON.stringify({
            GCP_PROJECT_NUMBER: Boolean(process.env.GCP_PROJECT_NUMBER),
            GCP_WORKLOAD_IDENTITY_POOL_ID: Boolean(process.env.GCP_WORKLOAD_IDENTITY_POOL_ID),
            GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID: Boolean(
              process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID,
            ),
            GCP_SERVICE_ACCOUNT_EMAIL: Boolean(process.env.GCP_SERVICE_ACCOUNT_EMAIL),
          })}. Set all GCP_* WIF vars (and GEMINI_VERTEX_AUTH=wif) for Production, then redeploy.`,
      );
    }
    return new GoogleGenAI(options);
  }
  return new GoogleGenAI({ apiKey: serverEnv.geminiApiKey });
}

/**
 * Keyless Vertex auth (Workload Identity Federation). Builds a Google
 * ExternalAccountClient that trades the runtime's OIDC token for a short-lived,
 * impersonated service-account access token — no downloadable key. The subject
 * token is supplied per-request by Vercel's OIDC helper.
 *
 * `getVercelOidcToken` is imported statically (not `require`d lazily): under
 * Turbopack a dynamic require of a subpath export can fail to be traced into the
 * serverless bundle, which previously made the auth client silently fall back to
 * GCE metadata lookup (the `MetadataLookupWarning` → 404). A static import is
 * always bundled; the module has no import-time side effects, so local/non-WIF
 * builds that never call this function are unaffected.
 */
type VertexWifConfig = NonNullable<typeof serverEnv.vertexWif>;

function buildWifAuthClient(wif: VertexWifConfig) {
  const authClient = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${wif.projectNumber}/locations/global/workloadIdentityPools/${wif.poolId}/providers/${wif.providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/serviceAccounts/${wif.serviceAccountEmail}:generateAccessToken`,
    subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() },
  });
  if (!authClient) {
    throw new Error("Failed to build Vertex Workload Identity Federation auth client.");
  }
  return authClient;
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
