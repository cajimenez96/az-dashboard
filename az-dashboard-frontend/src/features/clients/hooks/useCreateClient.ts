"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "../api/createClient";
import type { CreateClientPayload } from "../api/types";

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClientPayload) => createClient(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
