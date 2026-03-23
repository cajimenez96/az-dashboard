"use client";

import { useQuery } from "@tanstack/react-query";

import { getMovements } from "../api/getMovements";
import type { MovementQueryParams } from "../api/types";

export function useMovements(params?: MovementQueryParams) {
  return useQuery({
    queryKey: ["financial-movements", params ?? {}] as const,
    queryFn: () => getMovements(params),
    staleTime: 30_000,
  });
}
