import type { CurrencyCode } from "@/features/finance/api/types";

export interface CurrencyFinanceTotals {
  facturacion: number;
  cobrado: number;
  gastos: number;
  balance: number;
}

/** KPI figures grouped by currency (ARS / USD). */
export type DashboardFinanceKpis = Partial<
  Record<CurrencyCode, CurrencyFinanceTotals>
>;

/** Optional backend shape for GET /financial/summary when available. */
export interface FinancialSummaryApiDto {
  byCurrency?: Partial<
    Record<
      CurrencyCode,
      {
        totalBilled?: number;
        totalIncome?: number;
        totalExpense?: number;
      }
    >
  >;
}
