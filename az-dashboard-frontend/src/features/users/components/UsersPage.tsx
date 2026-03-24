"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { UserListItem } from "@/features/users/api/types";
import { t } from "@/lib/i18n";
import { useAuthStore } from "@/stores/auth.store";

import { useUsers } from "../hooks/useUsers";
import { CreateUserModal } from "./CreateUserModal";
import { EditUserModal } from "./EditUserModal";
import { UsersTable } from "./UsersTable";

export function UsersPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<UserListItem | null>(null);

  const isSuperadmin = useAuthStore((s) => s.user?.role === "SUPERADMIN");

  const { data: rows = [], isLoading, isError } = useUsers(isSuperadmin);

  const openEdit = (row: UserListItem) => {
    setEditing(row);
    setEditOpen(true);
  };

  const onEditOpenChange = (open: boolean) => {
    setEditOpen(open);
    if (!open) setEditing(null);
  };

  if (!isSuperadmin) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="space-y-4 pt-8 pb-8">
            <h1 className="text-lg font-semibold text-foreground">
              {t.users.forbiddenTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.users.forbiddenDescription}
            </p>
            <Button asChild className="rounded-lg" variant="outline">
              <Link href="/dashboard">{t.users.backToPanel}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t.users.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.users.subtitle}
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0 rounded-xl"
          onClick={() => setCreateOpen(true)}
        >
          {t.users.newUser}
        </Button>
      </header>

      <Card className="mt-8 border-border bg-card/80 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <UsersTable
            rows={rows}
            isLoading={isLoading}
            isError={isError}
            onEdit={openEdit}
          />
        </CardContent>
      </Card>

      <CreateUserModal open={createOpen} onOpenChange={setCreateOpen} />

      <EditUserModal
        open={editOpen}
        onOpenChange={onEditOpenChange}
        user={editing}
        allUsers={rows}
      />
    </div>
  );
}
