"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteTask } from "../api/deleteTask";
import type { TaskListItem } from "../api/types";

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<TaskListItem[]>(["tasks"], (old) =>
        old?.filter((t) => t.id !== id) ?? [],
      );
    },
  });
}
