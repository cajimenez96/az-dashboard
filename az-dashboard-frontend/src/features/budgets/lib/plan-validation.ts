import type { PaymentPlanType } from "../api/types";

export interface PlanRowInput {
  type: PaymentPlanType;
  amount: string;
  dueDate: string;
}

const EPS = 0.001;

function parseNum(raw: string): number {
  return Number.parseFloat(raw.trim().replace(",", "."));
}

/**
 * Reglas alineadas con `BudgetsService.validatePaymentPlanItems`.
 * - Solo PERCENTAGE: la suma debe ser 100.
 * - Si hay al menos un FIXED: la suma de FIXED ≤ total del presupuesto.
 * - Cada PERCENTAGE está entre 0 y 100.
 */
export function evaluatePaymentPlan(
  items: PlanRowInput[],
  totalBudget: number,
): {
  percentageSum: number;
  fixedSum: number;
  onlyPercentage: boolean;
  hasFixed: boolean;
  percentageRowsValid: boolean;
  percentageTotalOk: boolean;
  fixedTotalOk: boolean;
} {
  let percentageSum = 0;
  let fixedSum = 0;
  let percentageRowsValid = true;

  for (const it of items) {
    const n = parseNum(it.amount);
    if (!Number.isFinite(n) || n <= 0) {
      if (it.amount.trim() === "") {
        /* se valida en campo */
      }
      continue;
    }
    if (it.type === "PERCENTAGE") {
      percentageSum += n;
      if (n > 100 + EPS) percentageRowsValid = false;
    } else {
      fixedSum += n;
    }
  }

  const onlyPercentage =
    items.length > 0 && items.every((i) => i.type === "PERCENTAGE");
  const hasFixed = items.some((i) => i.type === "FIXED");

  const percentageTotalOk =
    !onlyPercentage || Math.abs(percentageSum - 100) <= EPS;

  const fixedTotalOk =
    !hasFixed || !Number.isFinite(totalBudget) || fixedSum <= totalBudget + EPS;

  return {
    percentageSum,
    fixedSum,
    onlyPercentage,
    hasFixed,
    percentageRowsValid,
    percentageTotalOk,
    fixedTotalOk,
  };
}

export function planIsSubmitReady(
  items: PlanRowInput[],
  totalBudget: number,
): boolean {
  if (items.length < 1) return false;
  const t = evaluatePaymentPlan(items, totalBudget);
  if (!t.percentageRowsValid) return false;
  if (!t.percentageTotalOk) return false;
  if (!t.fixedTotalOk) return false;
  for (const it of items) {
    if (!it.dueDate.trim()) return false;
    const n = parseNum(it.amount);
    if (!Number.isFinite(n) || n <= 0) return false;
  }
  return Number.isFinite(totalBudget) && totalBudget > 0;
}
