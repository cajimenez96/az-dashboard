import type { KanbanArea, KanbanColumn } from "@/features/kanban/api/types";
import { apiClient } from "@/lib/api";

export async function getColumns(area: KanbanArea): Promise<KanbanColumn[]> {
  const { data } = await apiClient.get<KanbanColumn[]>("/kanban-columns", {
    params: { area },
  });
  return data;
}
