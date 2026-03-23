"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ObligationListItem } from "@/features/finance/api/types";
import { parseAmount } from "@/features/finance/lib/finance-compute";
import { formatCurrency } from "@/features/finance/lib/format-currency";
import { formatLedgerDate } from "@/features/financial/lib/format-ledger-date";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { obligationDueTone } from "../lib/obligation-due-tone";

function rowClass(dueIso: string): string {
  const tone = obligationDueTone(dueIso);
  if (tone === "overdue") {
    return "bg-destructive/5 border-l-4 border-l-destructive";
  }
  if (tone === "upcoming") {
    return "bg-amber-500/8 border-l-4 border-l-amber-500";
  }
  return "";
}

function statusBadge(dueIso: string) {
  const tone = obligationDueTone(dueIso);
  if (tone === "overdue") {
    return (
      <Badge variant="destructive" className="font-normal">
        {t.dashboard.badgeOverdue}
      </Badge>
    );
  }
  if (tone === "upcoming") {
    return (
      <Badge
        variant="secondary"
        className="border border-amber-500/40 bg-amber-500/15 font-normal text-amber-950 dark:text-amber-100"
      >
        {t.dashboard.badgeUpcoming}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="font-normal">
      {t.dashboard.statusPending}
    </Badge>
  );
}

export function UpcomingObligations({
  obligations,
  isLoading,
}: {
  obligations: ObligationListItem[];
  isLoading: boolean;
}) {
  const rows = [...obligations].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  return (
    <Card className="rounded-xl border-border/80 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {t.dashboard.obligationsTitle}
        </CardTitle>
        <CardDescription className="text-sm">
          {t.dashboard.obligationsHint}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t.dashboard.noObligations}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t.dashboard.colClient}</TableHead>
                  <TableHead className="text-right">{t.dashboard.colAmount}</TableHead>
                  <TableHead>{t.dashboard.colDate}</TableHead>
                  <TableHead className="w-[140px]">
                    {t.dashboard.colStatus}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn("hover:bg-muted/40", rowClass(row.dueDate))}
                  >
                    <TableCell className="font-medium">
                      {row.client.name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(parseAmount(row.amount), row.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {formatLedgerDate(row.dueDate)}
                    </TableCell>
                    <TableCell>{statusBadge(row.dueDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
