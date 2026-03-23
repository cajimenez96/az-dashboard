"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { BudgetStatus } from "../api/types";
import { updateBudgetStatus } from "../api/updateBudgetStatus";

export function useUpdateBudgetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BudgetStatus }) =>
      updateBudgetStatus(id, status),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({ queryKey: ["budget", variables.id] });
    },
  });
}
