"use client";

import dayjs from "dayjs";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CurrencyCode } from "@/features/finance/api/types";
import { chartColors } from "@/features/finance/lib/chart-colors";
import { formatCurrency } from "@/features/finance/lib/format-currency";
import { t } from "@/lib/i18n";

import type { CashFlowChartPoint } from "../api/build-cash-flow-series";

export function CashFlowChart({
  data,
  currency,
  isLoading,
}: {
  data: CashFlowChartPoint[];
  currency: CurrencyCode;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="rounded-xl border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[320px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="rounded-xl border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <h2 className="text-base font-semibold text-foreground">
            {t.dashboard.cashFlowTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.dashboard.cashFlowSubtitle}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
            {t.dashboard.cashFlowEmpty}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-border/80 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-2">
        <h2 className="text-base font-semibold text-foreground">
          {t.dashboard.cashFlowTitle}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t.dashboard.cashFlowSubtitle} · {t.dashboard.chartCurrencyNote(currency)}
        </p>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.grid}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: chartColors.axis }}
                tickFormatter={(v: string) => dayjs(v).format("DD/MM")}
                tickLine={false}
                axisLine={{ stroke: chartColors.grid }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: chartColors.axis }}
                tickFormatter={(v) =>
                  formatCurrency(Number(v), currency, { notation: "compact" })
                }
                width={76}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(var(--border))",
                  fontSize: "12px",
                }}
                labelFormatter={(label) =>
                  dayjs(String(label)).format("DD/MM/YYYY")
                }
                formatter={(value, name) => [
                  formatCurrency(Number(value), currency),
                  name === "income"
                    ? t.dashboard.movementIncome
                    : t.dashboard.movementExpense,
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                formatter={(value) =>
                  value === "income"
                    ? t.dashboard.movementIncome
                    : t.dashboard.movementExpense
                }
              />
              <Line
                type="monotone"
                dataKey="income"
                name="income"
                stroke={chartColors.income}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="expense"
                stroke={chartColors.expense}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
