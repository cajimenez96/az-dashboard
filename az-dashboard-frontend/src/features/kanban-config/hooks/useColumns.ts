"use client";

import type { KanbanArea } from "@/features/kanban/api/types";
import { useQuery } from "@tanstack/react-query";

import { getColumns } from "../api/getColumns";

export function useColumns(area: KanbanArea, enabled = true) {
  return useQuery({
    queryKey: ["kanban-columns", area],
    queryFn: () => getColumns(area),
    enabled,
    staleTime: 15_000,
  });
}
