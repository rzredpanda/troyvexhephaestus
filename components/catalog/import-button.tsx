"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ImportButton() {
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    setLoading(true);
    const res = await fetch("/api/catalog/import/vex", { method: "POST" });
    const data = await res.json();
    if (!res.ok) toast.error(data.error ?? "Import failed");
    else toast.success(data.message ?? `Imported ${data.imported} items`);
    setLoading(false);
  }

  return (
    <Button onClick={handleImport} disabled={loading} variant="outline">
      {loading ? "Importing…" : "Import VEX Catalog"}
    </Button>
  );
}
