import { apiClient } from "@/lib/api";

import type { BudgetDetail, BudgetStatus } from "./types";

/** Backend: PATCH /budgets/:id/status */
export async function updateBudgetStatus(
  id: string,
  status: BudgetStatus,
): Promise<BudgetDetail> {
  const { data } = await apiClient.patch<BudgetDetail>(
    `/budgets/${id}/status`,
    { status },
  );
  return data;
}
