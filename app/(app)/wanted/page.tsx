import { createClient } from "@/lib/supabase/server";
import { WantedClient } from "./wanted-client";

export default async function WantedPage() {
  const supabase = await createClient();
  const [wantedRes, teamsRes] = await Promise.all([
    supabase.from("wanted_items").select("*, catalog_item:catalog_items(*), team:teams(name)").order("created_at", { ascending: false }),
    supabase.from("teams").select("*").order("name"),
  ]);
  return <WantedClient initialItems={wantedRes.data ?? []} teams={teamsRes.data ?? []} />;
}
