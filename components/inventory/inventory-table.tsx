"use client";
import type { InventoryItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Props {
  items: InventoryItem[];
}

export function InventoryTable({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="card-elevated text-center py-12">
        <p className="text-muted-foreground">No inventory items yet.</p>
      </div>
    );
  }

  return (
    <div className="card-elevated overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-3 text-left font-semibold">Part</th>
            <th className="px-4 py-3 text-left font-semibold">SKU</th>
            <th className="px-4 py-3 text-left font-semibold">Team</th>
            <th className="px-4 py-3 text-left font-semibold">Room</th>
            <th className="px-4 py-3 text-right font-semibold">Qty</th>
            <th className="px-4 py-3 text-right font-semibold">Min</th>
            <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
            <th className="px-4 py-3 text-center font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isOut = item.quantity === 0;
            const isLow = item.quantity > 0 && item.quantity <= item.threshold;
            return (
              <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{item.catalog_item?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{item.catalog_item?.sku ?? "—"}</td>
                <td className="px-4 py-3">{item.team?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.room ?? "—"}</td>
                <td className="px-4 py-3 text-right font-semibold">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{item.threshold}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {item.catalog_item?.unit_price != null ? formatCurrency(item.catalog_item.unit_price) : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  {isOut ? (
                    <Badge variant="destructive">Out</Badge>
                  ) : isLow ? (
                    <Badge variant="outline" className="border-warning text-warning">Low</Badge>
                  ) : (
                    <Badge variant="outline" className="border-success text-success">OK</Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
