"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Team, CatalogItem } from "@/lib/types";

export function ReturnForm({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPart, setSelectedPart] = useState<CatalogItem | null>(null);
  const [teamId, setTeamId] = useState("");
  const [catalogItemId, setCatalogItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState("good");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length < 2) { setCatalogItems([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/catalog/search?q=${encodeURIComponent(search)}`)
        .then((r) => r.json()).then(setCatalogItems).catch(() => {});
    }, 180);
    return () => clearTimeout(t);
  }, [search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId || !catalogItemId) { toast.error("Select a team and part"); return; }
    setLoading(true);
    const res = await fetch("/api/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: teamId, catalog_item_id: catalogItemId, quantity, condition, note }),
    });
    const data = await res.json();
    if (!res.ok) toast.error(data.error ?? "Return failed");
    else { toast.success("Return recorded"); router.push("/inventory"); }
    setLoading(false);
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-3xl font-bold mb-6">Return Parts</h1>
      <Card>
        <CardHeader><CardTitle>Return Form</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {teams.filter((t) => !t.archived).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search Part</Label>
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setSelectedPart(null); setCatalogItemId(""); }} placeholder="Search by name or SKU…" />
              {catalogItems.length > 0 && (
                <Select value={catalogItemId} onValueChange={(id) => {
                  setCatalogItemId(id);
                  setSelectedPart(catalogItems.find((c) => c.id === id) ?? null);
                }}>
                  <SelectTrigger><SelectValue placeholder="Select part" /></SelectTrigger>
                  <SelectContent>
                    {catalogItems.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} — {c.sku}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedPart && (
                <p className="mt-1 text-xs text-muted-foreground">
                  SKU: <span className="font-mono">{selectedPart.sku}</span>
                  {selectedPart.unit_price > 0 && (
                    <> &middot; ${(selectedPart.unit_price / 100).toFixed(2)}</>
                  )}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)} required />
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["new", "good", "fair", "damaged"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Condition notes…" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting…" : "Submit Return"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
