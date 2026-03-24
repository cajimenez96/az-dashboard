import type { KanbanColumn } from "@/features/kanban/api/types";
import { apiClient } from "@/lib/api";

export interface UpdateColumnPayload {
  name?: string;
  color?: string | null;
}

export async function updateColumn(
  id: string,
  payload: UpdateColumnPayload,
): Promise<KanbanColumn> {
  const { data } = await apiClient.patch<KanbanColumn>(
    `/kanban-columns/${id}`,
    payload,
  );
  return data;
}
