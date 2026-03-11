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
    else { toast.success(`Log ${status}`); onStatusChange?.(); }
    setUpdating(null);
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-md border bg-card text-center py-16" style={{ boxShadow: "var(--shadow-xs)" }}>
        <p className="text-muted-foreground text-sm">No logs found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card overflow-x-auto" style={{ boxShadow: "var(--shadow-xs)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            {["Date","Action","Part","Team","User","User ID","Qty","Status"].map((h, i) => (
              <th key={h} className={`px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap ${i >= 5 ? "text-right" : "text-left"} ${h === "Status" ? "text-center" : ""}`}>
                {h}
              </th>
            ))}
            {showActions && <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap text-xs">
                {formatDate(log.created_at)}
              </td>
              <td className="px-4 py-2.5">
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{log.action}</span>
              </td>
              <td className="px-4 py-2.5">
                <p className="font-medium leading-tight">{(log as any).catalog_item?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground font-mono">{(log as any).catalog_item?.sku ?? ""}</p>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{(log as any).team?.name ?? "—"}</td>
              <td className="px-4 py-2.5">
                <p className="text-sm leading-tight">{(log as any).profile?.full_name || (log as any).profile?.email || "—"}</p>
                {(log as any).profile?.email && (log as any).profile?.full_name && (
                  <p className="text-xs text-muted-foreground">{(log as any).profile.email}</p>
                )}
              </td>
              <td className="px-4 py-2.5 text-right">
                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded select-all" title={log.user_id}>
                  {log.user_id.slice(0, 8)}…
                </span>
              </td>
              <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{log.quantity}</td>
              <td className="px-4 py-2.5 text-center">
                <StatusBadge status={log.status} />
              </td>
              {showActions && log.status === "attempted" && (
                <td className="px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Button size="sm" variant="outline"
                      className="h-6 text-[11px] px-2 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
                      disabled={updating === log.id}
                      onClick={() => updateStatus(log.id, "approved")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline"
                      className="h-6 text-[11px] px-2 border-destructive/40 text-destructive hover:bg-destructive/5"
                      disabled={updating === log.id}
                      onClick={() => updateStatus(log.id, "rejected")}>
                      Reject
                    </Button>
                  </div>
                </td>
              )}
              {showActions && log.status !== "attempted" && (
                <td className="px-4 py-2.5 text-center text-muted-foreground text-xs">—</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
