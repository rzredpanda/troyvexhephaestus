"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

type PreviewRow = { sku: string; name: string; unit_price: number };
type ErrorRow = { row: number; message: string };

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [committed, setCommitted] = useState(false);

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setPreview(null);
    setErrors([]);
    setCommitted(false);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("commit", "false");
    const res = await fetch("/api/import/csv", { method: "POST", body: fd });
    const data = await res.json();
    if (data.errors?.length > 0) {
      setErrors(data.errors);
      toast.error(`${data.errors.length} validation error(s) found`);
    } else {
      setPreview(data.preview);
      toast.success(`${data.preview.length} rows ready to import`);
    }
    setLoading(false);
  }

  async function handleCommit() {
    if (!file || !preview) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("commit", "true");
    const res = await fetch("/api/import/csv", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok || data.errors?.length > 0) {
      toast.error(data.error ?? "Commit failed");
    } else {
      toast.success(`Imported ${data.imported} items`);
      setCommitted(true);
      setPreview(null);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-heading text-3xl font-bold">CSV Import</h1>
      <p className="text-muted-foreground text-sm">
        Upload a CSV with columns: <code className="font-mono bg-muted px-1 rounded">sku, name, unit_price</code>. Preview is shown before committing.
      </p>

      <Card>
        <CardHeader><CardTitle>Upload CSV</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handlePreview} className="space-y-4">
            <div className="space-y-2">
              <Label>CSV File</Label>
              <Input type="file" accept=".csv" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); setErrors([]); }} />
            </div>
            <Button type="submit" disabled={!file || loading}>{loading ? "Processing…" : "Preview"}</Button>
          </form>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <div className="card-elevated space-y-2">
          <h2 className="font-semibold text-destructive">Validation Errors — fix and re-upload</h2>
          {errors.map((e) => (
            <div key={e.row} className="flex items-center gap-3 text-sm">
              <Badge variant="destructive">Row {e.row}</Badge>
              <span>{e.message}</span>
            </div>
          ))}
        </div>
      )}

      {preview && preview.length > 0 && !committed && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Preview ({preview.length} rows)</h2>
            <Button onClick={handleCommit} disabled={loading}>
              {loading ? "Importing…" : `Import ${preview.length} Items`}
            </Button>
          </div>
          <div className="card-elevated overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{row.sku}</td>
                    <td className="px-4 py-2">{row.name}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(row.unit_price)}</td>
                  </tr>
                ))}
                {preview.length > 50 && (
                  <tr><td colSpan={3} className="px-4 py-2 text-center text-muted-foreground text-xs">...and {preview.length - 50} more rows</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {committed && (
        <div className="card-elevated text-center py-8">
          <p className="text-success font-semibold">Import complete!</p>
          <p className="text-sm text-muted-foreground mt-1">Items are now available in the Catalog.</p>
        </div>
      )}
    </div>
  );
}
