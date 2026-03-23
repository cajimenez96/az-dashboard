"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateBudget } from "../api/updateBudget";

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      title?: string;
      description?: string;
      currency?: "ARS" | "USD";
      totalAmount?: string;
    }) => updateBudget(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({ queryKey: ["budget", variables.id] });
    },
  });
}
