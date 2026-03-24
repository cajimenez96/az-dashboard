import type { KanbanArea, KanbanColumn } from "@/features/kanban/api/types";
import { apiClient } from "@/lib/api";

export interface CreateColumnPayload {
  name: string;
  area: KanbanArea;
  color?: string;
}

export async function createColumn(
  payload: CreateColumnPayload,
): Promise<KanbanColumn> {
  const { data } = await apiClient.post<KanbanColumn>(
    "/kanban-columns",
    payload,
  );
  return data;
}
