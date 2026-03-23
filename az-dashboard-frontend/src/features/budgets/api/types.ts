import type {
  BudgetListItem,
  BudgetStatus,
  CurrencyCode,
  ObligationStatus,
} from "@/features/finance/api/types";

export type { BudgetListItem, BudgetStatus, CurrencyCode };

export type PaymentPlanType = "PERCENTAGE" | "FIXED";

export interface PaymentPlanItemDto {
  id: string;
  order: number;
  type: PaymentPlanType;
  amount: string;
  dueDate: string;
}

export interface ObligationSummaryDto {
  id: string;
  amount: string;
  currency: CurrencyCode;
  dueDate: string;
  status: ObligationStatus;
  paymentPlanItemId: string | null;
}

export interface BudgetDetail extends BudgetListItem {
  paymentPlanItems: PaymentPlanItemDto[];
  obligations: ObligationSummaryDto[];
}

export interface CreatePaymentPlanItemPayload {
  order: number;
  type: PaymentPlanType;
  amount: string;
  dueDate: string;
}

export interface CreateBudgetPayload {
  title: string;
  description?: string;
  currency?: CurrencyCode;
  totalAmount: string;
  clientId: string;
  paymentPlanItems: CreatePaymentPlanItemPayload[];
}

export interface UpdateBudgetPayload {
  title?: string;
  description?: string;
  currency?: CurrencyCode;
  totalAmount?: string;
}
