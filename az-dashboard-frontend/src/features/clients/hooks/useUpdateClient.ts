"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateClient } from "../api/updateClient";
import type { UpdateClientPayload } from "../api/types";

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateClientPayload;
    }) => updateClient(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
