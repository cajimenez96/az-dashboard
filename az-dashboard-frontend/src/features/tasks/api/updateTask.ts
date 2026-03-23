import { apiClient } from "@/lib/api";

import type { TaskListItem, UpdateTaskPayload } from "./types";

export async function updateTask(
  id: string,
  payload: UpdateTaskPayload,
): Promise<TaskListItem> {
  const body: Record<string, unknown> = {};

  if (payload.title !== undefined) body.title = payload.title.trim();
  if (payload.description !== undefined) {
    body.description = payload.description?.trim() || null;
  }
  if (payload.priority !== undefined) body.priority = payload.priority;
  if (payload.dueDate !== undefined) {
    body.dueDate = payload.dueDate || null;
  }
  if (payload.kanbanColumnId !== undefined) {
    body.kanbanColumnId = payload.kanbanColumnId;
  }
  if (payload.clientId !== undefined) body.clientId = payload.clientId;
  if (payload.systemId !== undefined) body.systemId = payload.systemId;
  if (payload.assignedToId !== undefined) {
    body.assignedToId = payload.assignedToId;
  }

  const { data } = await apiClient.patch<TaskListItem>(`/tasks/${id}`, body);
  return data;
}
