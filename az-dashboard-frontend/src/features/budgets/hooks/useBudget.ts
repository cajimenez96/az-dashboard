"use client";

import { useQuery } from "@tanstack/react-query";

import { getBudget } from "../api/getBudget";

export function useBudget(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["budget", id],
    queryFn: () => getBudget(id as string),
    enabled: Boolean(id && enabled),
  });
}
