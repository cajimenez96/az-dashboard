"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BudgetListItem } from "@/features/budgets/api/types";
import { formatCurrency } from "@/features/finance/lib/format-currency";
import { parseAmount } from "@/features/finance/lib/finance-compute";
import { formatLedgerDate } from "@/features/financial/lib/format-ledger-date";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { BudgetStatusBadge } from "./BudgetStatusBadge";

function BudgetCard({
  row,
  onOpen,
}: {
  row: BudgetListItem;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(row.id)}
      className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-foreground">{row.title}</p>
        <BudgetStatusBadge status={row.status} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{row.client.name}</p>
      <p className="mt-3 text-lg font-semibold tabular-nums">
        {formatCurrency(parseAmount(row.totalAmount), row.currency)}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatLedgerDate(row.createdAt)}
      </p>
    </button>
  );
}

export function BudgetsTable({
  rows,
  isLoading,
  isError,
  onRowOpen,
}: {
  rows: BudgetListItem[];
  isLoading: boolean;
  isError: boolean;
  onRowOpen: (id: string) => void;
}) {
  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center text-sm text-destructive">
        {t.budgets.loadError}
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="hidden overflow-hidden rounded-xl border border-border md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>{t.budgets.colTitle}</TableHead>
                <TableHead>{t.budgets.colClient}</TableHead>
                <TableHead>{t.budgets.colStatus}</TableHead>
                <TableHead className="text-right">{t.budgets.colAmount}</TableHead>
                <TableHead>{t.budgets.colDate}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="grid gap-3 md:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
        {t.budgets.empty}
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>{t.budgets.colTitle}</TableHead>
              <TableHead>{t.budgets.colClient}</TableHead>
              <TableHead>{t.budgets.colStatus}</TableHead>
              <TableHead className="text-right">{t.budgets.colAmount}</TableHead>
              <TableHead>{t.budgets.colDate}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                role="button"
                tabIndex={0}
                className={cn(
                  "cursor-pointer border-border transition-colors hover:bg-muted/40",
                )}
                onClick={() => onRowOpen(row.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRowOpen(row.id);
                  }
                }}
              >
                <TableCell className="font-medium">{row.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.client.name}
                </TableCell>
                <TableCell>
                  <BudgetStatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-right text-base font-semibold tabular-nums">
                  {formatCurrency(parseAmount(row.totalAmount), row.currency)}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {formatLedgerDate(row.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <BudgetCard key={row.id} row={row} onOpen={onRowOpen} />
        ))}
      </div>
    </>
  );
}
