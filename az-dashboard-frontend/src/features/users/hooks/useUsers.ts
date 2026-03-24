"use client";

import { useQuery } from "@tanstack/react-query";

import { getUsers } from "../api/getUsers";

export function useUsers(enabled: boolean) {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled,
    staleTime: 30_000,
  });
}
