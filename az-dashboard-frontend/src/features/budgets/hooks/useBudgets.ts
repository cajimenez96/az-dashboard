"use client";

import { useQuery } from "@tanstack/react-query";

import { getBudgets } from "../api/getBudgets";

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: getBudgets,
  });
}
