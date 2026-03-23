"use client";

import { useQuery } from "@tanstack/react-query";

import { getObligations } from "@/features/finance/api/getObligations";

export function useLedgerObligations() {
  return useQuery({
    queryKey: ["obligations", "ledger-form"],
    queryFn: () => getObligations({ status: "PENDING" }),
  });
}
