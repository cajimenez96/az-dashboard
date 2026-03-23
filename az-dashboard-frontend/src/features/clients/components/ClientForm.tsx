"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

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
import { t } from "@/lib/i18n";

import {
  type ClientFormValues,
  clientFormSchema,
  defaultClientFormValues,
} from "../lib/client-form-schema";

export const CLIENT_FORM_ID = "client-form";

export interface ClientFormProps {
  defaultValues: ClientFormValues;
  onSubmit: (values: ClientFormValues) => void | Promise<void>;
  disabled?: boolean;
  serverError?: string | null;
  /** When key changes, form resets to new defaultValues */
  resetKey?: string;
}

export function ClientForm({
  defaultValues,
  onSubmit,
  disabled,
  serverError,
  resetKey,
}: ClientFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [resetKey, defaultValues, reset]);

  return (
    <form
      id={CLIENT_FORM_ID}
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-4"
      noValidate
    >
      <div className="grid gap-2">
        <Label htmlFor="client-name">
          {t.clients.form.name}{" "}
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id="client-name"
          autoFocus
          autoComplete="organization"
          disabled={disabled}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="client-email">{t.clients.form.email}</Label>
        <Input
          id="client-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          disabled={disabled}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        <div className="grid gap-2">
          <Label htmlFor="client-phone">{t.clients.form.phone}</Label>
          <Input
            id="client-phone"
            type="tel"
            autoComplete="tel"
            disabled={disabled}
            {...register("phone")}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="client-company">{t.clients.form.company}</Label>
          <Input
            id="client-company"
            autoComplete="organization"
            disabled={disabled}
            {...register("company")}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="client-notes">{t.clients.form.notes}</Label>
        <Textarea
          id="client-notes"
          disabled={disabled}
          rows={3}
          {...register("notes")}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="client-status">
          {t.clients.form.status}{" "}
          <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger id="client-status" className="w-full">
                <SelectValue placeholder={t.clients.form.statusPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t.clients.statusActive}</SelectItem>
                <SelectItem value="INACTIVE">
                  {t.clients.statusInactive}
                </SelectItem>
                <SelectItem value="AT_RISK">{t.clients.statusAtRisk}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.status ? (
          <p className="text-xs text-destructive">{errors.status.message}</p>
        ) : null}
      </div>

      {serverError ? (
        <p className="text-sm text-destructive" role="status">
          {serverError}
        </p>
      ) : null}
    </form>
  );
}

export { defaultClientFormValues };
