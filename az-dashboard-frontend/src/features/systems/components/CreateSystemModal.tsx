"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClientListItem } from "@/features/clients/api/types";
import { t } from "@/lib/i18n";

import { useCreateSystem } from "../hooks/useCreateSystem";
import {
  defaultSystemFormValues,
  formValuesToCreatePayload,
  systemFormSchema,
  type SystemFormValues,
} from "../lib/system-form-schema";
import { mapSystemApiError } from "../lib/map-system-api-error";

export function CreateSystemModal({
  open,
  onOpenChange,
  clients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientListItem[];
}) {
  const createSystem = useCreateSystem();

  const form = useForm<SystemFormValues>({
    resolver: zodResolver(systemFormSchema),
    defaultValues: defaultSystemFormValues(),
  });

  const { control, handleSubmit, register, reset, formState } = form;

  useEffect(() => {
    if (open) {
      reset(defaultSystemFormValues());
    }
  }, [open, reset]);

  const sortedClients = [...clients].sort((a, b) =>
    a.name.localeCompare(b.name, "es"),
  );

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createSystem.mutateAsync(formValuesToCreatePayload(values));
      toast.success(t.toast.systemCreated);
      onOpenChange(false);
    } catch (e) {
      toast.error(mapSystemApiError(e));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.systems.modalCreateTitle}</DialogTitle>
          <DialogDescription>{t.systems.modalCreateDesc}</DialogDescription>
        </DialogHeader>

        <form id="create-system-form" onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sys-name">{t.systems.fieldName}</Label>
            <Input
              id="sys-name"
              className="rounded-lg"
              {...register("name")}
            />
            {formState.errors.name?.message ? (
              <p className="text-xs text-destructive">
                {formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sys-client">{t.systems.fieldClient}</Label>
            <Controller
              control={control}
              name="clientId"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="sys-client" className="rounded-lg">
                    <SelectValue placeholder={t.systems.fieldClient} />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {formState.errors.clientId?.message ? (
              <p className="text-xs text-destructive">
                {formState.errors.clientId.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sys-type">{t.systems.fieldType}</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="sys-type" className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAAS">{t.systems.typeSaas}</SelectItem>
                    <SelectItem value="CUSTOM">
                      {t.systems.typeCustom}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sys-status">{t.systems.fieldStatus}</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="sys-status" className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">
                      {t.systems.statusActive}
                    </SelectItem>
                    <SelectItem value="MAINTENANCE">
                      {t.systems.statusMaintenance}
                    </SelectItem>
                    <SelectItem value="DEPRECATED">
                      {t.systems.statusDeprecated}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
              <Label htmlFor="sys-repo">{t.systems.fieldRepo}</Label>
              <span className="text-xs text-muted-foreground">
                {t.systems.fieldRepoHint}
              </span>
            </div>
            <Input
              id="sys-repo"
              type="url"
              inputMode="url"
              placeholder="https://"
              className="rounded-lg"
              {...register("repoUrl")}
            />
            {formState.errors.repoUrl?.message ? (
              <p className="text-xs text-destructive">
                {formState.errors.repoUrl.message}
              </p>
            ) : null}
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            disabled={createSystem.isPending}
            onClick={() => onOpenChange(false)}
          >
            {t.common.cancel}
          </Button>
          <Button
            type="submit"
            form="create-system-form"
            className="rounded-lg"
            disabled={createSystem.isPending || clients.length === 0}
          >
            {createSystem.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t.systems.creating}
              </>
            ) : (
              t.systems.createSubmit
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
