"use client";
import { useEffect, useState, useCallback } from "react";
import { LogTable } from "@/components/logs/log-table";
import type { InventoryLog } from "@/lib/types";

export default function AttemptedLogsPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [canApprove, setCanApprove] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const [logsRes, profileRes] = await Promise.all([
      fetch("/api/logs/attempted"),
      fetch("/api/settings"),
    ]);
    const data = await logsRes.json();
    const profile = await profileRes.json();
    setLogs(Array.isArray(data) ? data : []);
    setCanApprove(["admin", "owner"].includes(profile?.role ?? ""));
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">Attempted Logs</h1>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <LogTable logs={logs} showActions={canApprove} onStatusChange={fetchLogs} />
      )}
    </div>
  );
}
