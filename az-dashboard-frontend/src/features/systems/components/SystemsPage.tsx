"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useClients } from "@/features/clients/hooks/useClients";
import type { SystemListItem } from "@/features/systems/api/types";
import { t } from "@/lib/i18n";

import { useSystems } from "../hooks/useSystems";
import { CreateSystemModal } from "./CreateSystemModal";
import { EditSystemModal } from "./EditSystemModal";
import { SystemsTable } from "./SystemsTable";

export function SystemsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<SystemListItem | null>(null);

  const { data: rows = [], isLoading, isError } = useSystems();
  const { data: clients = [] } = useClients();

  const openEdit = (row: SystemListItem) => {
    setEditing(row);
    setEditOpen(true);
  };

  const onEditOpenChange = (open: boolean) => {
    setEditOpen(open);
    if (!open) setEditing(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t.systems.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.systems.subtitle}
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0 rounded-xl"
          disabled={clients.length === 0}
          onClick={() => setCreateOpen(true)}
        >
          {t.systems.newSystem}
        </Button>
      </header>

      {clients.length === 0 ? (
        <p className="mt-4 text-sm text-amber-700 dark:text-amber-400">
          {t.systems.noClientsHint}
        </p>
      ) : null}

      <Card className="mt-8 border-border bg-card/80 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <SystemsTable
            rows={rows}
            isLoading={isLoading}
            isError={isError}
            onEdit={openEdit}
          />
        </CardContent>
      </Card>

      <CreateSystemModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
      />

      <EditSystemModal
        open={editOpen}
        onOpenChange={onEditOpenChange}
        system={editing}
        clients={clients}
      />
    </div>
  );
}
