"use client";

import dayjs from "dayjs";

import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";

import type { ObligationListItem } from "../api/types";
import { parseAmount } from "../lib/finance-compute";
import { formatCurrency } from "../lib/format-currency";

export function UpcomingObligations({
  obligations,
  loading,
}: {
  obligations: ObligationListItem[];
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-medium text-foreground">
        {t.finance.upcomingTitle}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {t.finance.upcomingSubtitle}
      </p>

      {loading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : obligations.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t.finance.noPendingObligations}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {obligations.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {row.client.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.finance.upcomingDueLine(
                    dayjs(row.dueDate).format("D MMM YYYY"),
                  )}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(parseAmount(row.amount), row.currency)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
