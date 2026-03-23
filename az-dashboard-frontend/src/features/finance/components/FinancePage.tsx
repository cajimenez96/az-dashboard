"use client";

import dayjs from "dayjs";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { t } from "@/lib/i18n";

import type { CurrencyCode } from "../api/types";
import { useBudgets } from "../hooks/useBudgets";
import { useFinanceDashboardData } from "../hooks/useFinanceDashboardData";
import { useMovements } from "../hooks/useMovements";
import { useObligations } from "../hooks/useObligations";
import { CashFlowChart } from "./CashFlowChart";
import { ExpenseChart } from "./ExpenseChart";
import { MetricsCards } from "./MetricsCards";
import { RevenueChart } from "./RevenueChart";
import { UpcomingObligations } from "./UpcomingObligations";

type RangeKey = 7 | 30 | "all";

export function FinancePage() {
  const [rangeKey, setRangeKey] = useState<RangeKey>(30);
  const [currency, setCurrency] = useState<CurrencyCode>("ARS");

  const movementParams = useMemo(() => {
    if (rangeKey === "all") return undefined;
    return {
      from: dayjs()
        .subtract(rangeKey, "day")
        .startOf("day")
        .toISOString(),
    };
  }, [rangeKey]);

  const movementsQuery = useMovements(movementParams);
  const obligationsQuery = useObligations({ status: "PENDING" });
  const budgetsQuery = useBudgets({ status: "ACCEPTED" });

  const loading =
    movementsQuery.isLoading ||
    obligationsQuery.isLoading ||
    budgetsQuery.isLoading;

  const hasError =
    movementsQuery.isError ||
    obligationsQuery.isError ||
    budgetsQuery.isError;

  const errorMessage = hasError
    ? [
        movementsQuery.error,
        obligationsQuery.error,
        budgetsQuery.error,
      ]
        .map((e) => (e ? getApiErrorMessage(e) : ""))
        .find(Boolean)
    : null;

  const dashboard = useFinanceDashboardData(
    movementsQuery.data,
    obligationsQuery.data,
    budgetsQuery.data,
    currency,
  );

  const globallyEmpty =
    !loading &&
    dashboard.rawCounts.movements === 0 &&
    dashboard.rawCounts.obligations === 0 &&
    dashboard.rawCounts.budgets === 0;

  const rangeOptions = [
    { key: 7 as const, label: t.finance.range7 },
    { key: 30 as const, label: t.finance.range30 },
    { key: "all" as const, label: t.finance.rangeAll },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t.finance.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.finance.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t.finance.range}
          </span>
          {rangeOptions.map(({ key, label }) => (
            <Button
              key={label}
              type="button"
              size="sm"
              variant={rangeKey === key ? "default" : "outline"}
              className="h-8 rounded-md px-3 text-xs"
              onClick={() => setRangeKey(key)}
            >
              {label}
            </Button>
          ))}
          <span className="ml-2 text-xs font-medium text-muted-foreground">
            {t.finance.currency}
          </span>
          {(["ARS", "USD"] as const).map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={currency === c ? "default" : "outline"}
              className="h-8 rounded-md px-3 text-xs font-mono"
              onClick={() => setCurrency(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {errorMessage ? (
        <p
          className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      {globallyEmpty && !hasError ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          {t.finance.empty}
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          <MetricsCards
            metrics={dashboard.metrics}
            currency={currency}
            loading={loading}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart
              data={dashboard.incomeSeries}
              currency={currency}
              loading={loading}
            />
            <ExpenseChart
              data={dashboard.expenseSeries}
              currency={currency}
              loading={loading}
            />
          </div>

          <CashFlowChart
            data={dashboard.cashFlowSeries}
            currency={currency}
            loading={loading}
          />

          <UpcomingObligations
            obligations={dashboard.upcomingObligations}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
