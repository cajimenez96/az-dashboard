"use client";

import { Badge } from "@/components/ui/badge";
import type { BudgetStatus } from "@/features/budgets/api/types";
import { budgetStatusLabel } from "@/features/budgets/lib/budget-status-label";
import { cn } from "@/lib/utils";

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  const label = budgetStatusLabel(status);

  if (status === "DRAFT") {
    return (
      <Badge variant="secondary" className="font-medium">
        {label}
      </Badge>
    );
  }
  if (status === "SENT") {
    return (
      <Badge variant="default" className="font-medium">
        {label}
      </Badge>
    );
  }
  if (status === "ACCEPTED") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-emerald-500/50 bg-emerald-500/10 font-medium text-emerald-800 dark:text-emerald-300",
        )}
      >
        {label}
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="font-medium">
      {label}
    </Badge>
  );
}
