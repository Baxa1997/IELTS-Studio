import { NextResponse } from "next/server";

import { isAiConfigured, isSupabaseConfigured } from "@/lib/env";

// Always evaluate at request time so the config checks reflect the live env.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "ielts-app",
    timestamp: new Date().toISOString(),
    checks: {
      supabaseConfigured: isSupabaseConfigured(),
      aiConfigured: isAiConfigured(),
    },
  });
}
