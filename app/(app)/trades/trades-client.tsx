"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, ArrowRight } from "lucide-react";
import type { Team, CatalogItem, InventoryLog } from "@/lib/types";

function fmt(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function TradesClient({ teams, initialLogs }: { teams: Team[]; initialLogs: InventoryLog[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [fromTeamId, setFromTeamId] = useState("");
  const [toTeamId, setToTeamId] = useState("");
  const [catalogItemId, setCatalogItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
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
    if (!fromTeamId || !toTeamId || !catalogItemId) { toast.error("Fill all required fields"); return; }
    if (fromTeamId === toTeamId) { toast.error("From and To teams must differ"); return; }
    setLoading(true);
    const res = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_team_id: fromTeamId, to_team_id: toTeamId, catalog_item_id: catalogItemId, quantity, note }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Trade failed");
    } else {
      toast.success("Trade recorded");
      setOpen(false);
      setFromTeamId(""); setToTeamId(""); setCatalogItemId(""); setSearch(""); setQuantity(1); setNote("");
      router.refresh();
    }
    setLoading(false);
  }

  const active = teams.filter((t) => !t.archived);

  // Group logs into trade pairs (trade_out + matching trade_in)
  const tradeOuts = initialLogs.filter((l) => l.action === "trade_out");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Trades</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />New Trade</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Trade</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">From Team</Label>
                  <Select value={fromTeamId} onValueChange={setFromTeamId}>
                    <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                    <SelectContent>{active.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To Team</Label>
                  <Select value={toTeamId} onValueChange={setToTeamId}>
                    <SelectTrigger><SelectValue placeholder="Dest." /></SelectTrigger>
                    <SelectContent>{active.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Search Part</Label>
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or SKU…" />
                {catalogItems.length > 0 && (
                  <Select value={catalogItemId} onValueChange={setCatalogItemId}>
                    <SelectTrigger><SelectValue placeholder="Select part" /></SelectTrigger>
                    <SelectContent>{catalogItems.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — {c.sku}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Quantity</Label>
                  <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Note (optional)</Label>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason…" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Submitting…" : "Submit Trade"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto" style={{ boxShadow: "var(--shadow-xs)" }}>
        {tradeOuts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No trades recorded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Part</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Route</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Qty</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">By</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tradeOuts.map((log) => {
                const toLog = initialLogs.find(
                  (l) => l.action === "trade_in" && l.catalog_item_id === log.catalog_item_id &&
                    Math.abs(new Date(l.created_at).getTime() - new Date(log.created_at).getTime()) < 2000
                );
                return (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{log.catalog_item?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-muted-foreground">{log.team?.name ?? "?"}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                        <span className="text-muted-foreground">{toLog?.team?.name ?? "?"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{log.quantity}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{log.profile?.full_name || log.profile?.email || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={log.status === "approved" ? "outline" : log.status === "rejected" ? "destructive" : "secondary"}
                        className={log.status === "approved" ? "border-green-200 text-green-700 dark:border-green-900 dark:text-green-400" : ""}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{fmt(log.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
