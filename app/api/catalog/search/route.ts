import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const q = new URL(req.url).searchParams.get("q") ?? "";

  const { data, error } = await supabase
    .from("catalog_items")
    .select("*")
    .or(`name.ilike.%${q}%,sku.ilike.%${q}%,part_id.ilike.%${q}%`)
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
