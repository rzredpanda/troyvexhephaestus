import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const category = url.searchParams.get("category") ?? "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);

  let query = supabase.from("catalog_items").select("*");

  if (q.length >= 2) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,part_id.ilike.%${q}%`);
  }
  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query.order("name").limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
  });
}
