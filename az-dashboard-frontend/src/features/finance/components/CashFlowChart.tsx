"use client";

import dayjs from "dayjs";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";

import type { CurrencyCode } from "../api/types";
import { chartColors } from "../lib/chart-colors";
import { formatCurrency } from "../lib/format-currency";

export function CashFlowChart({
  data,
  currency,
  loading,
}: {
  data: { date: string; income: number; expense: number }[];
  currency: CurrencyCode;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-[340px] w-full rounded-lg border border-border" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[340px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        {t.finance.noCashFlow}
      </div>
    );
  }

  return (
    <div className="h-[340px] w-full rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="mb-1 text-sm font-medium text-foreground">
        {t.finance.cashFlowTitle}
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        {t.finance.cashFlowSubtitle}
      </p>
      <ResponsiveContainer width="100%" height="82%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartColors.grid}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: chartColors.axis }}
            tickFormatter={(v: string) => dayjs(v).format("MMM D")}
            tickLine={false}
            axisLine={{ stroke: chartColors.grid }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: chartColors.axis }}
            tickFormatter={(v) => formatCurrency(Number(v), currency, { notation: "compact" })}
            width={72}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
              fontSize: "12px",
            }}
            labelFormatter={(label) => dayjs(String(label)).format("MMM D, YYYY")}
            formatter={(value, name) => [
              formatCurrency(Number(value), currency),
              name === "income" ? t.finance.income : t.finance.expense,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            formatter={(value) =>
              value === "income" ? t.finance.income : t.finance.expense
            }
          />
          <Area
            type="monotone"
            dataKey="income"
            name="income"
            stroke={chartColors.income}
            fill={chartColors.incomeMuted}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="expense"
            stroke={chartColors.expense}
            fill={chartColors.expenseMuted}
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
