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
import { t } from "@/lib/i18n";

import { useCreateUser } from "../hooks/useCreateUser";
import {
  createFormToPayload,
  createUserFormSchema,
  defaultCreateUserFormValues,
  type CreateUserFormValues,
} from "../lib/user-form-schema";
import { mapUserApiError } from "../lib/map-user-api-error";

export function CreateUserModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createUser = useCreateUser();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: defaultCreateUserFormValues(),
  });

  const { control, handleSubmit, register, reset, formState } = form;

  useEffect(() => {
    if (open) {
      reset(defaultCreateUserFormValues());
    }
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createUser.mutateAsync(createFormToPayload(values));
      toast.success(t.toast.userCreated);
      onOpenChange(false);
    } catch (e) {
      toast.error(mapUserApiError(e));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.users.modalCreateTitle}</DialogTitle>
          <DialogDescription>{t.users.modalCreateDesc}</DialogDescription>
        </DialogHeader>

        <form id="create-user-form" onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="usr-name">{t.users.fieldName}</Label>
            <Input
              id="usr-name"
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
            <Label htmlFor="usr-email">{t.users.fieldEmail}</Label>
            <Input
              id="usr-email"
              type="email"
              autoComplete="off"
              className="rounded-lg"
              {...register("email")}
            />
            {formState.errors.email?.message ? (
              <p className="text-xs text-destructive">
                {formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
              <Label htmlFor="usr-password">{t.users.fieldPassword}</Label>
              <span className="text-xs text-muted-foreground">
                {t.users.fieldPasswordHint}
              </span>
            </div>
            <Input
              id="usr-password"
              type="password"
              autoComplete="new-password"
              className="rounded-lg"
              {...register("password")}
            />
            {formState.errors.password?.message ? (
              <p className="text-xs text-destructive">
                {formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="usr-role">{t.users.fieldRole}</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="usr-role" className="rounded-lg">
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
            <Label htmlFor="usr-profile">{t.users.fieldProfile}</Label>
            <Controller
              control={control}
              name="profile"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="usr-profile" className="rounded-lg">
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
            disabled={createUser.isPending}
            onClick={() => onOpenChange(false)}
          >
            {t.common.cancel}
          </Button>
          <Button
            type="submit"
            form="create-user-form"
            className="rounded-lg"
            disabled={createUser.isPending}
          >
            {createUser.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t.users.creating}
              </>
            ) : (
              t.users.createSubmit
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
