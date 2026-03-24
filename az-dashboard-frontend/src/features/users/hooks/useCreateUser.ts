"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createUser } from "../api/createUser";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
