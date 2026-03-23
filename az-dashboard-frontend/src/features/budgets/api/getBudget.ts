import { apiClient } from "@/lib/api";

import type { BudgetDetail } from "./types";

/** Backend: GET /budgets/:id */
export async function getBudget(id: string): Promise<BudgetDetail> {
  const { data } = await apiClient.get<BudgetDetail>(`/budgets/${id}`);
  return data;
}
