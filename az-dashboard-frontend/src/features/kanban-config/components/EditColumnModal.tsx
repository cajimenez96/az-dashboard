"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import type { KanbanColumn } from "@/features/kanban/api/types";
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
import { t } from "@/lib/i18n";

const DEFAULT_SWATCH = "#94a3b8";

export interface EditColumnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: KanbanColumn | null;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (payload: { name: string; color: string | null }) => Promise<void>;
}

export function EditColumnModal({
  open,
  onOpenChange,
  column,
  isPending,
  serverError,
  onSubmit,
}: EditColumnModalProps) {
  const [name, setName] = useState(() => column?.name ?? "");
  const [color, setColor] = useState(() =>
    column?.color?.trim() ? column.color : "",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.kanbanConfig.editTitle}</DialogTitle>
          <DialogDescription>{t.kanbanConfig.editDescription}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = name.trim();
            if (!trimmed || !column) return;
            void onSubmit({
              name: trimmed,
              color: color.trim() ? color.trim() : null,
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="kanban-col-edit-name">{t.kanbanConfig.fieldName}</Label>
            <Input
              id="kanban-col-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kanban-col-edit-color">{t.kanbanConfig.fieldColor}</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                id="kanban-col-edit-color"
                type="color"
                value={color || DEFAULT_SWATCH}
                onChange={(e) => setColor(e.target.value)}
                disabled={isPending}
                className="h-10 w-14 cursor-pointer rounded-md border border-border p-1"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3b82f6"
                disabled={isPending}
                className="max-w-[200px] flex-1 rounded-lg font-mono text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t.kanbanConfig.colorClearHint}
            </p>
          </div>

          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              className="rounded-lg"
              disabled={isPending || !name.trim()}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {t.common.saving}
                </>
              ) : (
                t.kanbanConfig.saveSubmit
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
