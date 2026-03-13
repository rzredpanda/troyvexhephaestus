"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { CatalogItem } from "@/lib/types";

type WantedItem = {
  id: string;
  team_id: string;
  catalog_item_id: string;
  quantity_needed: number;
  priority: "low" | "medium" | "high";
  note: string | null;
  created_at: string;
  catalog_item?: CatalogItem;
  team?: { name: string };
};

const priorityVariant: Record<string, "outline" | "default" | "destructive"> = {
  low: "outline",
  medium: "default",
  high: "destructive",
};

export function WantedClient({ initialItems }: { initialItems: WantedItem[] }) {
  const [items, setItems] = useState<WantedItem[]>(initialItems);

  async function handleDelete(id: string) {
    const res = await fetch("/api/wanted", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
    else toast.error("Failed to remove");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Wanted List</h1>
        <p className="text-sm text-muted-foreground">Heart items in the Catalog to add them here.</p>
      </div>

      <div className="card-elevated divide-y">
        {items.length === 0 && (
          <p className="py-10 text-center text-muted-foreground text-sm">
            No wanted items yet — heart a part from the Catalog.
          </p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-sm">{item.catalog_item?.name ?? "Unknown part"}</p>
              <p className="text-xs text-muted-foreground">
                {item.catalog_item?.sku} · {item.team?.name} · qty: {item.quantity_needed}
              </p>
              {item.note && <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={priorityVariant[item.priority]}>{item.priority}</Badge>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
