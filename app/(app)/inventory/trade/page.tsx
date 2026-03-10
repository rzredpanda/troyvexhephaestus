import { createClient } from "@/lib/supabase/server";
import { TradeForm } from "./trade-form";
import type { Team } from "@/lib/types";

export default async function TradePage() {
  const supabase = await createClient();
  const { data: teams } = await supabase.from("teams").select("*").order("name");
  return <TradeForm teams={(teams as Team[]) ?? []} />;
}
