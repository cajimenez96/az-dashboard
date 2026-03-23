"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useClients } from "@/features/clients/hooks/useClients";
import { t } from "@/lib/i18n";

import {
  defaultLedgerFilters,
  filterMovements,
  type LedgerFilterState,
} from "../lib/filter-movements";
import { useMovements } from "../hooks/useMovements";
import { CreateMovementModal } from "./CreateMovementModal";
import { FinancialFilters } from "./FinancialFilters";
import { FinancialTable } from "./FinancialTable";

function filtersAreActive(f: LedgerFilterState): boolean {
  return (
    f.type !== defaultLedgerFilters.type ||
    f.clientId !== defaultLedgerFilters.clientId ||
    f.paymentMethod !== defaultLedgerFilters.paymentMethod ||
    f.dateFrom !== defaultLedgerFilters.dateFrom ||
    f.dateTo !== defaultLedgerFilters.dateTo ||
    f.search.trim() !== defaultLedgerFilters.search.trim()
  );
}

export function FinancialPage() {
  const [filters, setFilters] = useState<LedgerFilterState>(defaultLedgerFilters);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: movements = [], isLoading, isError } = useMovements();
  const { data: clients = [] } = useClients();

  const filtered = useMemo(
    () => filterMovements(movements, filters),
    [movements, filters],
  );

  const hasActiveFilters = filtersAreActive(filters);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t.ledger.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.ledger.subtitle}</p>
        </div>
        <Button
          type="button"
          className="hidden shrink-0 rounded-xl sm:inline-flex"
          onClick={() => setModalOpen(true)}
        >
          {t.ledger.newMovement}
        </Button>
      </header>

      <Card className="mt-8 border-border bg-card/80 shadow-sm backdrop-blur-sm">
        <CardContent className="pt-6">
          <FinancialFilters
            value={filters}
            onChange={setFilters}
            clients={clients}
          />
        </CardContent>
      </Card>

      <Card className="mt-6 border-border bg-card/80 shadow-sm backdrop-blur-sm">
        <CardContent className="p-0 sm:p-0">
          <div className="p-4 sm:p-6">
            <FinancialTable
              rows={filtered}
              isLoading={isLoading}
              isError={isError}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        type="button"
        size="icon"
        className="fixed bottom-6 right-6 z-40 size-14 rounded-full shadow-lg sm:hidden"
        onClick={() => setModalOpen(true)}
        aria-label={t.ledger.newMovement}
      >
        <Plus className="size-6" />
      </Button>

      <CreateMovementModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        movements={movements}
        clients={clients}
      />
    </div>
  );
}
