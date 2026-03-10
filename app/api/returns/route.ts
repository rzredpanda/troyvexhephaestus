import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { team_id, catalog_item_id, quantity, condition, note } = await req.json();

  const { data, error } = await adminClient.rpc("process_return", {
    p_team_id: team_id,
    p_catalog_item_id: catalog_item_id,
    p_quantity: quantity,
    p_user_id: user.id,
    p_condition: condition ?? null,
    p_note: note ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
