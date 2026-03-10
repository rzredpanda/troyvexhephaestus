"use client";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Search, X } from "lucide-react";
import type { CatalogItem } from "@/lib/types";

interface Props {
  initialItems: CatalogItem[];
  categories: string[];
}

export function CatalogSearch({ initialItems, categories }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [results, setResults] = useState<CatalogItem[]>(initialItems);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (q: string, cat: string | null) => {
    // Filter locally first for instant response
    let local = initialItems;
    if (cat) local = local.filter((i) => i.category === cat);
    if (q.length < 2) { setResults(local); return; }

    setSearching(true);
    try {
      const params = new URLSearchParams({ q, limit: "100" });
      if (cat) params.set("category", cat);
      const res = await fetch(`/api/catalog/search?${params}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [initialItems]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query, activeCategory), 180);
    return () => clearTimeout(t);
  }, [query, activeCategory, doSearch]);

  // Category-only filtering (instant, no network)
  function handleCategory(cat: string) {
    const next = activeCategory === cat ? null : cat;
    setActiveCategory(next);
    if (query.length < 2) {
      setResults(next ? initialItems.filter((i) => i.category === next) : initialItems);
    }
  }

  const shown = results;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, SKU, or part ID…"
          className="pl-9 pr-9"
          autoFocus
        />
        {(query || activeCategory) && (
          <button
            onClick={() => { setQuery(""); setActiveCategory(null); setResults(initialItems); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                activeCategory === cat
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="text-xs text-muted-foreground pb-1">
        {searching ? "Searching…" : `${shown.length} item${shown.length !== 1 ? "s" : ""}`}
      </div>

      <div className="rounded-md border bg-card overflow-x-auto" style={{ boxShadow: "var(--shadow-xs)" }}>
        {shown.length === 0 ? (
          <p className="p-6 text-muted-foreground text-sm text-center">
            {query.length >= 2 || activeCategory ? "No results found." : "No catalog items yet."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {["Name","SKU","Part ID","Category","Unit Price"].map((h, i) => (
                  <th key={h} className={`px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide ${i === 4 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {shown.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium">{item.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{item.sku}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{item.part_id ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {item.category && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                        {item.category}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
