"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateSystem } from "../api/updateSystem";

export function useUpdateSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      clientId?: string;
      type?: "SAAS" | "CUSTOM";
      status?: "ACTIVE" | "MAINTENANCE" | "DEPRECATED";
      repoUrl?: string | null;
    }) => updateSystem(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["systems"] });
    },
  });
}
