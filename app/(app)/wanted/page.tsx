"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Team, CatalogItem } from "@/lib/types";

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

export default function WantedPage() {
  const [items, setItems] = useState<WantedItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ team_id: "", catalog_item_id: "", quantity_needed: 1, priority: "medium", note: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/wanted").then((r) => r.json()).then(setItems).catch(() => {});
    fetch("/api/teams").then((r) => r.json()).then(setTeams).catch(() => {});
  }, []);

  useEffect(() => {
    if (search.length < 2) { setCatalogItems([]); return; }
    fetch(`/api/catalog/search?q=${encodeURIComponent(search)}`).then((r) => r.json()).then(setCatalogItems).catch(() => {});
  }, [search]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.team_id || !form.catalog_item_id) { toast.error("Select team and part"); return; }
    setLoading(true);
    const res = await fetch("/api/wanted", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { toast.error("Failed to add"); }
    else {
      toast.success("Added to wanted list");
      const data = await res.json();
      setItems((prev) => [data, ...prev]);
      setForm({ team_id: "", catalog_item_id: "", quantity_needed: 1, priority: "medium", note: "" });
      setSearch("");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/wanted", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
    else toast.error("Failed to delete");
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">Wanted List</h1>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Add Wanted Item</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={form.team_id} onValueChange={(v) => setForm((f) => ({ ...f, team_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>{teams.filter((t) => !t.archived).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Part (search)</Label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search catalog…" />
              {catalogItems.length > 0 && (
                <Select value={form.catalog_item_id} onValueChange={(v) => setForm((f) => ({ ...f, catalog_item_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select part" /></SelectTrigger>
                  <SelectContent>{catalogItems.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — {c.sku}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Quantity Needed</Label>
              <Input type="number" min={1} value={form.quantity_needed} onChange={(e) => setForm((f) => ({ ...f, quantity_needed: parseInt(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["low","medium","high"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Optional note…" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Adding…" : "Add to Wanted List"}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="card-elevated divide-y">
        {items.length === 0 && <p className="py-8 text-center text-muted-foreground">No wanted items yet.</p>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-sm">{item.catalog_item?.name ?? "Unknown part"}</p>
              <p className="text-xs text-muted-foreground">{item.catalog_item?.sku} · {item.team?.name} · qty: {item.quantity_needed}</p>
              {item.note && <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={priorityVariant[item.priority]}>{item.priority}</Badge>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
