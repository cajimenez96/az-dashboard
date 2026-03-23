import type {
  BudgetListItem,
  FinancialMovementListItem,
} from "@/features/finance/api/types";
import { parseAmount } from "@/features/finance/lib/finance-compute";

import type { CurrencyFinanceTotals, DashboardFinanceKpis } from "./types";

function emptyTotals(): CurrencyFinanceTotals {
  return { facturacion: 0, cobrado: 0, gastos: 0, balance: 0 };
}

export function deriveDashboardFinanceKpis(
  budgetsAccepted: BudgetListItem[],
  movements: FinancialMovementListItem[],
): DashboardFinanceKpis {
  const acc: Record<string, CurrencyFinanceTotals> = {
    ARS: emptyTotals(),
    USD: emptyTotals(),
  };

  for (const b of budgetsAccepted) {
    if (b.status !== "ACCEPTED") continue;
    const cur = b.currency;
    if (!acc[cur]) acc[cur] = emptyTotals();
    acc[cur].facturacion += parseAmount(b.totalAmount);
  }

  for (const m of movements) {
    const cur = m.currency;
    if (!acc[cur]) acc[cur] = emptyTotals();
    const a = parseAmount(m.amount);
    if (m.type === "INCOME") acc[cur].cobrado += a;
    else if (m.type === "EXPENSE") acc[cur].gastos += a;
  }

  (["ARS", "USD"] as const).forEach((c) => {
    const t = acc[c];
    t.balance = t.cobrado - t.gastos;
  });

  const out: DashboardFinanceKpis = {};
  (["ARS", "USD"] as const).forEach((c) => {
    const t = acc[c];
    if (
      t.facturacion > 0 ||
      t.cobrado > 0 ||
      t.gastos > 0 ||
      t.balance !== 0
    ) {
      out[c] = t;
    }
  });

  return out;
}

export function normalizeSummaryApiResponse(
  dto: import("./types").FinancialSummaryApiDto,
): DashboardFinanceKpis | null {
  if (!dto.byCurrency) return null;
  const out: DashboardFinanceKpis = {};
  for (const c of ["ARS", "USD"] as const) {
    const row = dto.byCurrency[c];
    if (!row) continue;
    const facturacion = row.totalBilled ?? 0;
    const cobrado = row.totalIncome ?? 0;
    const gastos = row.totalExpense ?? 0;
    if (facturacion === 0 && cobrado === 0 && gastos === 0) continue;
    out[c] = {
      facturacion,
      cobrado,
      gastos,
      balance: cobrado - gastos,
    };
  }
  return Object.keys(out).length > 0 ? out : null;
}
