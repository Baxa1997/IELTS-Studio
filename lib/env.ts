/**
 * Centralized, typed environment access.
 *
 * - `NEXT_PUBLIC_*` values are inlined into the browser bundle and safe to read
 *   anywhere.
 * - Everything else is server-only. Reading it from a Client Component will
 *   return `undefined` at best and leak a secret at worst — don't.
 *
 * Validation is lazy: accessing a required value throws if it's missing, but
 * importing this module never does. That keeps the skeleton runnable before any
 * credentials are filled in (e.g. the /api/health route).
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

/** Parse a non-negative integer env var, falling back to a default. */
function intEnv(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

/** Client-safe values (exposed to the browser). */
export const clientEnv = {
  get supabaseUrl(): string {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey(): string {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
};

/** Which Gemini backend the AI service talks to:
 *  - "developer" — AI Studio / Gemini Developer API (a single API key). Default.
 *  - "vertex"    — Google Cloud Vertex AI (project + location, auth via ADC or a
 *                  service-account key). Same models, enterprise auth/quotas. */
export type GeminiBackend = "developer" | "vertex";

function geminiBackend(): GeminiBackend {
  return process.env.GEMINI_BACKEND === "vertex" ? "vertex" : "developer";
}

/** Server-only values. Never reference these from client code. */
export const serverEnv = {
  get supabaseServiceRoleKey(): string {
    return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  },

  get geminiBackend(): GeminiBackend {
    return geminiBackend();
  },

  /** Per-task model routing (CLAUDE.md: route by task, not globally). Grading is
   *  quality-critical, so it can run a stronger model than generation. `fast` is
   *  for cheap, latency-sensitive lookups (e.g. vocabulary translation) and
   *  defaults to flash-lite. Override per task via GEMINI_GRADE_MODEL /
   *  GEMINI_GENERATE_MODEL / GEMINI_FAST_MODEL, or set GEMINI_MODEL for all.
   *  Defaults to the stable 2.5-flash when unset. */
  get geminiModels(): { grade: string; generate: string; fast: string } {
    const fallback = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    return {
      grade: process.env.GEMINI_GRADE_MODEL ?? fallback,
      generate: process.env.GEMINI_GENERATE_MODEL ?? fallback,
      fast: process.env.GEMINI_FAST_MODEL ?? "gemini-2.5-flash-lite",
    };
  },

  // ── Gemini Developer API (backend = "developer") ──
  get geminiApiKey(): string {
    return required("GEMINI_API_KEY", process.env.GEMINI_API_KEY);
  },

  // ── Vertex AI (backend = "vertex") ──
  get googleCloudProject(): string {
    return required(
      "GOOGLE_CLOUD_PROJECT",
      process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GOOGLE_VERTEX_PROJECT,
    );
  },
  get googleCloudLocation(): string {
    return process.env.GOOGLE_CLOUD_LOCATION ?? process.env.GOOGLE_VERTEX_LOCATION ?? "global";
  },
  /** Optional inline service-account key JSON. When absent, Vertex falls back to
   *  Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS, or the SA
   *  attached to the runtime). Best for serverless where you can't ship a file. */
  get googleVertexCredentials(): Record<string, unknown> | undefined {
    const raw = process.env.GOOGLE_VERTEX_CREDENTIALS;
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(
        "GOOGLE_VERTEX_CREDENTIALS must be the service-account key JSON, stringified.",
      );
    }
  },

  /** Keyless Vertex auth via Workload Identity Federation. Opt-in with
   *  GEMINI_VERTEX_AUTH=wif (for serverless like Vercel, where downloadable SA
   *  keys are often blocked by org policy). The runtime's OIDC token is exchanged
   *  for short-lived GCP credentials — no key file. Returns null when not enabled,
   *  so local dev keeps using gcloud ADC / GOOGLE_VERTEX_CREDENTIALS unchanged. */
  get vertexWif(): {
    projectNumber: string;
    poolId: string;
    providerId: string;
    serviceAccountEmail: string;
  } | null {
    if (process.env.GEMINI_VERTEX_AUTH !== "wif") return null;
    return {
      projectNumber: required("GCP_PROJECT_NUMBER", process.env.GCP_PROJECT_NUMBER),
      poolId: required("GCP_WORKLOAD_IDENTITY_POOL_ID", process.env.GCP_WORKLOAD_IDENTITY_POOL_ID),
      providerId: required(
        "GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID",
        process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID,
      ),
      serviceAccountEmail: required(
        "GCP_SERVICE_ACCOUNT_EMAIL",
        process.env.GCP_SERVICE_ACCOUNT_EMAIL,
      ),
    };
  },

  // ── Observability: Langfuse (optional) ──
  /** Langfuse ingestion config, or null when not set (tracing no-ops). */
  get langfuse(): { host: string; publicKey: string; secretKey: string } | null {
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    if (!publicKey || !secretKey) return null;
    return {
      host: process.env.LANGFUSE_HOST ?? "https://cloud.langfuse.com",
      publicKey,
      secretKey,
    };
  },

  // ── Billing providers (optional; each gates its own integration) ──
  get stripe(): { secretKey: string; webhookSecret: string } | null {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) return null;
    return { secretKey, webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "" };
  },
  get payme(): { merchantId: string; key: string } | null {
    const merchantId = process.env.PAYME_MERCHANT_ID;
    const key = process.env.PAYME_KEY;
    if (!merchantId || !key) return null;
    return { merchantId, key };
  },
  get click(): { serviceId: string; merchantId: string; secretKey: string } | null {
    const serviceId = process.env.CLICK_SERVICE_ID;
    const merchantId = process.env.CLICK_MERCHANT_ID;
    const secretKey = process.env.CLICK_SECRET_KEY;
    if (!serviceId || !merchantId || !secretKey) return null;
    return { serviceId, merchantId, secretKey };
  },

  /** Shared secret guarding internal cron/worker endpoints (the queue drainer). */
  get cronSecret(): string | undefined {
    return process.env.CRON_SECRET;
  },

  /** Public no-login grader limits. perIp/global are rolling-window ceilings; the
   *  salt fingerprints IPs before they're stored. Sensible defaults so the funnel
   *  works out of the box; tune via env in production. */
  get publicGrader(): { perIp: number; global: number; windowHours: number; salt: string } {
    return {
      perIp: intEnv(process.env.PUBLIC_GRADER_PER_IP, 3),
      global: intEnv(process.env.PUBLIC_GRADER_GLOBAL, 500),
      windowHours: intEnv(process.env.PUBLIC_GRADER_WINDOW_HOURS, 24),
      salt: process.env.PUBLIC_GRADER_SALT ?? process.env.CRON_SECRET ?? "ielts-public-grader",
    };
  },

  /** Public base URL, for building billing return/callback URLs. */
  get siteUrl(): string {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  },
};

/** Non-throwing checks — useful for health probes and conditional wiring. */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isAiConfigured(): boolean {
  if (geminiBackend() === "vertex") {
    return Boolean(process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GOOGLE_VERTEX_PROJECT);
  }
  return Boolean(process.env.GEMINI_API_KEY);
}
