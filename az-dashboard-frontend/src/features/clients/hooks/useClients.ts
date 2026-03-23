"use client";

import { useQuery } from "@tanstack/react-query";

import { getClients } from "../api/getClients";

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  });
}
