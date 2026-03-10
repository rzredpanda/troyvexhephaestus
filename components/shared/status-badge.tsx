import { cn } from "@/lib/utils";
import type { LogStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: LogStatus }) {
  return (
    <span
      className={cn("status-badge", {
        "status-success": status === "approved",
        "status-warning": status === "attempted",
        "status-destructive": status === "rejected",
      })}
    >
      {status}
    </span>
  );
}
