"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteClient } from "../api/deleteClient";

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
