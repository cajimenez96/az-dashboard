"use client";

import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export interface DeleteColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnName: string;
  isPending: boolean;
  errorMessage: string | null;
  onConfirm: () => Promise<void>;
}

export function DeleteColumnDialog({
  open,
  onOpenChange,
  columnName,
  isPending,
  errorMessage,
  onConfirm,
}: DeleteColumnDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-xl border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>{t.kanbanConfig.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.kanbanConfig.deleteDescription(columnName)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="rounded-lg">
            {t.common.cancel}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            className="rounded-lg"
            disabled={isPending}
            onClick={() => void onConfirm()}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t.common.deleting}
              </>
            ) : (
              t.common.delete
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
