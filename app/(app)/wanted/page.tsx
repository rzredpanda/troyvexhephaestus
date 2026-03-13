import { createClient } from "@/lib/supabase/server";
import { WantedClient } from "./wanted-client";

export default async function WantedPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wanted_items")
    .select("*, catalog_item:catalog_items(*), team:teams(name)")
    .order("created_at", { ascending: false });
  return <WantedClient initialItems={data ?? []} />;
}
