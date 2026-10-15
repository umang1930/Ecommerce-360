import { ArrowDownRight, ArrowUpRight, IndianRupee, Package, Receipt, ShoppingCart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/lib/dashboard/filters-context";
import { formatCurrency, formatNumber, percentChange } from "@/lib/dashboard/format";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change: number | null;
  support: string;
}

function KpiCard({ icon: Icon, label, value, change, support }: KpiCardProps) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className="card-surface group p-5 transition-shadow hover:shadow-[var(--shadow-card-hover)]">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="size-4" />
        </span>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground tnum">{value}</p>

      <div className="mt-3 flex items-center gap-2 text-xs">
        {change === null ? (
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">
            N/A
          </span>
        ) : (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold tnum",
              positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
        <span className="text-muted-foreground">vs previous period</span>
      </div>

      <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{support}</p>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="card-surface space-y-4 p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function KpiGrid() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  const { metrics } = data;
  const prev = metrics.previousPeriod;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon={ShoppingCart}
        label="Orders"
        value={formatNumber(metrics.orders)}
        change={percentChange(metrics.orders, prev.orders)}
        support="Total confirmed orders"
      />
      <KpiCard
        icon={IndianRupee}
        label="Gross Sales"
        value={formatCurrency(metrics.grossSales)}
        change={percentChange(metrics.grossSales, prev.grossSales)}
        support="Before cancellations"
      />
      <KpiCard
        icon={Package}
        label="Units Sold"
        value={formatNumber(metrics.unitsSold)}
        change={percentChange(metrics.unitsSold, prev.unitsSold)}
        support="Total quantity sold"
      />
      <KpiCard
        icon={Receipt}
        label="Average Order Value"
        value={metrics.averageOrderValue === null ? "N/A" : formatCurrency(metrics.averageOrderValue)}
        change={
          metrics.averageOrderValue === null || prev.averageOrderValue === null
            ? null
            : percentChange(metrics.averageOrderValue, prev.averageOrderValue)
        }
        support="Sales ÷ Orders"
      />
    </div>
  );
}
