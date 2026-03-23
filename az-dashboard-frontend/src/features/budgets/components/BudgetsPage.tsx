"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useClients } from "@/features/clients/hooks/useClients";
import { t } from "@/lib/i18n";

import { useBudgets } from "../hooks/useBudgets";
import { BudgetDetailModal } from "./BudgetDetailModal";
import { BudgetsTable } from "./BudgetsTable";
import { CreateBudgetModal } from "./CreateBudgetModal";

export function BudgetsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: rows = [], isLoading, isError } = useBudgets();
  const { data: clients = [] } = useClients();

  const openDetail = (id: string) => {
    setDetailId(id);
    setDetailOpen(true);
  };

  const onDetailOpenChange = (open: boolean) => {
    setDetailOpen(open);
    if (!open) setDetailId(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t.budgets.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.budgets.subtitle}</p>
          {clients.length === 0 ? (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
              {t.budgets.noClientsHint}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          className="shrink-0 rounded-xl"
          disabled={clients.length === 0}
          onClick={() => setCreateOpen(true)}
        >
          {t.budgets.newBudget}
        </Button>
      </header>

      <Card className="mt-8 border-border bg-card/80 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <BudgetsTable
            rows={rows}
            isLoading={isLoading}
            isError={isError}
            onRowOpen={openDetail}
          />
        </CardContent>
      </Card>

      <CreateBudgetModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
      />

      <BudgetDetailModal
        budgetId={detailId}
        open={detailOpen}
        onOpenChange={onDetailOpenChange}
      />
    </div>
  );
}
