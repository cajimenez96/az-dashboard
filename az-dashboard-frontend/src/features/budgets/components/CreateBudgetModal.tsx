"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
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

import { useCreateBudget } from "../hooks/useCreateBudget";
import { amountToApiString } from "../lib/amount";
import {
  createBudgetFormSchema,
  defaultCreateBudgetFormValues,
  type CreateBudgetFormValues,
} from "../lib/budget-form-schema";
import { dateInputToIso } from "../lib/date-to-iso";
import { mapBudgetApiError } from "../lib/map-budget-api-error";
import { PaymentPlanBuilder } from "./PaymentPlanBuilder";

export function CreateBudgetModal({
  open,
  onOpenChange,
  clients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientListItem[];
}) {
  const createBudget = useCreateBudget();

  const form = useForm<CreateBudgetFormValues>({
    resolver: zodResolver(createBudgetFormSchema),
    defaultValues: defaultCreateBudgetFormValues(),
  });

  const { handleSubmit, reset, register, formState, control } = form;

  useEffect(() => {
    if (open) {
      reset(defaultCreateBudgetFormValues());
    }
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createBudget.mutateAsync({
        title: values.title.trim(),
        clientId: values.clientId,
        currency: values.currency,
        totalAmount: amountToApiString(values.totalAmount),
        paymentPlanItems: values.paymentPlanItems.map((item, i) => ({
          order: i + 1,
          type: item.type,
          amount: amountToApiString(item.amount),
          dueDate: dateInputToIso(item.dueDate),
        })),
      });
      toast.success(t.toast.budgetCreated);
      onOpenChange(false);
    } catch (e) {
      toast.error(mapBudgetApiError(e));
    }
  });

  const sortedClients = [...clients].sort((a, b) =>
    a.name.localeCompare(b.name, "es"),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>{t.budgets.createTitle}</DialogTitle>
          <DialogDescription>{t.budgets.createDescription}</DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form id="create-budget-form" onSubmit={onSubmit} className="space-y-8">
            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium">{t.budgets.sectionGeneral}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="budget-title">{t.budgets.fieldTitle}</Label>
                  <Input
                    id="budget-title"
                    className="rounded-lg"
                    {...register("title")}
                  />
                  {formState.errors.title?.message ? (
                    <p className="text-xs text-destructive">
                      {formState.errors.title.message}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="budget-client">{t.budgets.fieldClient}</Label>
                  <Controller
                    control={control}
                    name="clientId"
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="budget-client" className="rounded-lg">
                          <SelectValue placeholder={t.budgets.fieldClient} />
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
                  <Label htmlFor="budget-currency">{t.budgets.fieldCurrency}</Label>
                  <Controller
                    control={control}
                    name="currency"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="budget-currency" className="rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ARS">ARS</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="budget-total">{t.budgets.fieldTotal}</Label>
                  <Input
                    id="budget-total"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    className="rounded-lg"
                    {...register("totalAmount")}
                  />
                  {formState.errors.totalAmount?.message ? (
                    <p className="text-xs text-destructive">
                      {formState.errors.totalAmount.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <PaymentPlanBuilder />
          </form>
        </FormProvider>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            disabled={createBudget.isPending}
            onClick={() => onOpenChange(false)}
          >
            {t.common.cancel}
          </Button>
          <Button
            type="submit"
            form="create-budget-form"
            className="rounded-lg"
            disabled={createBudget.isPending}
          >
            {createBudget.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t.budgets.creating}
              </>
            ) : (
              t.budgets.createSubmit
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
