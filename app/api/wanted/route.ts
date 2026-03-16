import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const teamId = new URL(req.url).searchParams.get("team_id");
  let q = supabase
    .from("wanted_items")
    .select("*, catalog_item:catalog_items(*), team:teams(name)")
    .order("created_at", { ascending: false });
  if (teamId) q = q.eq("team_id", teamId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  // Prevent duplicate entries for the same team + catalog item
  const { data: existing } = await supabase
    .from("wanted_items")
    .select("id")
    .eq("catalog_item_id", body.catalog_item_id)
    .eq("team_id", body.team_id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Already in wanted list for this team" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("wanted_items")
    .insert(body)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const { error } = await supabase.from("wanted_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
