"use client";
import { useEffect, useState, useCallback } from "react";
import { LogTable } from "@/components/logs/log-table";
import type { InventoryLog } from "@/lib/types";

export default function AttemptedLogsPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/logs/attempted");
    const data = await res.json();
    setLogs(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">Attempted Logs</h1>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <LogTable logs={logs} showActions onStatusChange={fetchLogs} />
      )}
    </div>
  );
}
