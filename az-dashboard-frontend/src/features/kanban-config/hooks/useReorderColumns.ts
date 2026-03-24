"use client";

import type { KanbanArea } from "@/features/kanban/api/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reorderColumns } from "../api/reorderColumns";

export function useReorderColumns(area: KanbanArea) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderColumns(orderedIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["kanban-columns", area] });
    },
  });
}
