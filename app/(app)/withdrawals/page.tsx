import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { WithdrawalsClient } from "./withdrawals-client";
import type { Team, InventoryLog } from "@/lib/types";

export default async function WithdrawalsPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [teamsRes, logsRes] = await Promise.all([
    supabase.from("teams").select("*").order("name"),
    supabase
      .from("inventory_logs")
      .select("*, profile:profiles(full_name,email), catalog_item:catalog_items(name,sku), team:teams(name)")
      .eq("action", "withdraw")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <WithdrawalsClient
      teams={(teamsRes.data as Team[]) ?? []}
      initialLogs={(logsRes.data as InventoryLog[]) ?? []}
    />
  );
}
