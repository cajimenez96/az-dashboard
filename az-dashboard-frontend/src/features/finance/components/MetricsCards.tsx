"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";

import type { CurrencyCode } from "../api/types";
import { formatCurrency } from "../lib/format-currency";

export interface FinanceMetricSnapshot {
  totalCollected: number;
  cashBalance: number;
  pendingRevenue: number;
  totalBilled: number;
}

export function MetricsCards({
  metrics,
  currency,
  loading,
}: {
  metrics: FinanceMetricSnapshot;
  currency: CurrencyCode;
  loading: boolean;
}) {
  const items: { label: string; value: number; hint?: string }[] = [
    { label: t.finance.metrics.totalCollected, value: metrics.totalCollected },
    { label: t.finance.metrics.cashBalance, value: metrics.cashBalance },
    {
      label: t.finance.metrics.pendingRevenue,
      value: metrics.pendingRevenue,
      hint: t.finance.metrics.pendingHint,
    },
    {
      label: t.finance.metrics.totalBilled,
      value: metrics.totalBilled,
      hint: t.finance.metrics.billedHint,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border bg-card p-4 shadow-sm"
        >
          <p className="text-xs font-medium text-muted-foreground">
            {item.label}
          </p>
          {item.hint ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground/80">
              {item.hint}
            </p>
          ) : null}
          {loading ? (
            <Skeleton className="mt-3 h-9 w-36" />
          ) : (
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {formatCurrency(item.value, currency)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
