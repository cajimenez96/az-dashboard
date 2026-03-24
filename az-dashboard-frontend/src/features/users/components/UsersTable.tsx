"use client";

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
import type { UserListItem } from "@/features/users/api/types";
import { t } from "@/lib/i18n";

import { UserProfileBadge, UserRoleBadge } from "./UserRoleBadge";

export function UsersTable({
  rows,
  isLoading,
  isError,
  onEdit,
}: {
  rows: UserListItem[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (row: UserListItem) => void;
}) {
  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center text-sm text-destructive">
        {t.users.loadError}
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
        {t.users.empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead>{t.users.colName}</TableHead>
            <TableHead>{t.users.colEmail}</TableHead>
            <TableHead>{t.users.colRole}</TableHead>
            <TableHead>{t.users.colProfile}</TableHead>
            <TableHead>{t.users.colStatus}</TableHead>
            <TableHead className="w-[120px] text-right">
              {t.users.colActions}
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
              <TableCell className="text-muted-foreground">{row.email}</TableCell>
              <TableCell>
                <UserRoleBadge role={row.role} />
              </TableCell>
              <TableCell>
                <UserProfileBadge profile={row.profile} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {t.users.statusActive}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => onEdit(row)}
                >
                  {t.users.actionEdit}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
