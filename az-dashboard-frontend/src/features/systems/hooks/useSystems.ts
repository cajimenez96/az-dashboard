"use client";

import { useQuery } from "@tanstack/react-query";

import { getSystems } from "../api/getSystems";

export function useSystems() {
  return useQuery({
    queryKey: ["systems"],
    queryFn: getSystems,
    staleTime: 30_000,
  });
}
