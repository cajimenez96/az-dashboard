import { parseAmount } from "@/features/finance/lib/finance-compute";

import type { PaymentPlanType } from "../api/types";

export function resolvedPlanAmount(
  type: PaymentPlanType,
  itemAmount: string,
  totalAmount: string,
): number {
  const total = parseAmount(totalAmount);
  if (type === "PERCENTAGE") {
    return total * (parseAmount(itemAmount) / 100);
  }
  return parseAmount(itemAmount);
}
