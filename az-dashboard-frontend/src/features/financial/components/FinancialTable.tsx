"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paymentMethodLabel } from "@/features/dashboard/lib/payment-method-label";
import type { FinancialMovementListItem } from "@/features/finance/api/types";
import { parseAmount } from "@/features/finance/lib/finance-compute";
import { formatCurrency } from "@/features/finance/lib/format-currency";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { formatLedgerDate } from "../lib/format-ledger-date";

function TypeBadge({ type }: { type: FinancialMovementListItem["type"] }) {
  if (type === "INCOME") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/40 bg-emerald-500/10 font-medium text-emerald-800 dark:text-emerald-300"
      >
        {t.ledger.typeIncomeShort}
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="font-medium">
      {t.ledger.typeExpenseShort}
    </Badge>
  );
}

function MovementCard({ row }: { row: FinancialMovementListItem }) {
  const n = parseAmount(row.amount);
  const signed = row.type === "EXPENSE" ? -n : n;

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30"
      key={row.id}
    >
      <div className="flex items-start justify-between gap-3">
        <TypeBadge type={row.type} />
        <span
          className={cn(
            "tabular-nums text-base font-semibold tracking-tight",
            row.type === "INCOME"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive",
          )}
        >
          {row.type === "EXPENSE" ? "− " : ""}
          {formatCurrency(Math.abs(signed), row.currency)}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">
        {row.client?.name ?? "—"}
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {row.description?.trim() || "—"}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{paymentMethodLabel(row.paymentMethod)}</span>
        <span>{formatLedgerDate(row.date)}</span>
      </div>
    </div>
  );
}

export function FinancialTable({
  rows,
  isLoading,
  isError,
  hasActiveFilters,
}: {
  rows: FinancialMovementListItem[];
  isLoading: boolean;
  isError: boolean;
  hasActiveFilters: boolean;
}) {
  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center text-sm text-destructive">
        {t.ledger.loadError}
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
                <TableHead className="w-[100px]">{t.ledger.colType}</TableHead>
                <TableHead>{t.ledger.colClient}</TableHead>
                <TableHead>{t.ledger.colDescription}</TableHead>
                <TableHead>{t.ledger.colPayment}</TableHead>
                <TableHead>{t.ledger.colDate}</TableHead>
                <TableHead className="text-right">{t.ledger.colAmount}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full max-w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="space-y-3 md:hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
        {hasActiveFilters ? t.ledger.emptyFiltered : t.ledger.empty}
      </div>
    );
  }

  return (
    <>
      <div className="hidden space-y-3 md:block">
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[100px]">{t.ledger.colType}</TableHead>
                <TableHead>{t.ledger.colClient}</TableHead>
                <TableHead className="min-w-[180px]">
                  {t.ledger.colDescription}
                </TableHead>
                <TableHead>{t.ledger.colPayment}</TableHead>
                <TableHead className="w-[120px]">{t.ledger.colDate}</TableHead>
                <TableHead className="w-[140px] text-right">
                  {t.ledger.colAmount}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const n = parseAmount(row.amount);
                const display = formatCurrency(n, row.currency);

                return (
                  <TableRow
                    key={row.id}
                    className="border-border transition-colors hover:bg-muted/40"
                  >
                    <TableCell>
                      <TypeBadge type={row.type} />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {row.client?.name ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">
                      {row.description?.trim() || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {paymentMethodLabel(row.paymentMethod)}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatLedgerDate(row.date)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right text-base font-semibold tabular-nums tracking-tight",
                        row.type === "INCOME"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive",
                      )}
                    >
                      {row.type === "EXPENSE" ? "− " : ""}
                      {display}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <MovementCard key={row.id} row={row} />
        ))}
      </div>
    </>
  );
}
