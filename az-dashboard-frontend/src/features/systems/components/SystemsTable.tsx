"use client";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SystemListItem } from "@/features/systems/api/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { SystemStatusBadge } from "./SystemStatusBadge";
import { SystemTypeBadge } from "./SystemTypeBadge";

export function SystemsTable({
  rows,
  isLoading,
  isError,
  onEdit,
}: {
  rows: SystemListItem[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (row: SystemListItem) => void;
}) {
  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center text-sm text-destructive">
        {t.systems.loadError}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-xl border border-border p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
        {t.systems.empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead>{t.systems.colName}</TableHead>
            <TableHead>{t.systems.colClient}</TableHead>
            <TableHead>{t.systems.colType}</TableHead>
            <TableHead>{t.systems.colStatus}</TableHead>
            <TableHead className="min-w-[180px]">{t.systems.colRepo}</TableHead>
            <TableHead className="w-[120px] text-right">
              {t.systems.colActions}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className="border-border transition-colors hover:bg-muted/40"
            >
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.client?.name ?? "—"}
              </TableCell>
              <TableCell>
                <SystemTypeBadge type={row.type} />
              </TableCell>
              <TableCell>
                <SystemStatusBadge status={row.status} />
              </TableCell>
              <TableCell>
                {row.repoUrl ? (
                  <a
                    href={row.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex max-w-[240px] items-center gap-1 truncate text-sm font-medium text-primary underline-offset-4 hover:underline",
                    )}
                  >
                    <span className="truncate">{row.repoUrl}</span>
                    <ExternalLink className="size-3.5 shrink-0 opacity-70" />
                    <span className="sr-only">{t.systems.repoOpen}</span>
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => onEdit(row)}
                >
                  {t.systems.actionEdit}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
