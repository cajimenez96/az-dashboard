"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { clientStatusLabel, t } from "@/lib/i18n";

import type { ClientListItem, ClientStatus } from "../api/types";

export interface ClientsTableProps {
  clients: ClientListItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Length of full list before client-side filter (for “no matches” state). */
  sourceTotalCount?: number;
  maxRows?: number;
  skeletonRowCount?: number;
  emptyMessage?: string;
  showActions?: boolean;
  onEdit?: (client: ClientListItem) => void;
  onDelete?: (client: ClientListItem) => void;
  onEmptyCta?: { label: string; onClick: () => void };
}

function statusBadgeVariant(
  status: ClientStatus,
): "default" | "secondary" | "destructive" {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "INACTIVE":
      return "secondary";
    case "AT_RISK":
      return "destructive";
  }
}

function formatCell(value: string | null | undefined) {
  if (value == null || value === "") {
    return "—";
  }
  return value;
}

const DEFAULT_SKELETON_ROWS = 6;

export function ClientsTable({
  clients,
  isLoading,
  isError,
  sourceTotalCount,
  maxRows,
  skeletonRowCount,
  emptyMessage,
  showActions = true,
  onEdit,
  onDelete,
  onEmptyCta,
}: ClientsTableProps) {
  const skeletonRows = skeletonRowCount ?? DEFAULT_SKELETON_ROWS;
  const actionsVisible =
    showActions && onEdit !== undefined && onDelete !== undefined;

  if (isError) {
    return (
      <div
        className="rounded-lg border border-border bg-background px-6 py-12 text-center"
        role="status"
      >
        <p className="text-sm text-destructive">{t.clients.loadError}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t.clients.table.name}</TableHead>
            <TableHead>{t.clients.table.company}</TableHead>
            <TableHead>{t.clients.table.email}</TableHead>
            <TableHead className="w-[120px]">{t.clients.table.status}</TableHead>
            {actionsVisible ? (
              <TableHead className="w-[100px] text-right">
                {t.clients.table.actions}
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              <TableCell>
                <Skeleton className="h-4 w-[min(100%,10rem)]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[min(100%,8rem)]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[min(100%,12rem)]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16 rounded-full" />
              </TableCell>
              {actionsVisible ? (
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-8 w-20" />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  const list = clients ?? [];
  const rows = maxRows !== undefined ? list.slice(0, maxRows) : list;

  const isFilteredEmpty =
    rows.length === 0 &&
    sourceTotalCount !== undefined &&
    sourceTotalCount > 0;

  if (rows.length === 0) {
    if (isFilteredEmpty) {
      return (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {t.clients.emptyFiltered}
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {emptyMessage ?? t.clients.empty}
        </p>
        {onEmptyCta ? (
          <Button
            type="button"
            className="mt-4 shadow-sm"
            onClick={onEmptyCta.onClick}
          >
            {onEmptyCta.label}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>{t.clients.table.company}</TableHead>
          <TableHead>{t.clients.table.name}</TableHead>
          <TableHead>{t.clients.table.email}</TableHead>
          <TableHead className="w-[120px]">{t.clients.table.status}</TableHead>
          {actionsVisible ? (
            <TableHead className="w-[104px] text-right">
              {t.clients.table.actions}
            </TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium">
              {formatCell(client.company)}
            </TableCell>
            <TableCell className="text-muted-foreground">{client.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {formatCell(client.email)}
            </TableCell>
            <TableCell>
              <Badge variant={statusBadgeVariant(client.status)}>
                {clientStatusLabel(client.status)}
              </Badge>
            </TableCell>
            {actionsVisible ? (
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-foreground"
                    aria-label={t.clients.editAria(client.name)}
                    onClick={() => onEdit(client)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    aria-label={t.clients.deleteAria(client.name)}
                    onClick={() => onDelete(client)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
