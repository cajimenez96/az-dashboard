"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { UpdateUserPayload } from "../api/types";
import { updateUser } from "../api/updateUser";

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & UpdateUserPayload) => updateUser(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
