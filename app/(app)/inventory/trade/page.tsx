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

export default function TradePage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [fromTeamId, setFromTeamId] = useState("");
  const [toTeamId, setToTeamId] = useState("");
  const [catalogItemId, setCatalogItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/teams").then((r) => r.json()).then(setTeams).catch(() => {});
  }, []);

  useEffect(() => {
    if (search.length < 2) { setCatalogItems([]); return; }
    fetch(`/api/catalog/search?q=${encodeURIComponent(search)}`)
      .then((r) => r.json()).then(setCatalogItems).catch(() => {});
  }, [search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromTeamId || !toTeamId || !catalogItemId) { toast.error("Fill all required fields"); return; }
    if (fromTeamId === toTeamId) { toast.error("From and To teams must differ"); return; }
    setLoading(true);
    const res = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_team_id: fromTeamId, to_team_id: toTeamId, catalog_item_id: catalogItemId, quantity, note }),
    });
    const data = await res.json();
    if (!res.ok) toast.error(data.error ?? "Trade failed");
    else { toast.success("Trade recorded"); router.push("/inventory"); }
    setLoading(false);
  }

  const activeTeams = teams.filter((t) => !t.archived);

  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-3xl font-bold mb-6">Trade Parts</h1>
      <Card>
        <CardHeader><CardTitle>Trade Form</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>From Team</Label>
              <Select value={fromTeamId} onValueChange={setFromTeamId}>
                <SelectTrigger><SelectValue placeholder="Select source team" /></SelectTrigger>
                <SelectContent>
                  {activeTeams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Team</Label>
              <Select value={toTeamId} onValueChange={setToTeamId}>
                <SelectTrigger><SelectValue placeholder="Select destination team" /></SelectTrigger>
                <SelectContent>
                  {activeTeams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search Part</Label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or SKU…" />
              {catalogItems.length > 0 && (
                <Select value={catalogItemId} onValueChange={setCatalogItemId}>
                  <SelectTrigger><SelectValue placeholder="Select part" /></SelectTrigger>
                  <SelectContent>
                    {catalogItems.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} — {c.sku}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} required />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for trade…" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting…" : "Submit Trade"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
