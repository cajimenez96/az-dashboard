"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createMovement } from "../api/createMovement";

export function useCreateMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMovement,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}
