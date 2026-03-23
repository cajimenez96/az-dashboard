export type MovementType = "INCOME" | "EXPENSE";

export type CurrencyCode = "ARS" | "USD";

export type BudgetStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";

export type ObligationStatus = "PENDING" | "PAID";

export interface FinancialMovementListItem {
  id: string;
  type: MovementType;
  currency: CurrencyCode;
  amount: string;
  description: string | null;
  paymentMethod: string;
  date: string;
  clientId: string | null;
  obligationId: string | null;
  createdAt: string;
  client: { id: string; name: string } | null;
  obligation: {
    id: string;
    amount: string;
    status: ObligationStatus;
  } | null;
}

export interface ObligationListItem {
  id: string;
  currency: CurrencyCode;
  amount: string;
  dueDate: string;
  status: ObligationStatus;
  clientId: string;
  budgetId: string | null;
  paymentPlanItemId: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; name: string };
}

export interface BudgetListItem {
  id: string;
  title: string;
  description: string | null;
  currency: CurrencyCode;
  totalAmount: string;
  status: BudgetStatus;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  client: { id: string; name: string };
}

export interface MovementQueryParams {
  clientId?: string;
  type?: MovementType;
  from?: string;
  to?: string;
  obligationId?: string;
}

export interface ObligationQueryParams {
  clientId?: string;
  status?: ObligationStatus;
  dueBefore?: string;
  budgetId?: string;
}

export interface BudgetQueryParams {
  clientId?: string;
  status?: BudgetStatus;
  includeDeleted?: boolean;
}
