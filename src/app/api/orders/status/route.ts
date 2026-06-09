import { NextResponse } from "next/server";
import { createClient } from "@/server/supabase";

/**
 * GET /api/orders/status?reference=lumen_xxx — lightweight status poll for the
 * checkout callback page (the Paystack redirect carries the reference, not our
 * order id). RLS ("orders read own") scopes the read to the signed-in owner, so
 * this leaks nothing about other users' orders.
 */
export async function GET(req: Request) {
  const reference = new URL(req.url).searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id, status")
    .eq("payment_reference", reference)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ orderId: data.id, status: data.status });
}
