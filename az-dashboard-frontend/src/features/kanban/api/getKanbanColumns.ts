import { apiClient } from "@/lib/api";

import type { KanbanArea, KanbanColumn } from "./types";

export type { KanbanArea, KanbanColumn } from "./types";

export async function getKanbanColumns(params?: {
  area?: KanbanArea;
}): Promise<KanbanColumn[]> {
  const { data } = await apiClient.get<KanbanColumn[]>("/kanban-columns", {
    params: params?.area ? { area: params.area } : undefined,
  });
  return data;
}
