import { apiClient } from "@/lib/api";

import type { FinancialMovementListItem, MovementQueryParams } from "./types";

/**
 * Lists cash movements (real money). Backend: GET /financial/movements
 */
export async function getMovements(
  params?: MovementQueryParams,
): Promise<FinancialMovementListItem[]> {
  const { data } = await apiClient.get<FinancialMovementListItem[]>(
    "/financial/movements",
    { params },
  );
  return Array.isArray(data) ? data : [];
}
