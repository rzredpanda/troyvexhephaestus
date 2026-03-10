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
    <div className={cn("card-elevated", className)}>
      <p className="metric-label">{title}</p>
      <p className={cn(
        "metric-value mt-1",
        variant === "warning" && "text-warning",
        variant === "danger" && "text-destructive"
      )}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
