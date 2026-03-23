import { apiClient } from "@/lib/api";

import type { BudgetDetail, UpdateBudgetPayload } from "./types";

/** Backend: PATCH /budgets/:id (solo DRAFT) */
export async function updateBudget(
  id: string,
  payload: UpdateBudgetPayload,
): Promise<BudgetDetail> {
  const { data } = await apiClient.patch<BudgetDetail>(
    `/budgets/${id}`,
    payload,
  );
  return data;
}
