"use client";

import { useMemo } from "react";

import type {
  BudgetListItem,
  CurrencyCode,
  FinancialMovementListItem,
  ObligationListItem,
} from "../api/types";
import {
  buildCashFlowSeries,
  computeCashMovementTotals,
  computePendingRevenueTotal,
  computeTotalBilled,
  filterByCurrency,
  groupMovementAmountsByDay,
  sortObligationsByDueDate,
  toSortedChartPoints,
} from "../lib/finance-compute";

const EMPTY_MOVEMENTS: FinancialMovementListItem[] = [];
const EMPTY_OBLIGATIONS: ObligationListItem[] = [];
const EMPTY_BUDGETS: BudgetListItem[] = [];

export function useFinanceDashboardData(
  movements: FinancialMovementListItem[] | undefined,
  obligationsPending: ObligationListItem[] | undefined,
  budgetsAccepted: BudgetListItem[] | undefined,
  displayCurrency: CurrencyCode,
) {
  return useMemo(() => {
    const mRaw = movements ?? EMPTY_MOVEMENTS;
    const oRaw = obligationsPending ?? EMPTY_OBLIGATIONS;
    const bRaw = budgetsAccepted ?? EMPTY_BUDGETS;

    const m = filterByCurrency([...mRaw], displayCurrency);
    const o = filterByCurrency([...oRaw], displayCurrency);
    const b = filterByCurrency([...bRaw], displayCurrency);

    const cash = computeCashMovementTotals(m);
    const pendingRevenue = computePendingRevenueTotal(o);
    const totalBilled = computeTotalBilled(b);

    const incomeByDay = groupMovementAmountsByDay(m, "INCOME");
    const expenseByDay = groupMovementAmountsByDay(m, "EXPENSE");

    return {
      metrics: {
        totalCollected: cash.totalCollected,
        cashBalance: cash.cashBalance,
        pendingRevenue,
        totalBilled,
      },
      incomeSeries: toSortedChartPoints(incomeByDay),
      expenseSeries: toSortedChartPoints(expenseByDay),
      cashFlowSeries: buildCashFlowSeries(incomeByDay, expenseByDay),
      upcomingObligations: sortObligationsByDueDate(o),
      rawCounts: {
        movements: mRaw.length,
        obligations: oRaw.length,
        budgets: bRaw.length,
      },
    };
  }, [movements, obligationsPending, budgetsAccepted, displayCurrency]);
}
