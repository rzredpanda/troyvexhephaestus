import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("team_id");

  let q = supabase
    .from("inventory")
    .select("*, catalog_item:catalog_items(*), team:teams(*)")
    .order("updated_at", { ascending: false });

  if (teamId) q = q.eq("team_id", teamId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "owner"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Admin or owner required" }, { status: 403 });
  }
  const body = await req.json();
  const { data, error } = await supabase
    .from("inventory")
    .upsert(body, { onConflict: "team_id,catalog_item_id" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
