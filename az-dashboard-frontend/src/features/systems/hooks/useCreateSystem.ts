"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createSystem } from "../api/createSystem";

export function useCreateSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSystem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["systems"] });
    },
  });
}
