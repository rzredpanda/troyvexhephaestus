import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { CatalogSearch } from "@/components/catalog/catalog-search";
import { ImportButton } from "@/components/catalog/import-button";
import type { CatalogItem } from "@/lib/types";

export default async function CatalogPage() {
  const supabase = await createClient();
  const profile = await getProfile();

  const [itemsRes, teamsRes, wantedRes] = await Promise.all([
    supabase.from("catalog_items").select("*").order("category").order("name"),
    supabase.from("teams").select("*").order("name"),
    supabase.from("wanted_items").select("id, catalog_item_id, team_id, quantity_needed, priority"),
  ]);

  const all = (itemsRes.data as CatalogItem[]) ?? [];
  const categories = [...new Set(all.map((i) => i.category).filter(Boolean))].sort() as string[];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Catalog</h1>
        {(profile?.role === "owner" || profile?.role === "admin") && <ImportButton />}
      </div>
      <CatalogSearch
        initialItems={all}
        categories={categories}
        teams={teamsRes.data ?? []}
        profile={profile}
        initialWanted={wantedRes.data ?? []}
      />
    </div>
  );
}
