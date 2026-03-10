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
import { Plus } from "lucide-react";
import type { Team, CatalogItem, InventoryLog } from "@/lib/types";

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function WithdrawalsClient({ teams, initialLogs }: { teams: Team[]; initialLogs: InventoryLog[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [teamId, setTeamId] = useState("");
  const [catalogItemId, setCatalogItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState("good");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length < 2) { setCatalogItems([]); return; }
    fetch(`/api/catalog/search?q=${encodeURIComponent(search)}`)
      .then((r) => r.json()).then(setCatalogItems).catch(() => {});
  }, [search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId || !catalogItemId) { toast.error("Select a team and part"); return; }
    setLoading(true);
    const res = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: teamId, catalog_item_id: catalogItemId, quantity, condition, note }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Withdrawal failed");
    } else {
      toast.success("Withdrawal recorded");
      setOpen(false);
      setTeamId(""); setCatalogItemId(""); setSearch(""); setQuantity(1); setCondition("good"); setNote("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Withdrawals</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Withdrawal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Withdrawal</DialogTitle></DialogHeader>
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
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for withdrawal…" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting…" : "Submit Withdrawal"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="card-elevated overflow-hidden p-0">
        {initialLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No withdrawals yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold">Part</th>
                <th className="px-4 py-3 text-left font-semibold">Team</th>
                <th className="px-4 py-3 text-left font-semibold">By</th>
                <th className="px-4 py-3 text-right font-semibold">Qty</th>
                <th className="px-4 py-3 text-left font-semibold">Condition</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {initialLogs.map((log) => (
                <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{log.catalog_item?.name ?? "—"}</td>
                  <td className="px-4 py-3">{log.team?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{log.profile?.full_name || log.profile?.email || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{log.quantity}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{log.condition ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={log.status === "approved" ? "outline" : log.status === "rejected" ? "destructive" : "secondary"}
                      className={log.status === "approved" ? "border-success text-success" : ""}
                    >
                      {log.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
