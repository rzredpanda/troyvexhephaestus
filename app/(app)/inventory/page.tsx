import { createClient } from "@/lib/supabase/server";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { ScopeFilter } from "@/components/shared/scope-filter";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";
import type { InventoryItem, Team } from "@/lib/types";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ team_id?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [teamsRes, invRes] = await Promise.all([
    supabase.from("teams").select("*").order("name"),
    sp.team_id
      ? supabase.from("inventory").select("*, catalog_item:catalog_items(*), team:teams(*)").eq("team_id", sp.team_id).order("updated_at", { ascending: false })
      : supabase.from("inventory").select("*, catalog_item:catalog_items(*), team:teams(*)").order("updated_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading text-3xl font-bold">Inventory</h1>
        <div className="flex items-center gap-3">
          <Suspense>
            <ScopeFilter teams={(teamsRes.data as Team[]) ?? []} />
          </Suspense>
          <Button asChild variant="outline" size="sm">
            <Link href="/inventory/withdraw">Withdraw</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/inventory/return">Return</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/inventory/trade">Trade</Link>
          </Button>
        </div>
      </div>
      <InventoryTable items={(invRes.data as InventoryItem[]) ?? []} />
    </div>
  );
}
