import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { from_team_id, to_team_id, catalog_item_id, quantity, note } = await req.json();

  const { data, error } = await getAdminClient().rpc("process_trade", {
    p_from_team_id: from_team_id,
    p_to_team_id: to_team_id,
    p_catalog_item_id: catalog_item_id,
    p_quantity: quantity,
    p_user_id: user.id,
    p_note: note ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
