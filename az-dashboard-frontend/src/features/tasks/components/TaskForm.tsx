"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ClientListItem } from "@/features/clients/api/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import type { SystemListItem } from "@/features/systems/api/types";
import {
  type TaskFormValues,
  taskFormSchema,
} from "../lib/task-form-schema";

export function TaskForm({
  formId,
  defaultValues,
  lockContext,
  clients,
  systems,
  clientsLoading,
  systemsLoading,
  onSubmit,
}: {
  formId: string;
  defaultValues: TaskFormValues;
  lockContext?: boolean;
  clients: ClientListItem[];
  systems: SystemListItem[];
  clientsLoading: boolean;
  systemsLoading: boolean;
  onSubmit: (values: TaskFormValues) => void | Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });

  const context = watch("context");

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-title">{t.tasks.form.title}</Label>
        <Input
          id="task-title"
          autoComplete="off"
          placeholder={t.tasks.form.titlePlaceholder}
          {...register("title")}
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-description">{t.tasks.form.description}</Label>
        <Textarea
          id="task-description"
          rows={3}
          placeholder={t.tasks.form.descriptionPlaceholder}
          {...register("description")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t.tasks.form.priority}</Label>
          <Select
            value={watch("priority")}
            onValueChange={(v) =>
              setValue("priority", v as TaskFormValues["priority"])
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.tasks.form.priorityPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">{t.tasks.form.priorityLow}</SelectItem>
              <SelectItem value="MEDIUM">
                {t.tasks.form.priorityMedium}
              </SelectItem>
              <SelectItem value="HIGH">{t.tasks.form.priorityHigh}</SelectItem>
              <SelectItem value="URGENT">
                {t.tasks.form.priorityUrgent}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-due">{t.tasks.form.dueDate}</Label>
          <Input id="task-due" type="datetime-local" {...register("dueDate")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t.tasks.form.linkedTo}</Label>
        <div
          className={cn(
            "flex gap-2",
            lockContext && "pointer-events-none opacity-80",
          )}
        >
          <Button
            type="button"
            variant={context === "client" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setValue("context", "client")}
          >
            {t.tasks.form.clientTab}
          </Button>
          <Button
            type="button"
            variant={context === "system" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setValue("context", "system")}
          >
            {t.tasks.form.systemTab}
          </Button>
        </div>
        {lockContext ? (
          <p className="text-xs text-muted-foreground">
            {t.tasks.form.lockContextHint}
          </p>
        ) : null}
      </div>

      {context === "client" ? (
        <div className="space-y-2">
          <Label>{t.tasks.form.client}</Label>
          <Select
            value={watch("clientId") || undefined}
            onValueChange={(v) => setValue("clientId", v)}
            disabled={clientsLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  clientsLoading
                    ? t.common.loading
                    : t.tasks.form.selectClient
                }
              />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.clientId ? (
            <p className="text-sm text-destructive">{errors.clientId.message}</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Label>{t.tasks.form.system}</Label>
          <Select
            value={watch("systemId") || undefined}
            onValueChange={(v) => setValue("systemId", v)}
            disabled={systemsLoading || systems.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  systems.length === 0
                    ? t.tasks.form.noSystems
                    : systemsLoading
                      ? t.common.loading
                      : t.tasks.form.selectSystem
                }
              />
            </SelectTrigger>
            <SelectContent>
              {systems.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.client?.name
                    ? `${s.name} · ${s.client.name}${s.type ? ` (${s.type})` : ""}`
                    : s.type
                      ? `${s.name} (${s.type})`
                      : s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {systems.length === 0 && !systemsLoading ? (
            <p className="text-xs text-muted-foreground">
              {t.tasks.form.noSystemsHint}
            </p>
          ) : null}
          {errors.systemId ? (
            <p className="text-sm text-destructive">{errors.systemId.message}</p>
          ) : null}
        </div>
      )}

      {isSubmitting ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {t.tasks.form.saving}
        </p>
      ) : null}
    </form>
  );
}
