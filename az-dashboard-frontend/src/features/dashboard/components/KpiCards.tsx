"use client";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CurrencyCode } from "@/features/finance/api/types";
import { formatCurrency } from "@/features/finance/lib/format-currency";
import { t } from "@/lib/i18n";

import type {
  CurrencyFinanceTotals,
  DashboardFinanceKpis,
} from "../api/types";

function metricLines(
  kpis: DashboardFinanceKpis | undefined,
  field: keyof CurrencyFinanceTotals,
): { currency: CurrencyCode; value: number }[] {
  const out: { currency: CurrencyCode; value: number }[] = [];
  (["ARS", "USD"] as const).forEach((c) => {
    const v = kpis?.[c]?.[field];
    if (v !== undefined && Math.abs(v) > 0.0001) {
      out.push({ currency: c, value: v });
    }
  });
  if (out.length === 0) {
    return [{ currency: "ARS", value: 0 }];
  }
  return out;
}

function KpiCard({
  title,
  lines,
  loading,
}: {
  title: string;
  lines: { currency: CurrencyCode; value: number }[];
  loading: boolean;
}) {
  return (
    <Card className="rounded-xl border-border/80 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-2 pt-5">
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardHeader>
      <CardContent className="pb-5 pt-0">
        {loading ? (
          <Skeleton className="h-9 w-36 rounded-md" />
        ) : (
          <div className="space-y-1">
            {lines.map(({ currency, value }, i) => (
              <p
                key={`${currency}-${i}`}
                className={
                  i === 0
                    ? "text-2xl font-semibold tabular-nums tracking-tight text-foreground"
                    : "text-sm font-medium tabular-nums text-muted-foreground"
                }
              >
                {formatCurrency(value, currency)}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KpiCards({
  kpis,
  isLoading,
}: {
  kpis: DashboardFinanceKpis | undefined;
  isLoading: boolean;
}) {
  const cards = [
    { title: t.dashboard.kpiTotalBilled, field: "facturacion" as const },
    { title: t.dashboard.kpiCollected, field: "cobrado" as const },
    { title: t.dashboard.kpiExpenses, field: "gastos" as const },
    { title: t.dashboard.kpiBalance, field: "balance" as const },
  ];

  return (
    <section
      aria-label={t.dashboard.kpiSectionAria}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map(({ title, field }) => (
        <KpiCard
          key={field}
          title={title}
          lines={metricLines(kpis, field)}
          loading={isLoading}
        />
      ))}
    </section>
  );
}
