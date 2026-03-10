import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { CatalogSearch } from "@/components/catalog/catalog-search";
import { ImportButton } from "@/components/catalog/import-button";
import type { CatalogItem } from "@/lib/types";

export default async function CatalogPage() {
  const supabase = await createClient();
  const profile = await getProfile();

  const { data: items } = await supabase
    .from("catalog_items")
    .select("*")
    .order("name")
    .limit(100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Catalog</h1>
        {profile?.role === "owner" && <ImportButton />}
      </div>
      <CatalogSearch initialItems={(items as CatalogItem[]) ?? []} />
    </div>
  );
}
