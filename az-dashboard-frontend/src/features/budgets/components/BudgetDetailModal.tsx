"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/features/finance/lib/format-currency";
import { parseAmount } from "@/features/finance/lib/finance-compute";
import { formatLedgerDate } from "@/features/financial/lib/format-ledger-date";
import { t } from "@/lib/i18n";

import { useBudget } from "../hooks/useBudget";
import { useDeleteBudget } from "../hooks/useDeleteBudget";
import { useUpdateBudget } from "../hooks/useUpdateBudget";
import { useUpdateBudgetStatus } from "../hooks/useUpdateBudgetStatus";
import {
  editBudgetFormSchema,
  type EditBudgetFormValues,
} from "../lib/budget-form-schema";
import { mapBudgetApiError } from "../lib/map-budget-api-error";
import { resolvedPlanAmount } from "../lib/resolve-plan-amount";
import { amountToApiString } from "../lib/amount";
import { BudgetStatusBadge } from "./BudgetStatusBadge";

type ConfirmKind = "send" | "delete" | "accept" | "reject" | null;

function obligationStatusLabel(s: string): string {
  if (s === "PAID") return t.budgets.obligationStatusPaid;
  return t.budgets.obligationStatusPending;
}

export function BudgetDetailModal({
  budgetId,
  open,
  onOpenChange,
}: {
  budgetId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);

  const { data: budget, isLoading, isError, refetch } = useBudget(
    budgetId,
    open,
  );

  const updateBudget = useUpdateBudget();
  const updateStatus = useUpdateBudgetStatus();
  const deleteBudget = useDeleteBudget();

  const form = useForm<EditBudgetFormValues>({
    resolver: zodResolver(editBudgetFormSchema),
    defaultValues: {
      title: "",
      description: "",
      currency: "ARS",
      totalAmount: "",
    },
  });

  useEffect(() => {
    if (budget && editMode) {
      form.reset({
        title: budget.title,
        description: budget.description ?? "",
        currency: budget.currency,
        totalAmount: budget.totalAmount,
      });
    }
  }, [budget, editMode, form]);

  const handleClose = useCallback(
    (next: boolean) => {
      if (!next) {
        setEditMode(false);
        setConfirmKind(null);
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const onSaveEdit = form.handleSubmit(async (values) => {
    if (!budgetId) return;
    try {
      await updateBudget.mutateAsync({
        id: budgetId,
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        currency: values.currency,
        totalAmount: amountToApiString(values.totalAmount),
      });
      toast.success(t.toast.budgetUpdated);
      setEditMode(false);
      void refetch();
    } catch (e) {
      toast.error(mapBudgetApiError(e));
    }
  });

  const runConfirmed = async () => {
    if (!budgetId || !confirmKind) return;
    try {
      if (confirmKind === "delete") {
        await deleteBudget.mutateAsync(budgetId);
        toast.success(t.toast.budgetDeleted);
        setConfirmKind(null);
        handleClose(false);
        return;
      }
      if (confirmKind === "send") {
        await updateStatus.mutateAsync({ id: budgetId, status: "SENT" });
        toast.success(t.toast.budgetSent);
      } else if (confirmKind === "accept") {
        await updateStatus.mutateAsync({ id: budgetId, status: "ACCEPTED" });
        toast.success(t.toast.budgetAccepted);
      } else if (confirmKind === "reject") {
        await updateStatus.mutateAsync({ id: budgetId, status: "REJECTED" });
        toast.success(t.toast.budgetRejected);
      }
      setConfirmKind(null);
      void refetch();
    } catch (e) {
      toast.error(mapBudgetApiError(e));
    }
  };

  const statusBusy =
    updateStatus.isPending || deleteBudget.isPending || updateBudget.isPending;

  const confirmCopy = () => {
    switch (confirmKind) {
      case "send":
        return {
          title: t.budgets.confirmSendTitle,
          description: t.budgets.confirmSendDescription,
        };
      case "delete":
        return {
          title: t.budgets.confirmDeleteTitle,
          description: t.budgets.confirmDeleteDescription,
        };
      case "accept":
        return {
          title: t.budgets.confirmAcceptTitle,
          description: t.budgets.confirmAcceptDescription,
        };
      case "reject":
        return {
          title: t.budgets.confirmRejectTitle,
          description: t.budgets.confirmRejectDescription,
        };
      default:
        return { title: "", description: "" };
    }
  };

  const cc = confirmCopy();

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>{t.budgets.detailTitle}</DialogTitle>
            <DialogDescription className="sr-only">
              {t.budgets.detailTitle}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : null}

          {isError ? (
            <p className="py-8 text-center text-sm text-destructive">
              {t.budgets.loadError}
            </p>
          ) : null}

          {budget && !isLoading ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <BudgetStatusBadge status={budget.status} />
                <span className="text-sm text-muted-foreground">
                  {budget.client.name}
                </span>
              </div>

              {editMode && budget.status === "DRAFT" ? (
                <form
                  id="edit-budget-form"
                  onSubmit={onSaveEdit}
                  className="space-y-4 rounded-xl border border-border bg-muted/20 p-4"
                >
                  <p className="text-xs text-muted-foreground">
                    {t.budgets.editHint}
                  </p>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">{t.budgets.fieldTitle}</Label>
                    <Input id="edit-title" className="rounded-lg" {...form.register("title")} />
                    {form.formState.errors.title?.message ? (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.title.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-desc">{t.budgets.fieldDescription}</Label>
                    <Textarea
                      id="edit-desc"
                      rows={3}
                      className="rounded-lg resize-none"
                      {...form.register("description")}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>{t.budgets.fieldCurrency}</Label>
                      <Controller
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="rounded-lg">
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
                      <Label htmlFor="edit-total">{t.budgets.fieldTotal}</Label>
                      <Input
                        id="edit-total"
                        type="number"
                        step="0.01"
                        min="0"
                        className="rounded-lg"
                        {...form.register("totalAmount")}
                      />
                      {form.formState.errors.totalAmount?.message ? (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.totalAmount.message}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <h3 className="text-lg font-semibold">{budget.title}</h3>
                  {budget.description ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {budget.description}
                    </p>
                  ) : null}
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">
                        {t.budgets.fieldCurrency}
                      </dt>
                      <dd className="font-medium">{budget.currency}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        {t.budgets.fieldTotal}
                      </dt>
                      <dd className="font-semibold tabular-nums">
                        {formatCurrency(
                          parseAmount(budget.totalAmount),
                          budget.currency,
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-medium">{t.budgets.sectionPlan}</h4>
                <div className="overflow-hidden rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12">{t.budgets.planOrder}</TableHead>
                        <TableHead>{t.budgets.planColType}</TableHead>
                        <TableHead>{t.budgets.planAmountLabel}</TableHead>
                        <TableHead>{t.budgets.planResolved}</TableHead>
                        <TableHead>{t.budgets.planDueLabel}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budget.paymentPlanItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.order}</TableCell>
                          <TableCell>
                            {item.type === "PERCENTAGE"
                              ? t.budgets.planTypePercentage
                              : t.budgets.planTypeFixed}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {item.type === "PERCENTAGE"
                              ? `${parseAmount(item.amount)}%`
                              : formatCurrency(
                                  parseAmount(item.amount),
                                  budget.currency,
                                )}
                          </TableCell>
                          <TableCell className="font-medium tabular-nums">
                            {formatCurrency(
                              resolvedPlanAmount(
                                item.type,
                                item.amount,
                                budget.totalAmount,
                              ),
                              budget.currency,
                            )}
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {formatLedgerDate(item.dueDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {budget.obligations.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">
                    {t.budgets.obligationsTitle}
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>{t.budgets.colAmount}</TableHead>
                          <TableHead>{t.budgets.colDate}</TableHead>
                          <TableHead>{t.budgets.colStatus}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {budget.obligations.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell className="font-medium tabular-nums">
                              {formatCurrency(parseAmount(o.amount), o.currency)}
                            </TableCell>
                            <TableCell className="tabular-nums text-muted-foreground">
                              {formatLedgerDate(o.dueDate)}
                            </TableCell>
                            <TableCell>{obligationStatusLabel(o.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : null}

              {(budget.status === "ACCEPTED" || budget.status === "REJECTED") && (
                <p className="text-sm text-muted-foreground">
                  {t.budgets.readOnlyHint}
                </p>
              )}

              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                {budget.status === "DRAFT" && !editMode ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => setEditMode(true)}
                    >
                      {t.budgets.actionEdit}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => setConfirmKind("send")}
                    >
                      {t.budgets.actionSend}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="rounded-lg"
                      onClick={() => setConfirmKind("delete")}
                    >
                      {t.budgets.actionDelete}
                    </Button>
                  </>
                ) : null}

                {budget.status === "DRAFT" && editMode ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-lg"
                      disabled={updateBudget.isPending}
                      onClick={() => setEditMode(false)}
                    >
                      {t.budgets.actionCancelEdit}
                    </Button>
                    <Button
                      type="submit"
                      form="edit-budget-form"
                      className="rounded-lg"
                      disabled={updateBudget.isPending}
                    >
                      {updateBudget.isPending ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          {t.budgets.saving}
                        </>
                      ) : (
                        t.budgets.saveChanges
                      )}
                    </Button>
                  </>
                ) : null}

                {budget.status === "SENT" ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmKind("reject")}
                    >
                      {t.budgets.actionReject}
                    </Button>
                    <Button
                      type="button"
                      className="rounded-lg"
                      onClick={() => setConfirmKind("accept")}
                    >
                      {t.budgets.actionAccept}
                    </Button>
                  </>
                ) : null}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmKind !== null}
        onOpenChange={(v) => {
          if (!v) setConfirmKind(null);
        }}
      >
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{cc.title}</AlertDialogTitle>
            <AlertDialogDescription>{cc.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusBusy}>
              {t.common.cancel}
            </AlertDialogCancel>
            <Button
              type="button"
              variant={confirmKind === "delete" ? "destructive" : "default"}
              className="rounded-lg"
              disabled={statusBusy}
              onClick={() => void runConfirmed()}
            >
              {statusBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t.budgets.confirmAction
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
