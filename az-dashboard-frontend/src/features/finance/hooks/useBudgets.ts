"use client";

import { useQuery } from "@tanstack/react-query";

import { getBudgets } from "../api/getBudgets";
import type { BudgetQueryParams } from "../api/types";

export function useBudgets(params?: BudgetQueryParams) {
  return useQuery({
    queryKey: ["budgets", params ?? {}] as const,
    queryFn: () => getBudgets(params),
    staleTime: 60_000,
  });
}
