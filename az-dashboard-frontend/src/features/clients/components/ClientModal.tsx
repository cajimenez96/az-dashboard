"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { t } from "@/lib/i18n";

import type {
  ClientListItem,
  CreateClientPayload,
  UpdateClientPayload,
} from "../api/types";
import {
  clientToFormValues,
  defaultClientFormValues,
  type ClientFormValues,
} from "../lib/client-form-schema";
import {
  mapFormValuesToCreatePayload,
  mapFormValuesToUpdatePayload,
} from "../lib/map-form-to-api";
import { CLIENT_FORM_ID, ClientForm } from "./ClientForm";

export interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  client: ClientListItem | null;
  isPending: boolean;
  serverError: string | null;
  onCreate: (payload: CreateClientPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateClientPayload) => Promise<void>;
}

export function ClientModal({
  open,
  onOpenChange,
  mode,
  client,
  isPending,
  serverError,
  onCreate,
  onUpdate,
}: ClientModalProps) {
  const formDefaults = useMemo<ClientFormValues>(() => {
    if (!open) return defaultClientFormValues;
    if (mode === "edit" && client) return clientToFormValues(client);
    return defaultClientFormValues;
  }, [open, mode, client]);

  const formInstanceKey = open
    ? `${mode}-${client?.id ?? "new"}`
    : "closed";

  const handleSubmit = useCallback(
    async (values: ClientFormValues) => {
      try {
        if (mode === "create") {
          await onCreate(mapFormValuesToCreatePayload(values));
        } else if (client) {
          await onUpdate(client.id, mapFormValuesToUpdatePayload(values));
        }
        onOpenChange(false);
      } catch {
        /* error: toast en página o serverError */
      }
    },
    [mode, client, onCreate, onUpdate, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t.clients.modal.createTitle
              : t.clients.modal.editTitle}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t.clients.modal.createDesc
              : t.clients.modal.editDesc}
          </DialogDescription>
        </DialogHeader>

        <ClientForm
          key={formInstanceKey}
          resetKey={formInstanceKey}
          defaultValues={formDefaults}
          onSubmit={handleSubmit}
          disabled={isPending}
          serverError={serverError}
        />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t.common.cancel}
          </Button>
          <Button type="submit" form={CLIENT_FORM_ID} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                {t.common.saving}
              </>
            ) : mode === "create" ? (
              t.clients.modal.createSubmit
            ) : (
              t.clients.modal.saveSubmit
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
