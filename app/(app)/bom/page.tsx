"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Team, CatalogItem } from "@/lib/types";

type BOMItem = {
  id: string;
  bom_name: string;
  team_id: string;
  catalog_item_id: string;
  quantity_needed: number;
  catalog_item?: CatalogItem;
  team?: { name: string };
};

export default function BOMPage() {
  const [items, setItems] = useState<BOMItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ bom_name: "", team_id: "", catalog_item_id: "", quantity_needed: 1 });

  useEffect(() => {
    fetch("/api/bom").then((r) => r.json()).then(setItems).catch(() => {});
    fetch("/api/teams").then((r) => r.json()).then(setTeams).catch(() => {});
  }, []);

  useEffect(() => {
    if (search.length < 2) { setCatalogItems([]); return; }
    fetch(`/api/catalog/search?q=${encodeURIComponent(search)}`).then((r) => r.json()).then(setCatalogItems).catch(() => {});
  }, [search]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/bom", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { toast.error("Failed"); return; }
    const item = await res.json();
    setItems((prev) => [...prev, item]);
    toast.success("Added");
  }

  async function handleDelete(id: string) {
    await fetch("/api/bom", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function exportCSV(bomName: string) {
    const bomItems = items.filter((i) => i.bom_name === bomName);
    const rows = [
      ["Part Name", "SKU", "Team", "Quantity", "Unit Price", "Total"],
      ...bomItems.map((i) => [
        i.catalog_item?.name ?? "",
        i.catalog_item?.sku ?? "",
        i.team?.name ?? "",
        i.quantity_needed,
        i.catalog_item?.unit_price ? i.catalog_item.unit_price / 100 : 0,
        i.catalog_item?.unit_price ? (i.catalog_item.unit_price * i.quantity_needed) / 100 : 0,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `BOM-${bomName}.csv`;
    a.click();
  }

  const grouped = items.reduce<Record<string, BOMItem[]>>((acc, item) => {
    if (!acc[item.bom_name]) acc[item.bom_name] = [];
    acc[item.bom_name].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">Bill of Materials</h1>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Add BOM Item</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>BOM Name</Label>
              <Input value={form.bom_name} onChange={(e) => setForm((f) => ({ ...f, bom_name: e.target.value }))} placeholder="e.g. Competition Robot" required />
            </div>
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
              <Label>Quantity</Label>
              <Input type="number" min={1} value={form.quantity_needed} onChange={(e) => setForm((f) => ({ ...f, quantity_needed: parseInt(e.target.value) }))} />
            </div>
            <Button type="submit" className="w-full">Add to BOM</Button>
          </form>
        </CardContent>
      </Card>

      {Object.entries(grouped).map(([bomName, bomItems]) => {
        const total = bomItems.reduce((s, i) => s + (i.catalog_item?.unit_price ?? 0) * i.quantity_needed, 0);
        return (
          <div key={bomName}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-lg font-semibold">{bomName}</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">Total: {formatCurrency(total)}</span>
                <Button variant="outline" size="sm" onClick={() => exportCSV(bomName)}>
                  <Download className="h-4 w-4 mr-2" />Export CSV
                </Button>
              </div>
            </div>
            <div className="card-elevated divide-y">
              {bomItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">{item.catalog_item?.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{item.catalog_item?.sku} · {item.team?.name} · qty: {item.quantity_needed}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{item.catalog_item?.unit_price ? formatCurrency(item.catalog_item.unit_price * item.quantity_needed) : "—"}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
