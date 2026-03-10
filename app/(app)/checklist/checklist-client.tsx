"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  event_name: string | null;
};

export function ChecklistClient({ initialItems }: { initialItems: ChecklistItem[] }) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [label, setLabel] = useState("");
  const [eventName, setEventName] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    const res = await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim(), event_name: eventName.trim() || null }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [...prev, item]);
      setLabel("");
    } else toast.error("Failed to add");
  }

  async function handleCheck(id: string, checked: boolean) {
    const res = await fetch("/api/checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, checked }),
    });
    if (!res.ok) { toast.error("Failed to update"); return; }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked } : i)));
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/checklist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const grouped = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    const key = item.event_name ?? "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-heading text-3xl font-bold">Event Prep Checklist</h1>

      <form onSubmit={handleAdd} className="flex gap-3 items-end">
        <div className="space-y-1 flex-1">
          <Label>Item</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Checklist item…" />
        </div>
        <div className="space-y-1 w-40">
          <Label>Event</Label>
          <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Event name" />
        </div>
        <Button type="submit" size="icon" className="shrink-0"><Plus className="h-4 w-4" /></Button>
      </form>

      {Object.entries(grouped).map(([event, eventItems]) => (
        <div key={event}>
          <h2 className="font-heading text-lg font-semibold mb-2">{event}</h2>
          <div className="card-elevated divide-y">
            {eventItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={(v) => handleCheck(item.id, !!v)}
                  id={item.id}
                />
                <Label htmlFor={item.id} className={item.checked ? "line-through text-muted-foreground flex-1" : "flex-1 cursor-pointer"}>
                  {item.label}
                </Label>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="card-elevated text-center py-12">
          <p className="text-muted-foreground">No checklist items yet.</p>
        </div>
      )}
    </div>
  );
}
