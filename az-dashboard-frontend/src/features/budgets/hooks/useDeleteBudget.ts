"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteBudget } from "../api/deleteBudget";

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: (_void, id) => {
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.removeQueries({ queryKey: ["budget", id] });
    },
  });
}
