"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { CatalogItem } from "@/lib/types";

interface Props {
  initialItems: CatalogItem[];
}

export function CatalogSearch({ initialItems }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogItem[]>(initialItems);
  const [searching, setSearching] = useState(false);

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) { setResults(initialItems); return; }
    setSearching(true);
    const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
    setSearching(false);
  }

  return (
    <div className="space-y-4">
      <Input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search by name, SKU, or part ID…"
        className="max-w-md"
      />
      {searching && <p className="text-sm text-muted-foreground">Searching…</p>}
      <div className="card-elevated overflow-hidden p-0">
        {results.length === 0 ? (
          <p className="p-6 text-muted-foreground text-sm">
            {query.length >= 2 ? "No results found." : "No catalog items yet. Import the VEX catalog to get started."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">SKU</th>
                <th className="px-4 py-3 text-left font-semibold">Part ID</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.part_id ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.category ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
