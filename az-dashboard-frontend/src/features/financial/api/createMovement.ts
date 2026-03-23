import { apiClient } from "@/lib/api";

import type {
  CurrencyCode,
  FinancialMovementListItem,
  MovementType,
} from "@/features/finance/api/types";

export const PAYMENT_METHOD_CODES = [
  "CASH",
  "TRANSFER",
  "CARD",
  "OTHER",
] as const;

export type PaymentMethodCode = (typeof PAYMENT_METHOD_CODES)[number];

export interface CreateMovementPayload {
  type: MovementType;
  /** Decimal string matching backend: up to 2 fractional digits */
  amount: string;
  paymentMethod: PaymentMethodCode;
  /** ISO 8601 date string */
  date: string;
  description?: string;
  clientId?: string;
  obligationId?: string;
  currency?: CurrencyCode;
}

export async function createMovement(
  payload: CreateMovementPayload,
): Promise<FinancialMovementListItem> {
  const { data } = await apiClient.post<FinancialMovementListItem>(
    "/financial/movements",
    payload,
  );
  return data;
}
