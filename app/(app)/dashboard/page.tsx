import { createClient } from "@/lib/supabase/server";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ScopeFilter } from "@/components/shared/scope-filter";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import type { Team } from "@/lib/types";

async function DashboardContent({ teamId }: { teamId?: string }) {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

  // Fetch all data in parallel
  const [healthRes, mtdRes, annRes, topPartsRes, reorderRes] = await Promise.all([
    teamId
      ? supabase.from("v_inventory_health").select("*").eq("team_id", teamId)
      : supabase.from("v_inventory_health").select("*"),
    teamId
      ? supabase.from("v_monthly_spend").select("spend_cents").gte("month", monthStart).eq("team_id", teamId)
      : supabase.from("v_monthly_spend").select("spend_cents").gte("month", monthStart),
    teamId
      ? supabase.from("v_monthly_spend").select("spend_cents").gte("month", yearStart).eq("team_id", teamId)
      : supabase.from("v_monthly_spend").select("spend_cents").gte("month", yearStart),
    supabase.from("v_top_parts").select("*").limit(5),
    teamId
      ? supabase.from("v_reorder_recommendations").select("*").eq("team_id", teamId).limit(20)
      : supabase.from("v_reorder_recommendations").select("*").limit(20),
  ]);

  const health = healthRes.data ?? [];
  const totalHealth = health.reduce(
    (a, r) => ({
      total:   a.total   + (r.total_items  ?? 0),
      out:     a.out     + (r.out_of_stock ?? 0),
      low:     a.low     + (r.low_stock    ?? 0),
      healthy: a.healthy + (r.healthy      ?? 0),
    }),
    { total: 0, out: 0, low: 0, healthy: 0 }
  );

  const mtdSpend = (mtdRes.data ?? []).reduce((s, r) => s + (r.spend_cents ?? 0), 0);
  const annSpend = (annRes.data ?? []).reduce((s, r) => s + (r.spend_cents ?? 0), 0);
  const topParts = topPartsRes.data ?? [];
  const reorder  = reorderRes.data ?? [];

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          title="Healthy Items"
          value={String(totalHealth.healthy)}
          sub={`of ${totalHealth.total} total`}
        />
        <MetricCard
          title="Low Stock"
          value={String(totalHealth.low)}
          sub="at or below threshold"
          variant={totalHealth.low > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Out of Stock"
          value={String(totalHealth.out)}
          variant={totalHealth.out > 0 ? "danger" : "default"}
        />
        <MetricCard
          title="MTD Spend"
          value={formatCurrency(mtdSpend)}
          sub={`Annual: ${formatCurrency(annSpend)}`}
        />
      </div>

      {/* Reorder recommendations */}
      {reorder.length > 0 && (
        <div>
          <h2 className="font-heading text-lg font-semibold mb-3">
            Reorder Recommendations
          </h2>
          <div className="card-elevated divide-y divide-border">
            {reorder.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">{r.part_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.sku} · {r.team_name}
                  </p>
                </div>
                <Badge variant="destructive">
                  {r.quantity} / {r.threshold} min
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top cost drivers */}
      {topParts.length > 0 && (
        <div>
          <h2 className="font-heading text-lg font-semibold mb-3">
            Top Cost Drivers (30d)
          </h2>
          <div className="card-elevated divide-y divide-border">
            {topParts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sku}</p>
                </div>
                <span className="font-semibold text-sm">
                  {formatCurrency(p.total_spend_cents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {reorder.length === 0 && totalHealth.total === 0 && (
        <div className="card-elevated text-center py-12">
          <p className="text-muted-foreground">No inventory data yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add items via the Inventory page to see metrics here.
          </p>
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ team_id?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
        <Suspense>
          <ScopeFilter teams={(teams as Team[]) ?? []} />
        </Suspense>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Loading metrics…</p>}>
        <DashboardContent teamId={sp.team_id} />
      </Suspense>
    </div>
  );
}
