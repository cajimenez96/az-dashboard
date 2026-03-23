"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createBudget } from "../api/createBudget";

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
