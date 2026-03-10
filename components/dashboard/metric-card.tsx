import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  sub?: string;
  className?: string;
  variant?: "default" | "warning" | "danger";
}

export function MetricCard({ title, value, sub, className, variant = "default" }: MetricCardProps) {
  return (
    <div className={cn("rounded-md border bg-card p-5", className)} style={{ boxShadow: "var(--shadow-xs)" }}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
      <p className={cn(
        "text-2xl font-semibold mt-2 tabular-nums",
        variant === "warning" && "text-warning",
        variant === "danger" && "text-destructive"
      )}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
