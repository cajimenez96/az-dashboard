import { getApiErrorMessage } from "@/lib/get-api-error-message";

import { t } from "@/lib/i18n";

const CODES: Record<string, string> = {
  PERCENTAGE_MUST_SUM_100: t.budgets.errors.percentageSum,
  FIXED_EXCEEDS_TOTAL: t.budgets.errors.fixedExceeds,
  PERCENTAGE_OUT_OF_RANGE: t.budgets.errors.percentageRange,
  BUDGET_NOT_EDITABLE: t.budgets.errors.notEditable,
  BUDGET_NOT_DELETABLE: t.budgets.errors.notDeletable,
  BUDGET_ALREADY_CLOSED: t.budgets.errors.alreadyClosed,
  CLIENT_NOT_FOUND: t.budgets.errors.clientNotFound,
  BUDGET_NOT_FOUND: t.budgets.errors.notFound,
};

export function mapBudgetApiError(error: unknown): string {
  const base = getApiErrorMessage(error, t.toast.error);
  const code = typeof base === "string" ? base.trim() : "";
  if (code in CODES) return CODES[code];
  return base;
}
