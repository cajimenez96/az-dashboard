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

export interface ClientDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  isPending: boolean;
  onConfirm: () => Promise<void>;
  errorMessage?: string | null;
}

export function ClientDeleteDialog({
  open,
  onOpenChange,
  clientName,
  isPending,
  onConfirm,
  errorMessage,
}: ClientDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.clients.delete.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.clients.delete.description(clientName)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage ? (
          <p className="text-sm text-destructive" role="status">
            {errorMessage}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t.common.cancel}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => void onConfirm()}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                {t.common.deleting}
              </>
            ) : (
              t.clients.delete.confirm
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
