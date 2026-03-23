import { apiClient } from "@/lib/api";

import type { BudgetDetail, CreateBudgetPayload } from "./types";

/** Backend: POST /budgets */
export async function createBudget(
  payload: CreateBudgetPayload,
): Promise<BudgetDetail> {
  const { data } = await apiClient.post<BudgetDetail>("/budgets", payload);
  return data;
}
