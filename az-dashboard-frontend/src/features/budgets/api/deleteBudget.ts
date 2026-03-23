import { apiClient } from "@/lib/api";

/** Backend: DELETE /budgets/:id (soft delete, solo DRAFT) */
export async function deleteBudget(id: string): Promise<void> {
  await apiClient.delete(`/budgets/${id}`);
}
