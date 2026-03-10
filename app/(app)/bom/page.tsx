import { createClient } from "@/lib/supabase/server";
import { BOMClient } from "./bom-client";

export default async function BOMPage() {
  const supabase = await createClient();
  const [bomRes, teamsRes] = await Promise.all([
    supabase.from("bom_items").select("*, catalog_item:catalog_items(*), team:teams(name)").order("bom_name").order("created_at"),
    supabase.from("teams").select("*").order("name"),
  ]);
  return <BOMClient initialItems={bomRes.data ?? []} teams={teamsRes.data ?? []} />;
}
