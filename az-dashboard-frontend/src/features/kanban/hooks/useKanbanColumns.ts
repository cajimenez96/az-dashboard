"use client";

import { useQuery } from "@tanstack/react-query";

import type { KanbanArea } from "../api/types";
import { getKanbanColumns } from "../api/getKanbanColumns";

export function useKanbanColumns(area: KanbanArea) {
  return useQuery({
    queryKey: ["kanban-columns", area],
    queryFn: () => getKanbanColumns({ area }),
  });
}
