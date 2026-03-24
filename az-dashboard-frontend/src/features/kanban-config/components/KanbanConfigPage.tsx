"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { KanbanArea, KanbanColumn } from "@/features/kanban/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { t } from "@/lib/i18n";
import { useAuthStore } from "@/stores/auth.store";

import { createColumn } from "../api/createColumn";
import { deleteColumn } from "../api/deleteColumn";
import { updateColumn } from "../api/updateColumn";
import { useColumns } from "../hooks/useColumns";
import { getApiErrorCode } from "../lib/api-error";
import { ColumnsList } from "./ColumnsList";
import { CreateColumnModal } from "./CreateColumnModal";
import { DeleteColumnDialog } from "./DeleteColumnDialog";
import { EditColumnModal } from "./EditColumnModal";

function mapCreateError(code: string | null): string {
  if (code === "COLUMN_NAME_ALREADY_EXISTS_IN_AREA") {
    return t.kanbanConfig.errors.nameExists;
  }
  return t.common.error;
}

function mapEditError(code: string | null): string {
  if (code === "COLUMN_NAME_ALREADY_EXISTS_IN_AREA") {
    return t.kanbanConfig.errors.nameExists;
  }
  return t.common.error;
}

function mapDeleteError(code: string | null): string {
  if (code === "COLUMN_HAS_TASKS") {
    return t.kanbanConfig.errors.hasTasks;
  }
  return t.common.error;
}

export function KanbanConfigPage() {
  const queryClient = useQueryClient();
  const isSuperadmin = useAuthStore((s) => s.user?.role === "SUPERADMIN");

  const [area, setArea] = useState<KanbanArea>("MARKETING");
  const [createNonce, setCreateNonce] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<KanbanColumn | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<KanbanColumn | null>(null);

  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: columns, isLoading, isError } = useColumns(
    area,
    isSuperadmin,
  );

  const invalidateArea = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["kanban-columns", area] });
  }, [area, queryClient]);

  const createMutation = useMutation({
    mutationFn: createColumn,
    onSuccess: async () => {
      await invalidateArea();
      toast.success(t.toast.kanbanColumnCreated);
      setCreateOpen(false);
      setCreateError(null);
    },
    onError: (err) => {
      setCreateError(mapCreateError(getApiErrorCode(err)));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { name: string; color: string | null };
    }) => updateColumn(id, payload),
    onSuccess: async () => {
      await invalidateArea();
      toast.success(t.toast.kanbanColumnUpdated);
      setEditOpen(false);
      setEditing(null);
      setEditError(null);
    },
    onError: (err) => {
      setEditError(mapEditError(getApiErrorCode(err)));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteColumn,
    onSuccess: async () => {
      await invalidateArea();
      toast.success(t.toast.kanbanColumnDeleted);
      setDeleteOpen(false);
      setDeleting(null);
      setDeleteError(null);
    },
    onError: (err) => {
      setDeleteError(mapDeleteError(getApiErrorCode(err)));
    },
  });

  const openEdit = useCallback((col: KanbanColumn) => {
    setEditing(col);
    setEditError(null);
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((col: KanbanColumn) => {
    setDeleting(col);
    setDeleteError(null);
    setDeleteOpen(true);
  }, []);

  if (!isSuperadmin) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="space-y-4 pt-8 pb-8">
            <h1 className="text-lg font-semibold text-foreground">
              {t.kanbanConfig.forbiddenTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.kanbanConfig.forbiddenDescription}
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
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:py-8">
      <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t.kanbanConfig.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.kanbanConfig.subtitle}
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0 rounded-lg"
          onClick={() => {
            setCreateError(null);
            setCreateNonce((n) => n + 1);
            setCreateOpen(true);
          }}
        >
          {t.kanbanConfig.newColumn}
        </Button>
      </header>

      <Tabs
        value={area}
        onValueChange={(v) => setArea(v as KanbanArea)}
        className="w-full"
        aria-label={t.kanbanConfig.tabsAria}
      >
        <TabsList className="mb-6 h-10 w-full max-w-md rounded-lg border border-border bg-muted/40 p-1 md:w-auto">
          <TabsTrigger
            value="MARKETING"
            className="flex-1 rounded-md transition-all data-[state=active]:shadow-sm md:flex-initial"
          >
            {t.kanbanConfig.tabMarketing}
          </TabsTrigger>
          <TabsTrigger
            value="SOFTWARE"
            className="flex-1 rounded-md transition-all data-[state=active]:shadow-sm md:flex-initial"
          >
            {t.kanbanConfig.tabSoftware}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border-border shadow-sm">
        <CardContent className="p-4 md:p-6">
          <ColumnsList
            area={area}
            columns={columns}
            isLoading={isLoading}
            isError={isError}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        </CardContent>
      </Card>

      <CreateColumnModal
        key={createNonce}
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateError(null);
        }}
        area={area}
        isPending={createMutation.isPending}
        serverError={createError}
        onSubmit={async (payload) => {
          setCreateError(null);
          try {
            await createMutation.mutateAsync({
              name: payload.name,
              area,
              ...(payload.color ? { color: payload.color } : {}),
            });
          } catch {
            /* createMutation.onError */
          }
        }}
      />

      <EditColumnModal
        key={editing?.id ?? "kanban-edit-closed"}
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) {
            setEditing(null);
            setEditError(null);
          }
        }}
        column={editing}
        isPending={updateMutation.isPending}
        serverError={editError}
        onSubmit={async (payload) => {
          if (!editing) return;
          setEditError(null);
          try {
            await updateMutation.mutateAsync({
              id: editing.id,
              payload: {
                name: payload.name,
                color: payload.color ?? null,
              },
            });
          } catch {
            /* updateMutation.onError */
          }
        }}
      />

      <DeleteColumnDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o);
          if (!o) {
            setDeleting(null);
            setDeleteError(null);
          }
        }}
        columnName={deleting?.name ?? ""}
        isPending={deleteMutation.isPending}
        errorMessage={deleteError}
        onConfirm={async () => {
          if (!deleting) return;
          setDeleteError(null);
          try {
            await deleteMutation.mutateAsync(deleting.id);
          } catch {
            /* deleteMutation.onError */
          }
        }}
      />
    </div>
  );
}
