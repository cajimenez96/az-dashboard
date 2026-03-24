"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import type { KanbanArea } from "@/features/kanban/api/types";
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

export interface CreateColumnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area: KanbanArea;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (payload: { name: string; color?: string }) => Promise<void>;
}

export function CreateColumnModal({
  open,
  onOpenChange,
  area,
  isPending,
  serverError,
  onSubmit,
}: CreateColumnModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("");

  const areaLabel =
    area === "MARKETING"
      ? t.kanbanConfig.tabMarketing
      : t.kanbanConfig.tabSoftware;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.kanbanConfig.createTitle}</DialogTitle>
          <DialogDescription>
            {t.kanbanConfig.createDescription(areaLabel)}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = name.trim();
            if (!trimmed) return;
            void onSubmit({
              name: trimmed,
              ...(color.trim() ? { color: color.trim() } : {}),
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="kanban-col-create-name">{t.kanbanConfig.fieldName}</Label>
            <Input
              id="kanban-col-create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.kanbanConfig.namePlaceholder}
              autoComplete="off"
              disabled={isPending}
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kanban-col-create-color">
              {t.kanbanConfig.fieldColorOptional}
            </Label>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                id="kanban-col-create-color"
                type="color"
                value={color || "#94a3b8"}
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
                t.kanbanConfig.createSubmit
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
