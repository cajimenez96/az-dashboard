"use client";

import { useQuery } from "@tanstack/react-query";

import { getMovements } from "../api/getMovements";

export function useMovements() {
  return useQuery({
    queryKey: ["movements"],
    queryFn: () => getMovements(),
  });
}
