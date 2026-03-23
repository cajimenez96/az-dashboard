import { apiClient } from "@/lib/api";

import type { CreateTaskPayload, TaskListItem } from "./types";

export async function createTask(
  payload: CreateTaskPayload,
): Promise<TaskListItem> {
  const body: Record<string, unknown> = {
    title: payload.title.trim(),
    kanbanColumnId: payload.kanbanColumnId,
  };

  const d = payload.description?.trim();
  if (d) body.description = d;

  if (payload.priority) body.priority = payload.priority;

  if (payload.dueDate) body.dueDate = payload.dueDate;

  if (payload.clientId) body.clientId = payload.clientId;
  if (payload.systemId) body.systemId = payload.systemId;
  if (payload.assignedToId) body.assignedToId = payload.assignedToId;

  const { data } = await apiClient.post<TaskListItem>("/tasks", body);
  return data;
}
