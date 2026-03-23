"use client";

import type { ClientListItem } from "@/features/clients/api/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentMethodLabel } from "@/features/dashboard/lib/payment-method-label";
import { t } from "@/lib/i18n";

import { PAYMENT_METHOD_CODES } from "../api/createMovement";
import {
  defaultLedgerFilters,
  LEDGER_FILTER_ALL,
  type LedgerFilterState,
} from "../lib/filter-movements";

function setFilter<K extends keyof LedgerFilterState>(
  onChange: (next: LedgerFilterState) => void,
  prev: LedgerFilterState,
  key: K,
  value: LedgerFilterState[K],
) {
  onChange({ ...prev, [key]: value });
}

export function FinancialFilters({
  value,
  onChange,
  clients,
}: {
  value: LedgerFilterState;
  onChange: (next: LedgerFilterState) => void;
  clients: ClientListItem[];
}) {
  const sortedClients = [...clients].sort((a, b) =>
    a.name.localeCompare(b.name, "es"),
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="grid w-full min-w-[140px] gap-1.5 sm:w-auto sm:min-w-[150px]">
        <Label className="text-xs text-muted-foreground">
          {t.ledger.filterType}
        </Label>
        <Select
          value={value.type === "all" ? LEDGER_FILTER_ALL : value.type}
          onValueChange={(v) =>
            setFilter(
              onChange,
              value,
              "type",
              v === LEDGER_FILTER_ALL ? "all" : (v as LedgerFilterState["type"]),
            )
          }
        >
          <SelectTrigger className="h-9 rounded-lg bg-muted/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={LEDGER_FILTER_ALL}>
              {t.ledger.filterTypeAll}
            </SelectItem>
            <SelectItem value="INCOME">{t.ledger.filterTypeIncome}</SelectItem>
            <SelectItem value="EXPENSE">{t.ledger.filterTypeExpense}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid w-full min-w-[160px] gap-1.5 sm:w-auto sm:min-w-[200px]">
        <Label className="text-xs text-muted-foreground">
          {t.ledger.filterClient}
        </Label>
        <Select
          value={value.clientId}
          onValueChange={(v) => setFilter(onChange, value, "clientId", v)}
        >
          <SelectTrigger className="h-9 rounded-lg bg-muted/40">
            <SelectValue placeholder={t.ledger.filterClientAll} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={LEDGER_FILTER_ALL}>
              {t.ledger.filterClientAll}
            </SelectItem>
            {sortedClients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid w-full min-w-[160px] gap-1.5 sm:w-auto sm:min-w-[190px]">
        <Label className="text-xs text-muted-foreground">
          {t.ledger.filterPayment}
        </Label>
        <Select
          value={value.paymentMethod}
          onValueChange={(v) => setFilter(onChange, value, "paymentMethod", v)}
        >
          <SelectTrigger className="h-9 rounded-lg bg-muted/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={LEDGER_FILTER_ALL}>
              {t.ledger.filterPaymentAll}
            </SelectItem>
            {PAYMENT_METHOD_CODES.map((code) => (
              <SelectItem key={code} value={code}>
                {paymentMethodLabel(code)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex w-full flex-wrap gap-3 sm:w-auto">
        <div className="grid min-w-[140px] flex-1 gap-1.5 sm:flex-initial">
          <Label className="text-xs text-muted-foreground">
            {t.ledger.filterDateFrom}
          </Label>
          <Input
            type="date"
            className="h-9 rounded-lg bg-muted/40"
            value={value.dateFrom}
            onChange={(e) =>
              setFilter(onChange, value, "dateFrom", e.target.value)
            }
          />
        </div>
        <div className="grid min-w-[140px] flex-1 gap-1.5 sm:flex-initial">
          <Label className="text-xs text-muted-foreground">
            {t.ledger.filterDateTo}
          </Label>
          <Input
            type="date"
            className="h-9 rounded-lg bg-muted/40"
            value={value.dateTo}
            onChange={(e) =>
              setFilter(onChange, value, "dateTo", e.target.value)
            }
          />
        </div>
      </div>

      <div className="grid w-full min-w-[200px] flex-1 gap-1.5 sm:min-w-[240px]">
        <Label className="sr-only" htmlFor="ledger-search">
          {t.common.search}
        </Label>
        <Input
          id="ledger-search"
          className="h-9 rounded-lg bg-muted/40"
          placeholder={t.ledger.searchPlaceholder}
          aria-label={t.ledger.ariaSearch}
          value={value.search}
          onChange={(e) => setFilter(onChange, value, "search", e.target.value)}
        />
      </div>

      <button
        type="button"
        className="text-xs text-muted-foreground underline-offset-4 hover:underline sm:mb-2"
        onClick={() => onChange({ ...defaultLedgerFilters })}
      >
        {t.ledger.resetFilters}
      </button>
    </div>
  );
}
