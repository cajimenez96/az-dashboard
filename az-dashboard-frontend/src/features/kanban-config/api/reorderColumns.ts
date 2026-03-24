import { apiClient } from "@/lib/api";

export async function reorderColumns(orderedIds: string[]): Promise<void> {
  await apiClient.patch("/kanban-columns/reorder", { orderedIds });
}
