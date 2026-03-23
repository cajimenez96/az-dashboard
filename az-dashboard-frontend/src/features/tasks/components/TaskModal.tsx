"use client";

import { useCallback, useMemo, useState } from "react";
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
import { useClients } from "@/features/clients/hooks/useClients";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { t } from "@/lib/i18n";

import { useCreateTask } from "../hooks/useCreateTask";
import { useDeleteTask } from "../hooks/useDeleteTask";
import { useSystems } from "@/features/systems/hooks/useSystems";
import { useUpdateTask } from "../hooks/useUpdateTask";
import type { TaskListItem } from "../api/types";
import {
  defaultTaskFormValues,
  taskToFormValues,
  type TaskFormValues,
} from "../lib/task-form-schema";
import { TaskForm } from "./TaskForm";

function buildDueDatePayload(
  v: TaskFormValues,
  mode: "create" | "edit",
): string | undefined {
  const raw = v.dueDate?.trim();
  if (raw) return new Date(raw).toISOString();
  if (mode === "edit") return "";
  return undefined;
}

export function TaskModal({
  open,
  onOpenChange,
  mode,
  task,
  columnId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  task: TaskListItem | null;
  columnId: string;
}) {
  const [deleteStep, setDeleteStep] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: systems = [], isLoading: systemsLoading } = useSystems();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const defaultValues = useMemo(() => {
    if (mode === "edit" && task) return taskToFormValues(task);
    return defaultTaskFormValues();
  }, [mode, task]);

  const formKey = mode === "edit" && task ? task.id : `create-${columnId}`;

  const handleClose = useCallback(
    (next: boolean) => {
      if (!next) {
        setDeleteStep(false);
        setFormError(null);
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const onSubmit = useCallback(
    async (values: TaskFormValues) => {
      setFormError(null);
      const dueDate = buildDueDatePayload(values, mode);

      try {
        if (mode === "create") {
          await createTask.mutateAsync({
            title: values.title.trim(),
            description: values.description.trim() || undefined,
            priority: values.priority,
            dueDate,
            kanbanColumnId: columnId,
            clientId:
              values.context === "client" ? values.clientId : undefined,
            systemId:
              values.context === "system" ? values.systemId : undefined,
          });
          toast.success(t.toast.taskCreated);
        } else if (task) {
          await updateTask.mutateAsync({
            id: task.id,
            payload: {
              title: values.title.trim(),
              description: values.description.trim(),
              priority: values.priority,
              dueDate,
              clientId:
                values.context === "client" ? values.clientId : undefined,
              systemId:
                values.context === "system" ? values.systemId : undefined,
            },
          });
          toast.success(t.toast.taskUpdated);
        }
        handleClose(false);
      } catch (e) {
        const msg = getApiErrorMessage(e);
        setFormError(msg);
        toast.error(t.toast.error, { description: msg });
      }
    },
    [columnId, createTask, handleClose, mode, task, updateTask],
  );

  const handleDelete = useCallback(async () => {
    if (!task) return;
    setFormError(null);
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success(t.toast.taskDeleted);
      setDeleteStep(false);
      handleClose(false);
    } catch (e) {
      const msg = getApiErrorMessage(e);
      setFormError(msg);
      toast.error(t.toast.error, { description: msg });
    }
  }, [deleteTask, handleClose, task]);

  const isSaving =
    createTask.isPending || updateTask.isPending || deleteTask.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t.tasks.modal.createTitle
              : t.tasks.modal.editTitle}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t.tasks.modal.createDesc
              : t.tasks.modal.editDesc}
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        {deleteStep ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {t.tasks.modal.deleteConfirm}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteStep(false)}
                disabled={isSaving}
              >
                {t.common.cancel}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={isSaving}
              >
                {deleteTask.isPending
                  ? t.tasks.modal.deleting
                  : t.tasks.modal.deleteSubmit}
              </Button>
            </div>
          </div>
        ) : (
          <TaskForm
            key={formKey}
            formId="task-form"
            defaultValues={defaultValues}
            lockContext={mode === "edit"}
            clients={clients}
            systems={systems}
            clientsLoading={clientsLoading}
            systemsLoading={systemsLoading}
            onSubmit={onSubmit}
          />
        )}

        {!deleteStep ? (
          <DialogFooter className="gap-2 sm:gap-0">
            {mode === "edit" ? (
              <Button
                type="button"
                variant="ghost"
                className="mr-auto text-destructive hover:text-destructive"
                onClick={() => setDeleteStep(true)}
                disabled={isSaving}
              >
                {t.tasks.modal.delete}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSaving}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" form="task-form" disabled={isSaving}>
              {isSaving
                ? t.tasks.modal.saving
                : mode === "create"
                  ? t.tasks.modal.createSubmit
                  : t.tasks.modal.saveSubmit}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
