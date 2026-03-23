import type {
  CurrencyCode,
  FinancialMovementListItem,
} from "@/features/finance/api/types";
import { parseAmount } from "@/features/finance/lib/finance-compute";

export interface CashFlowChartPoint {
  /** YYYY-MM-DD */
  date: string;
  income: number;
  expense: number;
}

/** Elige la moneda con mayor volumen absoluto para el gráfico (una sola escala). */
export function pickChartCurrency(
  movements: FinancialMovementListItem[],
): CurrencyCode {
  let ars = 0;
  let usd = 0;
  for (const m of movements) {
    const a = parseAmount(m.amount);
    if (m.currency === "ARS") ars += a;
    else usd += a;
  }
  return usd > ars ? "USD" : "ARS";
}

/** Agrupa movimientos por día (fecha del movimiento) en una moneda. */
export function buildCashFlowSeries(
  movements: FinancialMovementListItem[],
  currency: CurrencyCode,
): CashFlowChartPoint[] {
  const byDay = new Map<string, { income: number; expense: number }>();

  for (const m of movements) {
    if (m.currency !== currency) continue;
    const day = m.date.slice(0, 10);
    if (!byDay.has(day)) {
      byDay.set(day, { income: 0, expense: 0 });
    }
    const cell = byDay.get(day)!;
    const a = parseAmount(m.amount);
    if (m.type === "INCOME") cell.income += a;
    else if (m.type === "EXPENSE") cell.expense += a;
  }

  const keys = [...byDay.keys()].sort();
  return keys.map((date) => ({
    date,
    income: byDay.get(date)!.income,
    expense: byDay.get(date)!.expense,
  }));
}
