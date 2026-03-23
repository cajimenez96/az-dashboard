import type {
  FinancialMovementListItem,
  MovementType,
} from "@/features/finance/api/types";

export const LEDGER_FILTER_ALL = "__all__";

export interface LedgerFilterState {
  type: "all" | MovementType;
  clientId: string;
  paymentMethod: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

export const defaultLedgerFilters: LedgerFilterState = {
  type: "all",
  clientId: LEDGER_FILTER_ALL,
  paymentMethod: LEDGER_FILTER_ALL,
  dateFrom: "",
  dateTo: "",
  search: "",
};

function movementDateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function filterMovements(
  items: FinancialMovementListItem[],
  filters: LedgerFilterState,
): FinancialMovementListItem[] {
  const q = filters.search.trim().toLowerCase();

  return items.filter((m) => {
    if (filters.type !== "all" && m.type !== filters.type) return false;
    if (
      filters.clientId !== LEDGER_FILTER_ALL &&
      m.clientId !== filters.clientId
    ) {
      return false;
    }
    if (
      filters.paymentMethod !== LEDGER_FILTER_ALL &&
      m.paymentMethod !== filters.paymentMethod
    ) {
      return false;
    }
    const d = movementDateKey(m.date);
    if (filters.dateFrom && d < filters.dateFrom) return false;
    if (filters.dateTo && d > filters.dateTo) return false;
    if (q.length > 0) {
      const desc = (m.description ?? "").toLowerCase();
      if (!desc.includes(q)) return false;
    }
    return true;
  });
}
