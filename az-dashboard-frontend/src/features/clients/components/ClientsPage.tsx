"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBar } from "@/components/global/search-bar";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { t } from "@/lib/i18n";

import type { ClientStatus } from "../api/types";
import { useClients } from "../hooks/useClients";
import { useCreateClient } from "../hooks/useCreateClient";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useDeleteClient } from "../hooks/useDeleteClient";
import { useUpdateClient } from "../hooks/useUpdateClient";
import type {
  ClientListItem,
  CreateClientPayload,
  UpdateClientPayload,
} from "../api/types";
import { ClientDeleteDialog } from "./ClientDeleteDialog";
import { ClientModal } from "./ClientModal";
import { ClientsHeader } from "./ClientsHeader";
import { ClientsTable } from "./ClientsTable";

export function ClientsPage() {
  const { data, isLoading, isError } = useClients();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  const createMutRef = useRef(createMutation);
  const updateMutRef = useRef(updateMutation);
  const deleteMutRef = useRef(deleteMutation);
  createMutRef.current = createMutation;
  updateMutRef.current = updateMutation;
  deleteMutRef.current = deleteMutation;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "ALL">(
    "ALL",
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingClient, setEditingClient] = useState<ClientListItem | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ClientListItem | null>(
    null,
  );

  const filteredBySearch = useMemo(() => {
    if (!data) return undefined;
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return data;
    return data.filter((c) => {
      const hay = [
        c.name,
        c.email ?? "",
        c.company ?? "",
        c.phone ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, debouncedSearch]);

  const displayedClients = useMemo(() => {
    if (!filteredBySearch) return undefined;
    if (statusFilter === "ALL") return filteredBySearch;
    return filteredBySearch.filter((c) => c.status === statusFilter);
  }, [filteredBySearch, statusFilter]);

  const openCreate = useCallback(() => {
    createMutRef.current.reset();
    updateMutRef.current.reset();
    setEditingClient(null);
    setModalMode("create");
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((client: ClientListItem) => {
    createMutRef.current.reset();
    updateMutRef.current.reset();
    setEditingClient(client);
    setModalMode("edit");
    setModalOpen(true);
  }, []);

  const requestDelete = useCallback((c: ClientListItem) => {
    deleteMutRef.current.reset();
    setDeleteTarget(c);
  }, []);

  const handleModalOpenChange = useCallback((open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setEditingClient(null);
      createMutRef.current.reset();
      updateMutRef.current.reset();
    }
  }, []);

  const handleCreateClient = useCallback(
    async (payload: CreateClientPayload) => {
      try {
        await createMutRef.current.mutateAsync(payload);
        toast.success(t.toast.clientCreated);
      } catch (e) {
        toast.error(t.toast.error, {
          description: getApiErrorMessage(e),
        });
        throw e;
      }
    },
    [],
  );

  const handleUpdateClient = useCallback(
    async (id: string, payload: UpdateClientPayload) => {
      try {
        await updateMutRef.current.mutateAsync({ id, payload });
        toast.success(t.toast.clientUpdated);
      } catch (e) {
        toast.error(t.toast.error, {
          description: getApiErrorMessage(e),
        });
        throw e;
      }
    },
    [],
  );

  const modalPending = createMutation.isPending || updateMutation.isPending;
  const modalServerError =
    modalMode === "create" && createMutation.isError
      ? getApiErrorMessage(createMutation.error)
      : modalMode === "edit" && updateMutation.isError
        ? getApiErrorMessage(updateMutation.error)
        : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-8">
      <ClientsHeader onNewClient={openCreate} />

      <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t.clients.searchPlaceholder}
          ariaLabel={t.clients.searchAria}
        />

        <div className="flex w-full flex-col gap-2 sm:w-56">
          <Label htmlFor="client-status-filter" className="text-xs">
            {t.clients.statusLabel}
          </Label>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as ClientStatus | "ALL")
            }
          >
            <SelectTrigger id="client-status-filter" className="h-10 w-full">
              <SelectValue placeholder={t.clients.statusAll} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t.clients.statusAll}</SelectItem>
              <SelectItem value="ACTIVE">{t.clients.statusActive}</SelectItem>
              <SelectItem value="INACTIVE">
                {t.clients.statusInactive}
              </SelectItem>
              <SelectItem value="AT_RISK">{t.clients.statusAtRisk}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <ClientsTable
          clients={displayedClients}
          sourceTotalCount={data?.length}
          isLoading={isLoading}
          isError={isError}
          onEdit={openEdit}
          onDelete={requestDelete}
          onEmptyCta={{ label: t.clients.newClientCta, onClick: openCreate }}
          emptyMessage={`${t.clients.empty} ${t.clients.emptyHint}`}
        />
      </div>

      <ClientModal
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        mode={modalMode}
        client={editingClient}
        isPending={modalPending}
        serverError={modalServerError}
        onCreate={handleCreateClient}
        onUpdate={handleUpdateClient}
      />

      <ClientDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            deleteMutRef.current.reset();
          }
        }}
        clientName={deleteTarget?.name ?? ""}
        isPending={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? getApiErrorMessage(deleteMutation.error)
            : null
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast.success(t.toast.clientDeleted);
            setDeleteTarget(null);
          } catch (e) {
            toast.error(t.toast.error, {
              description: getApiErrorMessage(e),
            });
          }
        }}
      />
    </div>
  );
}
