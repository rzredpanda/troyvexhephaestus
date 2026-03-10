"use client";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import type { InventoryLog } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface Props {
  logs: InventoryLog[];
  showActions?: boolean;
  onStatusChange?: () => void;
}

export function LogTable({ logs, showActions = false, onStatusChange }: Props) {
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    setUpdating(id);
    const res = await fetch("/api/logs/approved", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) toast.error("Failed to update status");
    else {
      toast.success(`Log ${status}`);
      onStatusChange?.();
    }
    setUpdating(null);
  }

  if (logs.length === 0) {
    return (
      <div className="card-elevated text-center py-12">
        <p className="text-muted-foreground">No logs found.</p>
      </div>
    );
  }

  return (
    <div className="card-elevated overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-3 text-left font-semibold">Date</th>
            <th className="px-4 py-3 text-left font-semibold">Action</th>
            <th className="px-4 py-3 text-left font-semibold">Part</th>
            <th className="px-4 py-3 text-left font-semibold">Team</th>
            <th className="px-4 py-3 text-left font-semibold">User</th>
            <th className="px-4 py-3 text-right font-semibold">Qty</th>
            <th className="px-4 py-3 text-center font-semibold">Status</th>
            {showActions && <th className="px-4 py-3 text-center font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {formatDate(log.created_at)}
              </td>
              <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{(log as any).catalog_item?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{(log as any).catalog_item?.sku ?? ""}</p>
              </td>
              <td className="px-4 py-3">{(log as any).team?.name ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {(log as any).profile?.full_name || (log as any).profile?.email || "—"}
              </td>
              <td className="px-4 py-3 text-right font-semibold">{log.quantity}</td>
              <td className="px-4 py-3 text-center">
                <StatusBadge status={log.status} />
              </td>
              {showActions && log.status === "attempted" && (
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-success text-success hover:bg-success/10"
                      disabled={updating === log.id}
                      onClick={() => updateStatus(log.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-destructive text-destructive hover:bg-destructive/10"
                      disabled={updating === log.id}
                      onClick={() => updateStatus(log.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              )}
              {showActions && log.status !== "attempted" && (
                <td className="px-4 py-3 text-center text-muted-foreground text-xs">—</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
