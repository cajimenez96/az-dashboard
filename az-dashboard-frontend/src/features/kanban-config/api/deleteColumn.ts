import { apiClient } from "@/lib/api";

export async function deleteColumn(id: string): Promise<void> {
  await apiClient.delete(`/kanban-columns/${id}`);
}
