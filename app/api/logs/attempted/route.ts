import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("team_id");

  let q = supabase
    .from("inventory_logs")
    .select(`*, profile:profiles(full_name, email), catalog_item:catalog_items(name, sku), team:teams(name)`)
    .eq("status", "attempted")
    .order("created_at", { ascending: false })
    .limit(200);

  if (teamId) q = q.eq("team_id", teamId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
