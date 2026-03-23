"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { getClients } from "@/features/clients/api/getClients";
import type { ClientListItem } from "@/features/clients/api/types";
import { getBudgets } from "@/features/finance/api/getBudgets";
import type {
  BudgetListItem,
  CurrencyCode,
  FinancialMovementListItem,
  ObligationListItem,
} from "@/features/finance/api/types";
import { getMovements } from "@/features/finance/api/getMovements";
import { getObligations } from "@/features/finance/api/getObligations";

import { deriveDashboardFinanceKpis } from "../api/derive-dashboard-finance-kpis";
import type { DashboardFinanceKpis } from "../api/types";
import {
  buildCashFlowSeries,
  pickChartCurrency,
  type CashFlowChartPoint,
} from "../api/build-cash-flow-series";
import {
  DASHBOARD_ACCEPTED_BUDGETS_QUERY_KEY,
  DASHBOARD_MOVEMENTS_QUERY_KEY,
  DASHBOARD_PENDING_OBLIGATIONS_QUERY_KEY,
} from "./query-keys";

const STALE_MS = 30_000;

export interface DashboardDataResult {
  clients: ClientListItem[];
  obligations: ObligationListItem[];
  movements: FinancialMovementListItem[];
  budgetsAccepted: BudgetListItem[];
  kpis: DashboardFinanceKpis;
  cashFlowSeries: CashFlowChartPoint[];
  chartCurrency: CurrencyCode;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Carga clientes, obligaciones pendientes, movimientos y presupuestos aceptados;
 * deriva KPIs y serie temporal para el gráfico de flujo de caja.
 */
export function useDashboardData(): DashboardDataResult {
  const [clientsQ, movementsQ, obligationsQ, budgetsQ] = useQueries({
    queries: [
      {
        queryKey: ["clients"],
        queryFn: getClients,
        staleTime: STALE_MS,
      },
      {
        queryKey: DASHBOARD_MOVEMENTS_QUERY_KEY,
        queryFn: () => getMovements(),
        staleTime: STALE_MS,
      },
      {
        queryKey: DASHBOARD_PENDING_OBLIGATIONS_QUERY_KEY,
        queryFn: () => getObligations({ status: "PENDING" }),
        staleTime: STALE_MS,
      },
      {
        queryKey: DASHBOARD_ACCEPTED_BUDGETS_QUERY_KEY,
        queryFn: () => getBudgets({ status: "ACCEPTED" }),
        staleTime: STALE_MS,
      },
    ],
  });

  const isLoading =
    clientsQ.isLoading ||
    movementsQ.isLoading ||
    obligationsQ.isLoading ||
    budgetsQ.isLoading;

  const isError =
    clientsQ.isError ||
    movementsQ.isError ||
    obligationsQ.isError ||
    budgetsQ.isError;

  return useMemo(() => {
    const clients = clientsQ.data ?? [];
    const movements = movementsQ.data ?? [];
    const obligations = obligationsQ.data ?? [];
    const budgetsAccepted = budgetsQ.data ?? [];

    const kpis = deriveDashboardFinanceKpis(budgetsAccepted, movements);
    const chartCurrency = pickChartCurrency(movements);
    const cashFlowSeries = buildCashFlowSeries(movements, chartCurrency);

    return {
      clients,
      obligations,
      movements,
      budgetsAccepted,
      kpis,
      cashFlowSeries,
      chartCurrency,
      isLoading,
      isError,
    };
  }, [
    clientsQ.data,
    movementsQ.data,
    obligationsQ.data,
    budgetsQ.data,
    isLoading,
    isError,
  ]);
}
