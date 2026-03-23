import type { BudgetStatus } from "../api/types";
import { t } from "@/lib/i18n";

export function budgetStatusLabel(status: BudgetStatus): string {
  switch (status) {
    case "DRAFT":
      return t.budgets.statusDraft;
    case "SENT":
      return t.budgets.statusSent;
    case "ACCEPTED":
      return t.budgets.statusAccepted;
    case "REJECTED":
      return t.budgets.statusRejected;
    default:
      return status;
  }
}
