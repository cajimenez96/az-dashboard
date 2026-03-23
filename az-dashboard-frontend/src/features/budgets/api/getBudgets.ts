import { apiClient } from "@/lib/api";

import type { BudgetListItem } from "./types";

/** Backend: GET /budgets */
export async function getBudgets(): Promise<BudgetListItem[]> {
  const { data } = await apiClient.get<BudgetListItem[]>("/budgets");
  return Array.isArray(data) ? data : [];
}
