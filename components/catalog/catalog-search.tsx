"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Search, X, Heart } from "lucide-react";
import type { CatalogItem, Team, Profile } from "@/lib/types";

type WantedEntry = {
  id: string;
  catalog_item_id: string;
  team_id: string;
  quantity_needed: number;
  priority: string;
};

type HeartPop = {
  itemId: string;
  top: number;
  right: number;
};

interface Props {
  initialItems: CatalogItem[];
  categories: string[];
  teams: Team[];
  profile: Profile | null;
  initialWanted: WantedEntry[];
}

const PRIORITIES = ["Low", "Medium", "High"] as const;

export function CatalogSearch({ initialItems, categories, teams, profile, initialWanted }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [results, setResults] = useState<CatalogItem[]>(initialItems);
  const [searching, setSearching] = useState(false);

  // wanted state
  const [wantedMap, setWantedMap] = useState<Map<string, WantedEntry[]>>(() => {
    const m = new Map<string, WantedEntry[]>();
    for (const w of initialWanted) {
      const arr = m.get(w.catalog_item_id) ?? [];
      arr.push(w);
      m.set(w.catalog_item_id, arr);
    }
    return m;
  });

  // heart popover
  const [heartPop, setHeartPop] = useState<HeartPop | null>(null);
  const [popTeamId, setPopTeamId] = useState("");
  const [popQty, setPopQty] = useState(1);
  const [popPriority, setPopPriority] = useState("Medium");
  const [popLoading, setPopLoading] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  // default team when popover opens
  useEffect(() => {
    if (heartPop) {
      setPopTeamId(profile?.team_id ?? teams[0]?.id ?? "");
      setPopQty(1);
      setPopPriority("Medium");
    }
  }, [heartPop?.itemId]);

  // close popover on outside click
  useEffect(() => {
    if (!heartPop) return;
    function onDown(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setHeartPop(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [heartPop]);

  const doSearch = useCallback(async (q: string, cat: string | null) => {
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

  function handleCategory(cat: string) {
    const next = activeCategory === cat ? null : cat;
    setActiveCategory(next);
    if (query.length < 2) {
      setResults(next ? initialItems.filter((i) => i.category === next) : initialItems);
    }
  }

  function isHearted(itemId: string) {
    return (wantedMap.get(itemId)?.length ?? 0) > 0;
  }

  function openHeartPop(e: React.MouseEvent<HTMLButtonElement>, itemId: string) {
    const rect = e.currentTarget.getBoundingClientRect();
    setHeartPop({ itemId, top: rect.bottom + 8, right: window.innerWidth - rect.right });
  }

  async function handleHeartClick(e: React.MouseEvent<HTMLButtonElement>, item: CatalogItem) {
    if (isHearted(item.id)) {
      // Remove — delete the first matching entry (prefer user's team)
      const entries = wantedMap.get(item.id) ?? [];
      const target = entries.find((w) => w.team_id === profile?.team_id) ?? entries[0];
      if (!target) return;
      const res = await fetch("/api/wanted", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: target.id }),
      });
      if (res.ok) {
        setWantedMap((prev) => {
          const next = new Map(prev);
          const remaining = (next.get(item.id) ?? []).filter((w) => w.id !== target.id);
          if (remaining.length === 0) next.delete(item.id);
          else next.set(item.id, remaining);
          return next;
        });
      }
    } else {
      openHeartPop(e, item.id);
    }
  }

  async function handlePopAdd() {
    if (!heartPop || !popTeamId) return;
    setPopLoading(true);
    const res = await fetch("/api/wanted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        catalog_item_id: heartPop.itemId,
        team_id: popTeamId,
        quantity_needed: popQty,
        priority: popPriority.toLowerCase(),
      }),
    });
    if (res.ok) {
      const data: WantedEntry = await res.json();
      setWantedMap((prev) => {
        const next = new Map(prev);
        const arr = next.get(heartPop.itemId) ?? [];
        next.set(heartPop.itemId, [...arr, data]);
        return next;
      });
      setHeartPop(null);
    }
    setPopLoading(false);
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
                {["Name", "SKU", "Part ID", "Category", "Unit Price", ""].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide ${
                      i === 4 ? "text-right" : i === 5 ? "w-10" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {shown.map((item) => {
                const hearted = isHearted(item.id);
                return (
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
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={(e) => handleHeartClick(e, item)}
                        className={`transition-colors ${
                          hearted
                            ? "text-rose-500 hover:text-rose-400"
                            : "text-muted-foreground hover:text-rose-400"
                        }`}
                        title={hearted ? "Remove from wanted" : "Add to wanted"}
                      >
                        <Heart className={`h-4 w-4 ${hearted ? "fill-rose-500" : ""}`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Heart popover */}
      {heartPop && (
        <div
          ref={popRef}
          style={{ position: "fixed", top: heartPop.top, right: heartPop.right, zIndex: 100 }}
          className="bg-popover border rounded-lg shadow-lg p-4 w-56 space-y-3"
        >
          <p className="text-xs font-semibold text-foreground">Add to Wanted List</p>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Team</label>
            <Select value={popTeamId} onValueChange={setPopTeamId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select team" /></SelectTrigger>
              <SelectContent>
                {teams.filter((t) => !t.archived).map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Qty needed</label>
            <Input
              type="number"
              min={1}
              value={popQty}
              onChange={(e) => setPopQty(parseInt(e.target.value, 10) || 1)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Priority</label>
            <Select value={popPriority} onValueChange={setPopPriority}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1 h-7 text-xs" onClick={handlePopAdd} disabled={popLoading || !popTeamId}>
              {popLoading ? "Adding…" : "Add"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setHeartPop(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
