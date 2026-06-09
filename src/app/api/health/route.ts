import { NextResponse } from "next/server";
import { createClient } from "@/server/supabase";

/**
 * GET /api/health — liveness + Supabase connectivity for an external uptime
 * monitor (UptimeRobot). Deliberately leaks nothing: no secrets, no DB error
 * text (schema), no version/commit (fingerprinting). Uses the publishable-key
 * (RLS) client — never the secret key (rule 5). 503 when the DB probe fails so
 * the monitor's status-code / keyword check flips.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DB_TIMEOUT_MS = 3000;

export async function GET() {
  let db: "ok" | "error" = "ok";

  try {
    const supabase = await createClient();
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), DB_TIMEOUT_MS),
    );
    // Cheapest possible probe: HEAD count on a public-readable table.
    const probe = supabase
      .from("frame_categories")
      .select("id", { head: true, count: "exact" });
    const { error } = await Promise.race([probe, timeout]);
    if (error) db = "error";
  } catch {
    db = "error";
  }

  const ok = db === "ok";
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      checks: { app: "ok", db },
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
