import { createClient } from "@/lib/supabase/server";
import { LogTable } from "@/components/logs/log-table";
import type { InventoryLog } from "@/lib/types";

export default async function ApprovedLogsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_logs")
    .select("*, profile:profiles(full_name,email), catalog_item:catalog_items(name,sku), team:teams(name)")
    .in("status", ["approved", "rejected"])
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">Approved / Rejected Logs</h1>
      <LogTable logs={(data as InventoryLog[]) ?? []} />
    </div>
  );
}
