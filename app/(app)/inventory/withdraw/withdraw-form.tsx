"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Team, CatalogItem } from "@/lib/types";

const CONDITIONS = ["New", "Good", "Fair", "Damaged"] as const;

export function WithdrawForm({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [results, setResults] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPart, setSelectedPart] = useState<CatalogItem | null>(null);
  const [open, setOpen] = useState(false);
  const [teamId, setTeamId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState("Good");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPart) return;
    if (search.length < 2) { setResults([]); setOpen(false); return; }
    fetch(`/api/catalog/search?q=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((data) => { setResults(data); setOpen(data.length > 0); })
      .catch(() => {});
  }, [search, selectedPart]);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function selectPart(part: CatalogItem) {
    setSelectedPart(part);
    setSearch(part.name);
    setOpen(false);
  }

  function clearPart() {
    setSelectedPart(null);
    setSearch("");
    setResults([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId || !selectedPart) { toast.error("Select a team and part"); return; }
    setLoading(true);
    const res = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team_id: teamId,
        catalog_item_id: selectedPart.id,
        quantity,
        condition: condition.toLowerCase(),
        note,
      }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "Withdrawal failed"); }
    else { toast.success("Withdrawal recorded"); router.push("/inventory"); }
    setLoading(false);
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-3xl font-bold mb-6">Withdraw Parts</h1>
      <Card>
        <CardHeader><CardTitle>Withdrawal Form</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Team */}
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={teamId} onValueChange={setTeamId} required>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {teams.filter((t) => !t.archived).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Part search */}
            <div className="space-y-2">
              <Label>Part</Label>
              <div ref={containerRef} className="relative">
                <div className="relative">
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      if (selectedPart) setSelectedPart(null);
                    }}
                    onFocus={() => { if (results.length > 0 && !selectedPart) setOpen(true); }}
                    placeholder="Search by name or SKU…"
                    className={selectedPart ? "pr-8 text-foreground" : ""}
                  />
                  {selectedPart && (
                    <button
                      type="button"
                      onClick={clearPart}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Clear selection"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Dropdown results */}
                {open && results.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
                    <ul className="max-h-52 overflow-y-auto py-1">
                      {results.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); selectPart(item); }}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left gap-4"
                          >
                            <span className="font-medium truncate">{item.name}</span>
                            <span className="text-xs text-muted-foreground font-mono shrink-0">{item.sku}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Selected part confirmation badge */}
                {selectedPart && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    SKU: <span className="font-mono">{selectedPart.sku}</span>
                    {selectedPart.unit_price > 0 && (
                      <> &middot; ${(selectedPart.unit_price / 100).toFixed(2)}</>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                required
              />
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for withdrawal…" />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting…" : "Submit Withdrawal"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
