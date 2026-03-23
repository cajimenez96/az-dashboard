"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import type { ClientListItem } from "@/features/clients/api/types";
import { paymentMethodLabel } from "@/features/dashboard/lib/payment-method-label";
import type { FinancialMovementListItem } from "@/features/finance/api/types";
import { parseAmount } from "@/features/finance/lib/finance-compute";
import { formatCurrency } from "@/features/finance/lib/format-currency";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { t } from "@/lib/i18n";

import { PAYMENT_METHOD_CODES } from "../api/createMovement";
import { useCreateMovement } from "../hooks/useCreateMovement";
import { useLedgerObligations } from "../hooks/useLedgerObligations";
import { formatLedgerDate } from "../lib/format-ledger-date";
import {
  amountInputToApiString,
  dateInputToIso,
  defaultMovementFormValues,
  movementFormSchema,
  type MovementFormValues,
} from "../lib/movement-form-schema";
import { sumLinkedIncomeForObligation } from "../lib/obligation-ledger-summary";

export function CreateMovementModal({
  open,
  onOpenChange,
  movements,
  clients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movements: FinancialMovementListItem[];
  clients: ClientListItem[];
}) {
  const createMovement = useCreateMovement();
  const { data: obligations = [], isLoading: obligationsLoading } =
    useLedgerObligations();

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [clients],
  );

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: defaultMovementFormValues(),
  });

  const { control, handleSubmit, reset, setValue, getValues, formState } = form;
  const obligationIdWatch = useWatch({ control, name: "obligationId" }) ?? "";

  useEffect(() => {
    if (open) {
      reset(defaultMovementFormValues());
    }
  }, [open, reset]);

  const selectedObligation = useMemo(
    () => obligations.find((o) => o.id === obligationIdWatch),
    [obligations, obligationIdWatch],
  );

  const obligationSummary = useMemo(() => {
    if (!selectedObligation) return null;
    const total = parseAmount(selectedObligation.amount);
    const linked = sumLinkedIncomeForObligation(
      movements,
      selectedObligation.id,
    );
    const remaining = Math.max(0, total - linked);
    return { total, linked, remaining, currency: selectedObligation.currency };
  }, [selectedObligation, movements]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const amountStr = amountInputToApiString(values.amount);
      const dateIso = dateInputToIso(values.date);
      await createMovement.mutateAsync({
        type: values.type,
        amount: amountStr,
        paymentMethod: values.paymentMethod,
        date: dateIso,
        description: values.description.trim() || undefined,
        clientId: values.clientId.trim() || undefined,
        obligationId: values.obligationId.trim() || undefined,
        currency: values.currency,
      });
      toast.success(t.toast.movementCreated);
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t.toast.error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.ledger.modalTitle}</DialogTitle>
          <DialogDescription>{t.ledger.modalDescription}</DialogDescription>
        </DialogHeader>

        <form id="ledger-create-movement" onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="movement-type">{t.ledger.fieldType}</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="movement-type" className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">{t.ledger.typeIncomeShort}</SelectItem>
                    <SelectItem value="EXPENSE">{t.ledger.typeExpenseShort}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {formState.errors.type?.message ? (
              <p className="text-xs text-destructive">
                {formState.errors.type.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="movement-amount">{t.ledger.fieldAmount}</Label>
              <Input
                id="movement-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="rounded-lg"
                {...form.register("amount")}
              />
              {formState.errors.amount?.message ? (
                <p className="text-xs text-destructive">
                  {formState.errors.amount.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="movement-currency">{t.ledger.fieldCurrency}</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="movement-currency" className="rounded-lg">
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
          </div>

          <div className="grid gap-2">
            <Label htmlFor="movement-payment">{t.ledger.fieldPayment}</Label>
            <Controller
              control={control}
              name="paymentMethod"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="movement-payment" className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_CODES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {paymentMethodLabel(code)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {formState.errors.paymentMethod?.message ? (
              <p className="text-xs text-destructive">
                {formState.errors.paymentMethod.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="movement-date">{t.ledger.fieldDate}</Label>
            <Input
              id="movement-date"
              type="date"
              className="rounded-lg"
              {...form.register("date")}
            />
            {formState.errors.date?.message ? (
              <p className="text-xs text-destructive">
                {formState.errors.date.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="movement-desc">{t.ledger.fieldDescription}</Label>
            <Textarea
              id="movement-desc"
              rows={3}
              className="rounded-lg resize-none"
              placeholder=""
              {...form.register("description")}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <Label htmlFor="movement-client">{t.ledger.fieldClient}</Label>
              <span className="text-xs text-muted-foreground">
                {t.ledger.fieldClientHint}
              </span>
            </div>
            <Controller
              control={control}
              name="clientId"
              render={({ field }) => (
                <Select
                  value={field.value || "__none__"}
                  onValueChange={(v) =>
                    field.onChange(v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger id="movement-client" className="rounded-lg">
                    <SelectValue placeholder={t.ledger.clientPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t.ledger.optionNone}</SelectItem>
                    {sortedClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <Label htmlFor="movement-obligation">{t.ledger.fieldObligation}</Label>
              <span className="text-xs text-muted-foreground">
                {t.ledger.fieldObligationHint}
              </span>
            </div>
            <Controller
              control={control}
              name="obligationId"
              render={({ field }) => (
                <Select
                  value={field.value || "__none__"}
                  onValueChange={(v) => {
                    const next = v === "__none__" ? "" : v;
                    field.onChange(next);
                    const ob = obligations.find((o) => o.id === next);
                    if (ob?.clientId && !getValues("clientId")) {
                      setValue("clientId", ob.clientId);
                    }
                  }}
                  disabled={obligationsLoading}
                >
                  <SelectTrigger id="movement-obligation" className="rounded-lg">
                    <SelectValue placeholder={t.ledger.obligationPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t.ledger.optionNone}</SelectItem>
                    {obligations.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.client.name} ·{" "}
                        {formatCurrency(
                          parseAmount(o.amount),
                          o.currency,
                        )}{" "}
                        · {formatLedgerDate(o.dueDate)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {obligationSummary ? (
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <dl className="grid gap-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    {t.ledger.obligationTotal}
                  </dt>
                  <dd className="tabular-nums font-medium">
                    {formatCurrency(
                      obligationSummary.total,
                      obligationSummary.currency,
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    {t.ledger.obligationLinked}
                  </dt>
                  <dd className="tabular-nums">
                    {formatCurrency(
                      obligationSummary.linked,
                      obligationSummary.currency,
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-2">
                  <dt className="font-medium text-foreground">
                    {t.ledger.obligationRemaining}
                  </dt>
                  <dd className="tabular-nums font-semibold">
                    {formatCurrency(
                      obligationSummary.remaining,
                      obligationSummary.currency,
                    )}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                {t.ledger.obligationNoData}
              </p>
            </div>
          ) : null}
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => onOpenChange(false)}
            disabled={createMovement.isPending}
          >
            {t.common.cancel}
          </Button>
          <Button
            type="submit"
            form="ledger-create-movement"
            className="rounded-lg"
            disabled={createMovement.isPending}
          >
            {createMovement.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t.ledger.submitting}
              </>
            ) : (
              t.ledger.submit
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
