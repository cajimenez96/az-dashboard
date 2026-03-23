"use client";

import { useQuery } from "@tanstack/react-query";

import { getTasks } from "../api/getTasks";

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });
}
