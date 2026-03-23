"use client";

import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";

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
import { formatCurrency } from "@/features/finance/lib/format-currency";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import type { CreateBudgetFormValues } from "../lib/budget-form-schema";
import { evaluatePaymentPlan } from "../lib/plan-validation";

export function PaymentPlanBuilder() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CreateBudgetFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "paymentPlanItems",
  });

  const totalAmountRaw = useWatch({ control, name: "totalAmount" }) ?? "";
  const currency = useWatch({ control, name: "currency" }) ?? "ARS";
  const items = useWatch({ control, name: "paymentPlanItems" }) ?? [];

  const totalBudget = Number.parseFloat(totalAmountRaw.replace(",", "."));
  const totalOk = Number.isFinite(totalBudget) && totalBudget > 0;

  const ev = evaluatePaymentPlan(items, totalOk ? totalBudget : 0);

  const showPercentBlock = items.some((i) => i.type === "PERCENTAGE");
  const showFixedBlock = items.some((i) => i.type === "FIXED");

  const percentColor =
    !showPercentBlock || !ev.onlyPercentage
      ? "text-muted-foreground"
      : ev.percentageTotalOk && ev.percentageRowsValid
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-destructive";

  const fixedColor =
    !showFixedBlock
      ? "text-muted-foreground"
      : ev.fixedTotalOk
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-destructive";

  const addRow = () => {
    const today = new Date().toISOString().slice(0, 10);
    append({ type: "PERCENTAGE", amount: "", dueDate: today });
  };

  const paymentPlanItemsError = errors.paymentPlanItems;
  const planArrayMessage =
    paymentPlanItemsError &&
    typeof paymentPlanItemsError === "object" &&
    "message" in paymentPlanItemsError &&
    typeof (paymentPlanItemsError as { message?: string }).message === "string"
      ? (paymentPlanItemsError as { message: string }).message
      : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Label className="text-base font-medium">{t.budgets.sectionPlan}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-lg"
          onClick={addRow}
        >
          <Plus className="mr-1.5 size-4" />
          {t.budgets.planAddRow}
        </Button>
      </div>

      <div className="hidden rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,140px)_1fr_minmax(0,140px)_auto] md:gap-3">
        <span>{t.budgets.planColType}</span>
        <span>{t.budgets.planAmountLabel}</span>
        <span>{t.budgets.planDueLabel}</span>
        <span className="w-10 text-center" aria-hidden />
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => {
          const amountName =
            `paymentPlanItems.${index}.amount` as const;
          const dueName =
            `paymentPlanItems.${index}.dueDate` as const;

          const rowErrors = errors.paymentPlanItems?.[index];

          return (
            <div
              key={field.id}
              className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,140px)_1fr_minmax(0,140px)_auto] md:items-end md:gap-3"
            >
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground md:sr-only">
                  {t.budgets.planColType}
                </Label>
                <Controller
                  control={control}
                  name={`paymentPlanItems.${index}.type`}
                  render={({ field: f }) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger className="h-10 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">
                          {t.budgets.planTypePercentage}
                        </SelectItem>
                        <SelectItem value="FIXED">
                          {t.budgets.planTypeFixed}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground md:sr-only">
                  {t.budgets.planAmountLabel}
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  className="h-10 rounded-lg"
                  {...register(amountName)}
                />
                {rowErrors?.amount?.message ? (
                  <p className="text-xs text-destructive">
                    {String(rowErrors.amount.message)}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground md:sr-only">
                  {t.budgets.planDueLabel}
                </Label>
                <Input
                  type="date"
                  className="h-10 rounded-lg"
                  {...register(dueName)}
                />
                {rowErrors?.dueDate?.message ? (
                  <p className="text-xs text-destructive">
                    {String(rowErrors.dueDate.message)}
                  </p>
                ) : null}
              </div>

              <div className="flex justify-end md:pb-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={fields.length <= 1}
                  onClick={() => remove(index)}
                  aria-label={t.budgets.planRemoveRow}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {planArrayMessage ? (
        <p className="text-sm text-destructive">{planArrayMessage}</p>
      ) : null}

      <div
        className="min-h-[5.5rem] space-y-2 rounded-xl border border-border bg-muted/20 p-4 text-sm"
        aria-live="polite"
      >
        {showPercentBlock ? (
          <p className={cn("tabular-nums font-medium", percentColor)}>
            {t.budgets.planSummaryPercent}: {ev.percentageSum.toFixed(2)}%
            {ev.onlyPercentage
              ? ev.percentageTotalOk
                ? " · OK"
                : " · debe ser 100%"
              : null}
          </p>
        ) : null}
        {showFixedBlock ? (
          <p className={cn("tabular-nums font-medium", fixedColor)}>
            {t.budgets.planSummaryFixed}:{" "}
            {formatCurrency(ev.fixedSum, currency)}
            {totalOk
              ? ` ${t.budgets.planSummaryVsTotal} (${formatCurrency(totalBudget, currency)})`
              : ""}
            {!ev.fixedTotalOk ? " · excede el total" : ""}
          </p>
        ) : null}
        {!ev.onlyPercentage && ev.hasFixed ? (
          <p className="text-xs text-muted-foreground">
            {t.budgets.planMixedHint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
