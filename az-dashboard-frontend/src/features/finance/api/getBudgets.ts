import { apiClient } from "@/lib/api";

import type { BudgetListItem, BudgetQueryParams } from "./types";

/** Backend: GET /budgets */
export async function getBudgets(
  params?: BudgetQueryParams,
): Promise<BudgetListItem[]> {
  const { data } = await apiClient.get<BudgetListItem[]>("/budgets", {
    params,
  });
  return Array.isArray(data) ? data : [];
}
