import { apiClient } from "@/lib/api";

import type { TaskListItem } from "./types";

export type { TaskListItem, TaskPriority } from "./types";

export async function getTasks(): Promise<TaskListItem[]> {
  const { data } = await apiClient.get<TaskListItem[]>("/tasks");
  return data;
}
