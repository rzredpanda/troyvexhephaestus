import { createClient } from "@/lib/supabase/server";
import { LogTable } from "@/components/logs/log-table";
import { ScopeFilter } from "@/components/shared/scope-filter";
import { Suspense } from "react";
import type { InventoryLog, Team } from "@/lib/types";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ team_id?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [teamsRes, logsRes] = await Promise.all([
    supabase.from("teams").select("*").order("name"),
    sp.team_id
      ? supabase
          .from("inventory_logs")
          .select("*, profile:profiles(full_name,email), catalog_item:catalog_items(name,sku), team:teams(name)")
          .eq("team_id", sp.team_id)
          .order("created_at", { ascending: false })
          .limit(200)
      : supabase
          .from("inventory_logs")
          .select("*, profile:profiles(full_name,email), catalog_item:catalog_items(name,sku), team:teams(name)")
          .order("created_at", { ascending: false })
          .limit(200),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">History</h1>
        <Suspense>
          <ScopeFilter teams={(teamsRes.data as Team[]) ?? []} />
        </Suspense>
      </div>
      <LogTable logs={(logsRes.data as InventoryLog[]) ?? []} />
    </div>
  );
}
