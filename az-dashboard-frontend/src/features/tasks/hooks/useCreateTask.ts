"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTask } from "../api/createTask";
import type { CreateTaskPayload, TaskListItem } from "../api/types";

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: (created) => {
      queryClient.setQueryData<TaskListItem[]>(["tasks"], (old) => {
        const next = [...(old ?? [])];
        const colId = created.kanbanColumn.id;
        let insertAt = next.length;
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].kanbanColumn.id === colId) {
            insertAt = i + 1;
            break;
          }
        }
        next.splice(insertAt, 0, created);
        return next;
      });
    },
  });
}
