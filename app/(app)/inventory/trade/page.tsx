import { createClient } from "@/lib/supabase/server";
import { TradeForm } from "./trade-form";
import type { Team } from "@/lib/types";

export default async function TradePage({
  searchParams,
}: {
  searchParams: Promise<{ from_team_id?: string; catalog_item_id?: string; catalog_item_name?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: teams } = await supabase.from("teams").select("*").order("name");
  return (
    <TradeForm
      teams={(teams as Team[]) ?? []}
      defaultFromTeamId={sp.from_team_id}
      defaultCatalogItemId={sp.catalog_item_id}
      defaultCatalogItemName={sp.catalog_item_name}
    />
  );
}
