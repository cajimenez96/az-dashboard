import dayjs from "dayjs";

import type {
  BudgetListItem,
  CurrencyCode,
  FinancialMovementListItem,
  ObligationListItem,
} from "../api/types";

export function parseAmount(amount: string | number): number {
  const n = typeof amount === "number" ? amount : Number.parseFloat(amount);
  return Number.isFinite(n) ? n : 0;
}

export function dayKeyFromIso(iso: string): string {
  return dayjs(iso).format("YYYY-MM-DD");
}

export interface MetricValues {
  totalCollected: number;
  totalExpenses: number;
  cashBalance: number;
  pendingRevenue: number;
  totalBilled: number;
}

/** Cash metrics from movements only (never obligations). */
export function computeCashMovementTotals(
  movements: FinancialMovementListItem[],
): Pick<MetricValues, "totalCollected" | "totalExpenses" | "cashBalance"> {
  let totalCollected = 0;
  let totalExpenses = 0;
  for (const m of movements) {
    const a = parseAmount(m.amount);
    if (m.type === "INCOME") totalCollected += a;
    else if (m.type === "EXPENSE") totalExpenses += a;
  }
  return {
    totalCollected,
    totalExpenses,
    cashBalance: totalCollected - totalExpenses,
  };
}

/** Expected revenue: obligations only (PENDING). */
export function computePendingRevenueTotal(
  obligations: ObligationListItem[],
): number {
  return obligations
    .filter((o) => o.status === "PENDING")
    .reduce((s, o) => s + parseAmount(o.amount), 0);
}

/** Accepted budgets total — budgets entity only (not movements). */
export function computeTotalBilled(
  budgets: BudgetListItem[],
): number {
  return budgets
    .filter((b) => b.status === "ACCEPTED")
    .reduce((s, b) => s + parseAmount(b.totalAmount), 0);
}

export function groupMovementAmountsByDay(
  movements: FinancialMovementListItem[],
  type: FinancialMovementListItem["type"],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const m of movements) {
    if (m.type !== type) continue;
    const key = dayKeyFromIso(m.date);
    const a = parseAmount(m.amount);
    map[key] = (map[key] ?? 0) + a;
  }
  return map;
}

export function toSortedChartPoints(
  amountsByDay: Record<string, number>,
): { date: string; amount: number }[] {
  return Object.entries(amountsByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));
}

export function buildCashFlowSeries(
  incomeByDay: Record<string, number>,
  expenseByDay: Record<string, number>,
): { date: string; income: number; expense: number }[] {
  const keys = new Set([
    ...Object.keys(incomeByDay),
    ...Object.keys(expenseByDay),
  ]);
  return [...keys]
    .sort((a, b) => a.localeCompare(b))
    .map((date) => ({
      date,
      income: incomeByDay[date] ?? 0,
      expense: expenseByDay[date] ?? 0,
    }));
}

export function sortObligationsByDueDate(
  obligations: ObligationListItem[],
): ObligationListItem[] {
  return [...obligations].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
}

export function filterByCurrency<T extends { currency: CurrencyCode }>(
  rows: T[],
  currency: CurrencyCode,
): T[] {
  return rows.filter((r) => r.currency === currency);
}
