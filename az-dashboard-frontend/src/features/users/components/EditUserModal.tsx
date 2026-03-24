"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

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
import type { UpdateUserPayload, UserListItem } from "@/features/users/api/types";
import { t } from "@/lib/i18n";

import { useUpdateUser } from "../hooks/useUpdateUser";
import { mapUserApiError } from "../lib/map-user-api-error";
import {
  editFormToPayload,
  editUserFormSchema,
  userToEditFormValues,
  type EditUserFormValues,
} from "../lib/user-form-schema";
import { wouldRemoveLastSuperadmin } from "../lib/users-admin-rules";

export function EditUserModal({
  open,
  onOpenChange,
  user,
  allUsers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListItem | null;
  allUsers: UserListItem[];
}) {
  const updateUser = useUpdateUser();
  const [demoteOpen, setDemoteOpen] = useState(false);
  const [pendingPayload, setPendingPayload] =
    useState<UpdateUserPayload | null>(null);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: "",
      role: "USER",
      profile: "MARKETER",
    },
  });

  const { control, handleSubmit, register, reset, formState } = form;

  useEffect(() => {
    if (open && user) {
      reset(userToEditFormValues(user));
    }
  }, [open, user, reset]);

  const handleDialogOpenChange = (next: boolean) => {
    if (!next) {
      setDemoteOpen(false);
      setPendingPayload(null);
    }
    onOpenChange(next);
  };

  const runUpdate = async (payload: UpdateUserPayload) => {
    if (!user) return;
    try {
      await updateUser.mutateAsync({ id: user.id, ...payload });
      toast.success(t.toast.userUpdated);
      onOpenChange(false);
    } catch (e) {
      toast.error(mapUserApiError(e));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!user) return;
    const payload = editFormToPayload(values);
    if (
      wouldRemoveLastSuperadmin(allUsers, user.id, values.role)
    ) {
      setPendingPayload(payload);
      setDemoteOpen(true);
      return;
    }
    await runUpdate(payload);
  });

  const confirmDemote = async () => {
    if (!pendingPayload) return;
    setDemoteOpen(false);
    await runUpdate(pendingPayload);
    setPendingPayload(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.users.modalEditTitle}</DialogTitle>
            <DialogDescription>{t.users.modalEditDesc}</DialogDescription>
          </DialogHeader>

          {user ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{user.email}</span>
            </p>
          ) : null}

          <form id="edit-user-form" onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-usr-name">{t.users.fieldName}</Label>
              <Input
                id="edit-usr-name"
                autoComplete="name"
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
              <Label htmlFor="edit-usr-role">{t.users.fieldRole}</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="edit-usr-role" className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">{t.users.roleUser}</SelectItem>
                      <SelectItem value="SUPERADMIN">
                        {t.users.roleSuperadmin}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-usr-profile">{t.users.fieldProfile}</Label>
              <Controller
                control={control}
                name="profile"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="edit-usr-profile" className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MARKETER">
                        {t.users.profileMarketer}
                      </SelectItem>
                      <SelectItem value="DEVELOPER">
                        {t.users.profileDeveloper}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </form>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              disabled={updateUser.isPending}
              onClick={() => onOpenChange(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              form="edit-user-form"
              className="rounded-lg"
              disabled={updateUser.isPending || !user}
            >
              {updateUser.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t.users.saving}
                </>
              ) : (
                t.users.saveSubmit
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={demoteOpen}
        onOpenChange={(v) => {
          setDemoteOpen(v);
          if (!v) setPendingPayload(null);
        }}
      >
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.users.confirmDemoteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.users.confirmDemoteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateUser.isPending}>
              {t.common.cancel}
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              className="rounded-lg"
              disabled={updateUser.isPending}
              onClick={() => void confirmDemote()}
            >
              {updateUser.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t.users.confirmDemoteAction
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
