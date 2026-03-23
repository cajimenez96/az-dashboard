import type { FinancialMovementListItem } from "@/features/finance/api/types";
import { parseAmount } from "@/features/finance/lib/finance-compute";

/**
 * Cobros vinculados (ingresos) ya registrados para una obligación, según la lista cargada.
 */
export function sumLinkedIncomeForObligation(
  movements: FinancialMovementListItem[],
  obligationId: string,
): number {
  return movements
    .filter(
      (m) =>
        m.obligationId === obligationId &&
        m.type === "INCOME",
    )
    .reduce((sum, m) => sum + parseAmount(m.amount), 0);
}
