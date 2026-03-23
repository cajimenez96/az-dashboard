"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateTask } from "../api/updateTask";
import type { TaskListItem, UpdateTaskPayload } from "../api/types";

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTaskPayload;
    }) => updateTask(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<TaskListItem[]>(["tasks"], (old) => {
        if (!old) return [updated];
        return old.map((t) => (t.id === updated.id ? updated : t));
      });
    },
  });
}
