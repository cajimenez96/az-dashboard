"use client";

import dayjs from "dayjs";
import {
  CartesianGrid,
  Line,
  LineChart,
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

export function RevenueChart({
  data,
  currency,
  loading,
}: {
  data: { date: string; amount: number }[];
  currency: CurrencyCode;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-[300px] w-full rounded-lg border border-border" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        {t.finance.noIncome}
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="mb-1 text-sm font-medium text-foreground">
        {t.finance.revenueTitle}
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        {t.finance.revenueSubtitle}
      </p>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            formatter={(value) => [
              formatCurrency(Number(value), currency),
              t.finance.income,
            ]}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke={chartColors.income}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
