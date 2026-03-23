"use client";

import { useQuery } from "@tanstack/react-query";

import { getObligations } from "../api/getObligations";
import type { ObligationQueryParams } from "../api/types";

export function useObligations(params?: ObligationQueryParams) {
  return useQuery({
    queryKey: ["obligations", params ?? {}] as const,
    queryFn: () => getObligations(params),
    staleTime: 30_000,
  });
}
